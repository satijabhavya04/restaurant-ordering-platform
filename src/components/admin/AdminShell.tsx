import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ShoppingBag,
  Receipt,
  Sparkles,
  Users,
  BarChart3,
  Settings,
  Menu as MenuIcon,
  X,
  Smartphone,
  Layers,
  ChefHat,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { AdminTab } from '../../types';

// Admin Workspace components
import { AdminOverview } from './AdminOverview';
import { MenuWorkspace } from './MenuManager/MenuWorkspace';
import { TablesQRWorkspace } from './TablesQR/TablesQRWorkspace';
import { OrdersHistoryWorkspace } from './OrdersHistory/OrdersHistoryWorkspace';
import { PaymentsAuditWorkspace } from './PaymentsAudit/PaymentsAuditWorkspace';
import { GameDiscountsWorkspace } from './GameDiscounts/GameDiscountsWorkspace';
import { StaffWorkspace } from './StaffManager/StaffWorkspace';
import { AnalyticsWorkspace } from './Analytics/AnalyticsWorkspace';
import { SettingsWorkspace } from './Settings/SettingsWorkspace';

export const AdminShell: React.FC = () => {
  const {
    adminTab,
    setAdminTab,
    setCurrentView,
    restaurantSettings,
    menuItems,
    tables,
    staffMembers,
    historicalOrders,
  } = useCustomer();
  const { currentStaff, staffLogout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeString, setTimeString] = useState('');

  // Live system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route/tab change
  const handleTabSelect = (tab: AdminTab) => {
    setAdminTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navItems: {
    tab: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      tab: 'OVERVIEW',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'MENU',
      label: 'Menu Catalog',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      badge: menuItems.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      tab: 'TABLES_QR',
      label: 'Tables & QRs',
      icon: <QrCode className="w-4 h-4" />,
      badge: tables.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      tab: 'ORDERS',
      label: 'Orders Audit',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: historicalOrders.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      tab: 'PAYMENTS',
      label: 'Payments & GST',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      tab: 'GAME_DISCOUNTS',
      label: 'Chef’s Game & Promo',
      icon: <Sparkles className="w-4 h-4 text-orange-600" />,
      badge: 'ACTIVE',
      badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200',
    },
    {
      tab: 'STAFF',
      label: 'Staff & Roles',
      icon: <Users className="w-4 h-4" />,
      badge: staffMembers.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      tab: 'ANALYTICS',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      tab: 'SETTINGS',
      label: 'Settings & Taxes',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* Top Admin Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200 shadow-xs">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-serif font-black text-xl text-white shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  {restaurantSettings.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentStaff?.role === 'OWNER_ADMIN' ? 'OWNER ADMIN' : currentStaff?.role || 'ADMIN'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live Reactive Engine
                </span>
                <span>•</span>
                <span className="font-mono text-slate-400">{timeString}</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Cross-Portal View Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated Staff Profile Badge */}
            {currentStaff && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800 leading-none">{currentStaff.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currentStaff.role === 'OWNER_ADMIN' ? 'Owner & Admin' : currentStaff.role}
                  </div>
                </div>
                <button
                  onClick={staffLogout}
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 transition-colors rounded cursor-pointer"
                  title="Sign Out of Admin Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Portal Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setCurrentView('CUSTOMER')}
                className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Preview Customer Mobile Web/PWA"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Customer App</span>
              </button>
              <button
                onClick={() => setCurrentView('RECEPTION')}
                className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Switch to Reception POS Console"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Reception POS</span>
              </button>
              <button
                onClick={() => setCurrentView('KITCHEN')}
                className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Switch to Kitchen KDS"
              >
                <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Kitchen</span>
              </button>
              <div className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs border border-slate-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 inline-block" />
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Layout: Fixed Sidebar + Scrollable Workspace */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (240px) */}
        <aside className="hidden lg:flex w-60 bg-white border-r border-slate-200 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Management Portal
            </div>

            {navItems.map((item) => {
              const isActive = adminTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabSelect(item.tab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 shadow-xs font-bold border-r-2 border-orange-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-orange-600' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Cloud Sync:</span>
              <span className="font-mono font-bold text-emerald-600">CONNECTED</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Terminal Security:</span>
              <span className="font-mono text-slate-700">AES-256 PIN</span>
            </div>
            <button
              onClick={() => setCurrentView('CUSTOMER')}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Launch Diner QR View</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide Drawer */}
            <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-serif font-black text-lg text-white shadow-xs">
                      P
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">The Spice Pavilion</div>
                      <div className="text-[10px] text-slate-500">Admin Control</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = adminTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => handleTabSelect(item.tab)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-orange-50 text-orange-700 font-bold border-r-2 border-orange-600'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-orange-600' : 'text-slate-500'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('CUSTOMER');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Switch to Customer App</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('RECEPTION');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Switch to Reception POS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {adminTab === 'OVERVIEW' && <AdminOverview />}
          {adminTab === 'MENU' && <MenuWorkspace />}
          {adminTab === 'TABLES_QR' && <TablesQRWorkspace />}
          {adminTab === 'ORDERS' && <OrdersHistoryWorkspace />}
          {adminTab === 'PAYMENTS' && <PaymentsAuditWorkspace />}
          {adminTab === 'GAME_DISCOUNTS' && <GameDiscountsWorkspace />}
          {adminTab === 'STAFF' && <StaffWorkspace />}
          {adminTab === 'ANALYTICS' && <AnalyticsWorkspace />}
          {adminTab === 'SETTINGS' && <SettingsWorkspace />}
        </main>
      </div>
    </div>
  );
};
