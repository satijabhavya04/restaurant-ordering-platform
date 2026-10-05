import React, { useState } from 'react';
import {
  Compass,
  Smartphone,
  Layers,
  ChefHat,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  KeyRound,
  Lock,
  LogOut,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { AppView } from '../../types';

export const DevNavSwitcher: React.FC = () => {
  // Only show in development or non-production environment
  const isDev = import.meta.env.DEV;
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentView, setCurrentView } = useCustomer();
  const { currentStaff, staffLogout, isAuthenticated } = useAuth();

  if (!isDev) {
    return null;
  }

  const routes: {
    view: AppView;
    path: string;
    label: string;
    icon: React.ReactNode;
    badgeColor: string;
    requiresAuth: boolean;
  }[] = [
    {
      view: 'CUSTOMER',
      path: '/customer',
      label: 'Customer PWA',
      icon: <Smartphone className="w-3.5 h-3.5" />,
      badgeColor: 'text-brand-400',
      requiresAuth: false,
    },
    {
      view: 'STAFF_LOGIN',
      path: '/staff/login',
      label: 'Staff Portal Login',
      icon: <KeyRound className="w-3.5 h-3.5" />,
      badgeColor: 'text-amber-400',
      requiresAuth: false,
    },
    {
      view: 'RECEPTION',
      path: '/reception',
      label: 'Reception POS',
      icon: <Layers className="w-3.5 h-3.5" />,
      badgeColor: 'text-blue-400',
      requiresAuth: true,
    },
    {
      view: 'KITCHEN',
      path: '/kitchen',
      label: 'Kitchen KDS',
      icon: <ChefHat className="w-3.5 h-3.5" />,
      badgeColor: 'text-emerald-400',
      requiresAuth: true,
    },
    {
      view: 'ADMIN',
      path: '/admin',
      label: 'Admin Portal',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      badgeColor: 'text-purple-400',
      requiresAuth: true,
    },
  ];

  return (
    <div
      data-dev-nav
      className="fixed bottom-4 left-4 z-50 flex flex-col items-start font-sans select-none"
    >
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-2 w-72 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="font-mono text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Dev Environment Routes
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
              LOCAL
            </span>
          </div>

          {/* Staff Auth Status Pill */}
          {isAuthenticated && currentStaff ? (
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                  {currentStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[11px] text-slate-200 truncate leading-tight">
                    {currentStaff.name}
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono leading-tight">
                    {currentStaff.role}
                  </div>
                </div>
              </div>
              <button
                onClick={staffLogout}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono transition-colors p-1"
                title="Log Out Staff"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
              <span>Staff unauthenticated (guards active)</span>
            </div>
          )}

          <div className="space-y-1">
            {routes.map((r) => {
              const isActive = currentView === r.view;
              return (
                <button
                  key={r.view}
                  onClick={() => {
                    setCurrentView(r.view);
                    setIsExpanded(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-bold ring-1 ring-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={r.badgeColor}>{r.icon}</span>
                    <span>{r.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {r.requiresAuth && !isAuthenticated && (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                    <span className="font-mono text-[10px] text-slate-500">
                      {r.path}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            Dev-only switcher • Hidden in production
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-lg hover:bg-slate-900 flex items-center gap-2 backdrop-blur-md border border-slate-700/80 transition-transform active:scale-95 cursor-pointer"
        title="Development Route Switcher"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[10px] text-slate-300">
          Route: <strong className="text-white">/{currentView.toLowerCase()}</strong>
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronUp className="w-3 h-3 text-slate-400" />
        )}
      </button>
    </div>
  );
};
