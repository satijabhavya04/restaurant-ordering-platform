import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, KeyRound, Smartphone, Layers, ChefHat, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { StaffRole } from '../../types';

interface UnauthorizedViewProps {
  requiredRoles?: StaffRole[];
  attemptedRoute?: string;
  customMessage?: string;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  requiredRoles = [],
  attemptedRoute,
  customMessage,
}) => {
  const { currentStaff, staffLogout, isAuthenticated } = useAuth();
  const { setCurrentView } = useCustomer();

  const getPermittedHome = (): { label: string; view: 'CUSTOMER' | 'RECEPTION' | 'KITCHEN' | 'ADMIN'; icon: React.ReactNode } => {
    if (!isAuthenticated || !currentStaff) {
      return { label: 'Return to Table Dining', view: 'CUSTOMER', icon: <Smartphone className="w-4 h-4" /> };
    }
    switch (currentStaff.role) {
      case 'KITCHEN':
        return { label: 'Go to Kitchen Line Station (KDS)', view: 'KITCHEN', icon: <ChefHat className="w-4 h-4" /> };
      case 'WAITER':
      case 'CASHIER':
        return { label: 'Go to Reception / Operations', view: 'RECEPTION', icon: <Layers className="w-4 h-4" /> };
      case 'MANAGER':
      case 'OWNER_ADMIN':
      default:
        return { label: 'Go to Admin Dashboard', view: 'ADMIN', icon: <Building2 className="w-4 h-4" /> };
    }
  };

  const homeTarget = getPermittedHome();

  const roleNames: Record<StaffRole, string> = {
    OWNER_ADMIN: 'Owner / Administrator',
    MANAGER: 'Floor Manager',
    WAITER: 'Service Waiter',
    CASHIER: 'Cashier / Billing',
    KITCHEN: 'Kitchen Chef / Cook',
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-crimson-600 selection:text-white">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-crimson-950/80 border border-crimson-700/60 flex items-center justify-center mx-auto text-crimson-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-crimson-900/60 text-crimson-300 border border-crimson-700/50">
            HTTP 403 • SECURITY BOUNDARY ENFORCED
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {customMessage ||
              'You do not possess the required credentials or operational role permissions to access this restricted subsystem.'}
          </p>
        </div>

        {/* Security Audit Breakdown Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-500">Attempted Route:</span>
            <span className="font-bold text-amber-400">{attemptedRoute || window.location.pathname}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-500">Authenticated Actor:</span>
            <span className="font-bold text-slate-200">
              {isAuthenticated && currentStaff ? `${currentStaff.name}` : 'Unauthenticated Diner / Anon'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-500">Active Role:</span>
            <span className="font-bold text-slate-300">
              {isAuthenticated && currentStaff ? roleNames[currentStaff.role] : 'CUSTOMER_GUEST'}
            </span>
          </div>

          {requiredRoles.length > 0 && (
            <div className="flex items-start justify-between text-[11px] pt-0.5">
              <span className="text-slate-500">Required Roles:</span>
              <span className="font-bold text-emerald-400 text-right">
                {requiredRoles.map((r) => roleNames[r] || r).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary: Return to authorized station */}
          <button
            onClick={() => setCurrentView(homeTarget.view)}
            className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md cursor-pointer"
          >
            {homeTarget.icon}
            <span>{homeTarget.label}</span>
          </button>

          {/* Secondary: If staff, allow logout / re-login */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                staffLogout();
                window.location.href = '/staff/login';
              }}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out & Switch Account</span>
            </button>
          ) : (
            <button
              onClick={() => {
                window.location.href = '/staff/login';
              }}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Restaurant Staff Sign In</span>
            </button>
          )}

          {/* Fallback link to Customer Menu */}
          <div className="text-center pt-2">
            <button
              onClick={() => setCurrentView('CUSTOMER')}
              className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Return to Table QR Dining</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
