import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Grid,
  ChefHat,
  Bell,
  CreditCard,
  SlidersHorizontal,
  CheckCircle2,
  Smartphone,
  ChevronDown,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { ReceptionTab, StaffRole } from '../../types';
import { ReceptionOverview } from './ReceptionOverview';
import { TablesWorkspace } from './TablesWorkspace';
import { OrdersWorkspace } from './OrdersWorkspace';
import { RequestsWorkspace } from './RequestsWorkspace';
import { PaymentsWorkspace } from './PaymentsWorkspace';
import { MenuStockManager } from './MenuStockManager';
import { TableDetailDrawer } from './TableDetailDrawer';
import { StaffOrderModal } from './StaffOrderModal';
import { CashPaymentModal } from './CashPaymentModal';
import { ClearTableDialog } from './ClearTableDialog';

export const ReceptionShell: React.FC = () => {
  const {
    currentStaffRole,
    setCurrentStaffRole,
    receptionTab,
    setReceptionTab,
    tables,
    selectedTableId,
    setSelectedTableId,
    setCurrentView,
    menuItems,
  } = useCustomer();
  const { currentStaff, staffLogout, hasRole, switchDevStaffRole } = useAuth();

  // Local modal states
  const [staffOrderTableId, setStaffOrderTableId] = useState<string | null>(null);
  const [cashModalTableId, setCashModalTableId] = useState<string | null>(null);
  const [clearTableId, setClearTableId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live digital clock
  const [timeString, setTimeString] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;
  const cashModalTable = tables.find((t) => t.id === cashModalTableId) || null;
  const clearModalTable = tables.find((t) => t.id === clearTableId) || null;

  // Real-time Badge counts
  const openRequestsCount = tables.reduce((acc, t) => {
    if (!t.session?.serviceRequests) return acc;
    return (
      acc +
      t.session.serviceRequests.filter(
        (r) => r.status === 'REQUESTED' || r.status === 'ACKNOWLEDGED'
      ).length
    );
  }, 0);

  const activeOrdersCount = tables.reduce((acc, t) => {
    if (!t.session?.orderBatches) return acc;
    return (
      acc +
      t.session.orderBatches.filter(
        (b) =>
          b.status === 'NEW' ||
          b.status === 'SUBMITTED' ||
          b.status === 'PREPARING' ||
          b.status === 'READY'
      ).length
    );
  }, 0);

  const pendingPaymentsCount = tables.filter((t) => t.status === 'PAYMENT_PENDING').length;
  const activeTablesCount = tables.filter((t) => t.status !== 'AVAILABLE').length;
  const outOfStockCount = menuItems.filter((i) => !i.isAvailable).length;

  const roleLabels: Record<StaffRole, string> = {
    OWNER_ADMIN: 'Owner / Admin',
    MANAGER: 'Floor Manager',
    WAITER: 'Service Waiter',
    CASHIER: 'Cashier / Billing',
    KITCHEN: 'Kitchen Chef',
  };

  const navItems: {
    tab: ReceptionTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      tab: 'OVERVIEW',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'TABLES',
      label: 'Tables',
      icon: <Grid className="w-4 h-4" />,
      badge: activeTablesCount,
      badgeColor: 'bg-slate-200 text-slate-800',
    },
    {
      tab: 'ORDERS',
      label: 'Kitchen Orders',
      icon: <ChefHat className="w-4 h-4" />,
      badge: activeOrdersCount,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      tab: 'REQUESTS',
      label: 'Service Calls',
      icon: <Bell className="w-4 h-4" />,
      badge: openRequestsCount,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      tab: 'PAYMENTS',
      label: 'Billing & Cash',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingPaymentsCount,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      tab: 'MENU_STOCK',
      label: '86’d Menu',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      badge: outOfStockCount,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Operations Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-serif font-black text-xl text-white shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">The Spice Pavilion</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  OPS CONSOLE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live Reactive Sync
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">{timeString}</span>
              </div>
            </div>
          </div>

          {/* Center/Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated Staff Pill */}
            {currentStaff && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-[9px]">
                  {currentStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <span className="font-bold text-slate-200 truncate max-w-[100px]">{currentStaff.name}</span>
                <button
                  onClick={staffLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded"
                  title="Sign Out of Station"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Staff Role Selector */}
            <div className="relative flex items-center">
              <span className="hidden md:inline text-xs text-slate-400 mr-2 font-medium">
                Role:
              </span>
              <div className="relative">
                <select
                  value={currentStaffRole}
                  onChange={(e) => {
                    const r = e.target.value as StaffRole;
                    setCurrentStaffRole(r);
                    switchDevStaffRole(r);
                  }}
                  className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl hover:bg-slate-700/80 focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="OWNER_ADMIN">Owner / Admin</option>
                  <option value="MANAGER">Floor Manager</option>
                  <option value="WAITER">Service Waiter</option>
                  <option value="CASHIER">Cashier / Billing</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Switch to Customer App Button */}
            <button
              type="button"
              onClick={() => setCurrentView('CUSTOMER')}
              className="py-1.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Open Customer Mobile PWA View (Table 04)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer App</span>
              <span className="text-[10px] font-mono bg-white/20 px-1 py-0.2 rounded font-normal">
                T04 Sync
              </span>
            </button>

            {/* Switch to Kitchen KDS Button */}
            <button
              type="button"
              onClick={() => setCurrentView('KITCHEN')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border border-slate-700"
              title="Open Kitchen Display System (KDS)"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">KDS</span>
            </button>

            {/* Switch to Admin Portal Button (Strictly Guarded for OWNER_ADMIN and MANAGER) */}
            {hasRole(['OWNER_ADMIN', 'MANAGER']) && (
              <button
                type="button"
                onClick={() => setCurrentView('ADMIN')}
                className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Open Admin / Owner Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <button
              onClick={staffLogout}
              className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 font-bold text-xs flex lg:hidden items-center gap-1 border border-slate-700"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Mobile Navigation Scrollbar */}
        <div className="md:hidden border-t border-slate-800 bg-slate-900/90 overflow-x-auto px-4 py-2 scrollbar-none flex items-center gap-1">
          {navItems.map((item) => {
            const isSelected = receptionTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setReceptionTab(item.tab)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeColor || 'bg-slate-700 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container with Desktop Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Navigation (min 220px) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-6">
          {/* Navigation Group */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Operations Center
            </span>
            {navItems.map((item) => {
              const isSelected = receptionTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setReceptionTab(item.tab)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isSelected ? 'text-brand-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Staff Info Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Active Shift</span>
              <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Dinner
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Role: <strong className="text-slate-700">{roleLabels[currentStaffRole]}</strong>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
              Connected to 10 live table nodes across 3 floor sections.
            </div>
          </div>
        </aside>

        {/* Content Workspace Area */}
        <main className="flex-1 min-w-0">
          {receptionTab === 'OVERVIEW' && (
            <ReceptionOverview
              onOpenTable={(id) => setSelectedTableId(id)}
              onOpenCashModal={(id) => setCashModalTableId(id)}
              onOpenStaffOrder={(id) => setStaffOrderTableId(id)}
            />
          )}

          {receptionTab === 'TABLES' && (
            <TablesWorkspace
              onOpenTable={(id) => setSelectedTableId(id)}
              onOpenStaffOrder={(id) => setStaffOrderTableId(id)}
            />
          )}

          {receptionTab === 'ORDERS' && (
            <OrdersWorkspace onOpenTable={(id) => setSelectedTableId(id)} />
          )}

          {receptionTab === 'REQUESTS' && (
            <RequestsWorkspace onOpenTable={(id) => setSelectedTableId(id)} />
          )}

          {receptionTab === 'PAYMENTS' && (
            <PaymentsWorkspace
              onOpenTable={(id) => setSelectedTableId(id)}
              onOpenCashModal={(id) => setCashModalTableId(id)}
            />
          )}

          {receptionTab === 'MENU_STOCK' && <MenuStockManager />}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Table Detail Drawer */}
      <TableDetailDrawer
        table={selectedTable}
        onClose={() => setSelectedTableId(null)}
        onOpenStaffOrder={(id) => {
          setSelectedTableId(null);
          setStaffOrderTableId(id);
        }}
        onOpenCashModal={(id) => {
          setSelectedTableId(null);
          setCashModalTableId(id);
        }}
        onOpenClearModal={(id) => {
          setSelectedTableId(null);
          setClearTableId(id);
        }}
      />

      {/* Staff Order Modal */}
      {staffOrderTableId !== null && (
        <StaffOrderModal
          isOpen={staffOrderTableId !== null}
          tableId={staffOrderTableId}
          tables={tables}
          onClose={() => setStaffOrderTableId(null)}
          onSuccess={(msg: string) => setToastMessage(msg)}
        />
      )}

      {/* Cash Payment Modal */}
      <CashPaymentModal
        table={cashModalTable}
        onClose={() => setCashModalTableId(null)}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      {/* Clear Table Confirmation Dialog */}
      <ClearTableDialog
        table={clearModalTable}
        onClose={() => setClearTableId(null)}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  );
};
