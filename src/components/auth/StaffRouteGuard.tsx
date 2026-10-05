import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffRole } from '../../types';

const StaffLoginView = React.lazy(() =>
  import('./StaffLoginView').then((m) => ({ default: m.StaffLoginView }))
);
const UnauthorizedView = React.lazy(() =>
  import('./UnauthorizedView').then((m) => ({ default: m.UnauthorizedView }))
);

interface StaffRouteGuardProps {
  allowedRoles: StaffRole[];
  children: React.ReactNode;
}

export const StaffRouteGuard: React.FC<StaffRouteGuardProps> = ({ allowedRoles, children }) => {
  const { currentStaff, isAuthenticated } = useAuth();

  // 1. Unauthenticated staff check: must authenticate at staff login portal
  if (!isAuthenticated || !currentStaff) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading login portal...</div>}>
        <StaffLoginView redirectAfterLogin={window.location.pathname} />
      </React.Suspense>
    );
  }

  // 2. Role-Based Access Control (RBAC) authorization check
  if (!allowedRoles.includes(currentStaff.role)) {
    const roleLabels: Record<StaffRole, string> = {
      OWNER_ADMIN: 'Owner / Administrator',
      MANAGER: 'Floor Manager',
      WAITER: 'Service Waiter',
      CASHIER: 'Cashier / Billing',
      KITCHEN: 'Kitchen Chef / Line Cook',
    };

    const currentRoleLabel = roleLabels[currentStaff.role] || currentStaff.role;
    const requiredRoleLabels = allowedRoles.map((r) => roleLabels[r] || r).join(', ');

    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading authorization...</div>}>
        <UnauthorizedView
          requiredRoles={allowedRoles}
          attemptedRoute={window.location.pathname}
          customMessage={`Your authenticated staff account (${currentStaff.name}) has role ${currentRoleLabel}. This subsystem requires ${requiredRoleLabels} authorization.`}
        />
      </React.Suspense>
    );
  }

  // Authorized
  return <>{children}</>;
};
