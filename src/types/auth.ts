import { StaffRole } from './index';

export type StaffPermission =
  | 'VIEW_ADMIN'
  | 'MANAGE_MENU'
  | 'MANAGE_TABLES'
  | 'MANAGE_STAFF'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_RECEPTION'
  | 'ASSIST_ORDER'
  | 'CONFIRM_PAYMENT'
  | 'CLEAR_TABLE'
  | 'VIEW_KDS'
  | 'BUMP_KDS_ORDERS';

export interface StaffSessionToken {
  token: string;
  staffId: string;
  restaurantId: string;
  name: string;
  email: string;
  role: StaffRole;
  permissions: StaffPermission[];
  expiresAt: number;
}

export interface CustomerSessionToken {
  token: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  sessionId: string;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
  staffSession?: StaffSessionToken;
  customerSession?: CustomerSessionToken;
}

export interface SecurityViolation {
  code: 'UNAUTHENTICATED' | 'UNAUTHORIZED_ROLE' | 'DINING_SESSION_CLOSED' | 'IDOR_VIOLATION' | 'INVALID_TENANT';
  message: string;
  attemptedResource: string;
  requiredRole?: StaffRole[];
  currentRole?: StaffRole | 'CUSTOMER_ANON';
}

export const ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  OWNER_ADMIN: [
    'VIEW_ADMIN',
    'MANAGE_MENU',
    'MANAGE_TABLES',
    'MANAGE_STAFF',
    'VIEW_ANALYTICS',
    'MANAGE_SETTINGS',
    'VIEW_RECEPTION',
    'ASSIST_ORDER',
    'CONFIRM_PAYMENT',
    'CLEAR_TABLE',
    'VIEW_KDS',
    'BUMP_KDS_ORDERS',
  ],
  MANAGER: [
    'VIEW_ADMIN',
    'MANAGE_MENU',
    'MANAGE_TABLES',
    'VIEW_ANALYTICS',
    'VIEW_RECEPTION',
    'ASSIST_ORDER',
    'CONFIRM_PAYMENT',
    'CLEAR_TABLE',
    'VIEW_KDS',
    'BUMP_KDS_ORDERS',
  ],
  CASHIER: [
    'VIEW_RECEPTION',
    'ASSIST_ORDER',
    'CONFIRM_PAYMENT',
    'CLEAR_TABLE',
  ],
  WAITER: [
    'VIEW_RECEPTION',
    'ASSIST_ORDER',
    'CLEAR_TABLE',
  ],
  KITCHEN: [
    'VIEW_KDS',
    'BUMP_KDS_ORDERS',
  ],
};
