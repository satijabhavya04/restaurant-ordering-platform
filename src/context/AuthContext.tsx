import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffRole, StaffMember } from '../types';
import {
  StaffSessionToken,
  CustomerSessionToken,
  StaffPermission,
  ROLE_PERMISSIONS,
} from '../types/auth';
import { SEED_STAFF } from '../data/seedAdmin';
import { securityGateway } from '../services/securityGateway';

interface AuthContextType {
  // Staff Auth
  currentStaff: StaffSessionToken | null;
  isAuthenticated: boolean;
  staffRole: StaffRole | null;
  staffLogin: (identifier: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  staffLogout: () => void;
  hasRole: (allowedRoles: StaffRole[]) => boolean;
  hasPermission: (permission: StaffPermission) => boolean;

  // Customer Table Session Auth
  customerSession: CustomerSessionToken | null;
  bootstrapCustomerSession: (tableId: string, restaurantId?: string) => CustomerSessionToken;
  invalidateCustomerSession: () => void;
  isCustomerSessionValid: boolean;

  // Dev shortcut to test role transitions
  switchDevStaffRole: (role: StaffRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STAFF_SESSION_STORAGE_KEY = 'resto_staff_auth_v1';
const CUSTOMER_SESSION_STORAGE_KEY = 'resto_customer_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Staff Session State (Restored from sessionStorage)
  const [currentStaff, setCurrentStaff] = useState<StaffSessionToken | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem(STAFF_SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StaffSessionToken = JSON.parse(saved);
        if (Date.now() < parsed.expiresAt) {
          return parsed;
        }
        sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
      } catch {
        sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
      }
    }
    return null;
  });

  // 2. Customer Ephemeral Session Token (Restored from URL QR scan or localStorage)
  const [customerSession, setCustomerSession] = useState<CustomerSessionToken | null>(() => {
    if (typeof window === 'undefined') return null;

    // Check for ?table= query parameter from physical table QR scan
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table') || params.get('tableId');
    const restoParam = params.get('resto') || params.get('restaurantId') || 'resto_spice_pavilion_01';

    if (tableParam) {
      const tableNumber = tableParam.startsWith('tbl_')
        ? `Table ${tableParam.replace('tbl_', '')}`
        : tableParam;
      const token = securityGateway.issueCustomerToken(
        restoParam,
        tableParam,
        tableNumber,
        `ds_${tableParam}_live`
      );
      try {
        localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(token));
      } catch {
        // Ignore storage errors
      }
      return token;
    }

    const saved = localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: CustomerSessionToken = JSON.parse(saved);
        if (Date.now() < parsed.expiresAt) {
          return parsed;
        }
        localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
      } catch {
        localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
      }
    }
    // Default bootstrap for Table 04 initial dining experience
    const initial = securityGateway.issueCustomerToken(
      'resto_spice_pavilion_01',
      'tbl_04',
      'Table 04',
      'ds_8821'
    );
    try {
      localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(initial));
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return initial;
  });

  // Persist staff session changes
  useEffect(() => {
    if (currentStaff) {
      sessionStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(currentStaff));
    } else {
      sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
    }
  }, [currentStaff]);

  // Persist customer session changes
  useEffect(() => {
    if (customerSession) {
      localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(customerSession));
    } else {
      localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    }
  }, [customerSession]);

  /**
   * Authenticates a staff member using Email/Identifier and 4-Digit Security PIN.
   */
  const staffLogin = async (
    identifier: string,
    pin: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPin = pin.trim();

    // Check staff directory
    const matchedStaff: StaffMember | undefined = SEED_STAFF.find(
      (s) =>
        s.email.toLowerCase() === trimmedId ||
        s.name.toLowerCase() === trimmedId ||
        s.id.toLowerCase() === trimmedId ||
        s.role.toLowerCase() === trimmedId
    );

    if (!matchedStaff) {
      return {
        success: false,
        message: 'Invalid staff credential or account not registered in restaurant directory.',
      };
    }

    if (matchedStaff.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'This staff account has been deactivated by administrator. Access revoked.',
      };
    }

    if (matchedStaff.pin !== trimmedPin) {
      return {
        success: false,
        message: 'Incorrect 4-digit security PIN. Access denied.',
      };
    }

    // Issue cryptographic staff token
    const token = securityGateway.issueStaffToken(
      matchedStaff.id,
      'resto_spice_pavilion_01',
      matchedStaff.role,
      matchedStaff.name,
      matchedStaff.email
    );

    setCurrentStaff(token);
    return { success: true };
  };

  /**
   * Logs out the current staff member and revokes privileges.
   */
  const staffLogout = () => {
    setCurrentStaff(null);
    sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
  };

  /**
   * Verifies if current authenticated staff has one of the required roles.
   */
  const hasRole = (allowedRoles: StaffRole[]): boolean => {
    if (!currentStaff) return false;
    return allowedRoles.includes(currentStaff.role);
  };

  /**
   * Verifies if current authenticated staff possesses a specific operational permission.
   */
  const hasPermission = (permission: StaffPermission): boolean => {
    if (!currentStaff) return false;
    return (
      currentStaff.permissions.includes(permission) ||
      ROLE_PERMISSIONS[currentStaff.role]?.includes(permission)
    );
  };

  /**
   * Bootstraps customer session when a table QR is scanned.
   */
  const bootstrapCustomerSession = (
    tableId: string,
    restaurantId: string = 'resto_spice_pavilion_01'
  ): CustomerSessionToken => {
    const newSession = securityGateway.issueCustomerToken(
      restaurantId,
      tableId,
      tableId.replace('tbl_', 'Table '),
      `ds_${Date.now()}`
    );
    setCustomerSession(newSession);
    return newSession;
  };

  /**
   * Invalidates customer session when table is closed.
   */
  const invalidateCustomerSession = () => {
    setCustomerSession(null);
    localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
  };

  /**
   * Development-only utility to switch staff roles easily during testing.
   */
  const switchDevStaffRole = (role: StaffRole) => {
    const staffSample = SEED_STAFF.find((s) => s.role === role) || SEED_STAFF[0];
    const token = securityGateway.issueStaffToken(
      staffSample.id,
      'resto_spice_pavilion_01',
      role,
      staffSample.name,
      staffSample.email
    );
    setCurrentStaff(token);
  };

  return (
    <AuthContext.Provider
      value={{
        currentStaff,
        isAuthenticated: Boolean(currentStaff),
        staffRole: currentStaff?.role || null,
        staffLogin,
        staffLogout,
        hasRole,
        hasPermission,
        customerSession,
        bootstrapCustomerSession,
        invalidateCustomerSession,
        isCustomerSessionValid: Boolean(customerSession && Date.now() < customerSession.expiresAt),
        switchDevStaffRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
