import React from 'react';
import { useCustomer } from './context/CustomerContext';
import { CustomerHeader } from './components/customer/CustomerHeader';
import { CategoryTabs } from './components/customer/CategoryTabs';
import { DietaryFilterBar } from './components/customer/DietaryFilterBar';
import { FoodCard } from './components/customer/FoodCard';
import { FoodDetailModal } from './components/customer/FoodDetailModal';
import { CartDock } from './components/customer/CartDock';
import { CartDrawer } from './components/customer/CartDrawer';
import { OrderTrackingView } from './components/customer/OrderTrackingView';
import { ServiceRequestSheet } from './components/customer/ServiceRequestSheet';
import { ChefGameModal } from './components/customer/ChefGameModal';
import { BillAndPaymentView } from './components/customer/BillAndPaymentView';
import { ReceiptModal } from './components/customer/ReceiptModal';
import { SessionClosedView } from './components/customer/SessionClosedView';
import { ItemUnavailableRecoverySheet } from './components/customer/ItemUnavailableRecoverySheet';
import { OfflineBanner } from './components/customer/OfflineBanner';
import { SearchOverlay } from './components/customer/SearchOverlay';
import { DevNavSwitcher } from './components/common/DevNavSwitcher';
import { StaffRouteGuard } from './components/auth/StaffRouteGuard';
import { CustomerSessionGuard } from './components/auth/CustomerSessionGuard';

// Route-Level Code Splitting (Customer bundles isolated from Staff portals)
const ReceptionShell = React.lazy(() =>
  import('./components/reception/ReceptionShell').then((m) => ({ default: m.ReceptionShell }))
);
const AdminShell = React.lazy(() =>
  import('./components/admin/AdminShell').then((m) => ({ default: m.AdminShell }))
);
const KitchenDisplayShell = React.lazy(() =>
  import('./components/kitchen/KitchenDisplayShell').then((m) => ({ default: m.KitchenDisplayShell }))
);
const StaffLoginView = React.lazy(() =>
  import('./components/auth/StaffLoginView').then((m) => ({ default: m.StaffLoginView }))
);
import { ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { Button } from './components/common/Button';

export const App: React.FC = () => {
  const {
    session,
    menuItems,
    categories,
    activeCategory,
    dietaryFilter,
    selectedItemForDetail,
    closeDetail,
    cartItems,
    cartSubtotal,
    openCart,
    currentView,
    isSearchOpen,
    openSearch,
    closeSearch,
    openTracking,
  } = useCustomer();

  // Staff Login View (direct route /staff/login or redirected)
  if (currentView === 'STAFF_LOGIN') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading login portal...</div>}>
        <StaffLoginView />
        <DevNavSwitcher />
      </React.Suspense>
    );
  }

  // If in Admin / Owner mode, render the Admin Portal (Strictly Guarded for OWNER_ADMIN and MANAGER)
  if (currentView === 'ADMIN') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading Admin portal...</div>}>
        <StaffRouteGuard allowedRoles={['OWNER_ADMIN', 'MANAGER']}>
          <AdminShell />
          <DevNavSwitcher />
        </StaffRouteGuard>
      </React.Suspense>
    );
  }

  // If in Reception / Operations Center mode, render the Reception Console (Guarded for Staff Roles)
  if (currentView === 'RECEPTION') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading Reception console...</div>}>
        <StaffRouteGuard allowedRoles={['OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER']}>
          <ReceptionShell />
          <DevNavSwitcher />
        </StaffRouteGuard>
      </React.Suspense>
    );
  }

  // If in Kitchen Display System mode, render the Kitchen KDS Console (Guarded for Kitchen & Management)
  if (currentView === 'KITCHEN') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">Loading Kitchen KDS...</div>}>
        <StaffRouteGuard allowedRoles={['OWNER_ADMIN', 'MANAGER', 'KITCHEN']}>
          <KitchenDisplayShell />
          <DevNavSwitcher />
        </StaffRouteGuard>
      </React.Suspense>
    );
  }

  // If session is closed / expired / cleared, show the lockout screen
  if (session.status === 'CLOSED') {
    return <SessionClosedView />;
  }

  // Filter items according to active category and dietary filter
  const displayedCategories =
    !activeCategory || activeCategory === 'ALL' ? categories : [activeCategory];

  return (
    <CustomerSessionGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-brand-100 selection:text-brand-900">
        {/* Offline Status Alert Banner */}
        <OfflineBanner />

        {/* Persistent Customer Header */}
        <CustomerHeader onSearchClick={openSearch} />

        {/* Sticky Category Tabs Rail */}
        <CategoryTabs />

        {/* Dietary Quick Filter Chips */}
        <DietaryFilterBar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 pb-28">
          <div className="flex gap-8 items-start">
            {/* Main Menu Feed (Responsive 1-col on mobile, 2-col on tablet, 2-col on desktop split) */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Persistent Active Order Indicator Banner */}
              {session.orderBatches.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          Active Order: Round {session.orderBatches.length} in Kitchen
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 uppercase">
                          {session.orderBatches[session.orderBatches.length - 1].status}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-600 truncate mt-0.5">
                        Your dishes are being prepared for {session.tableNumber}.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openTracking}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="shrink-0 bg-white border-amber-300 text-amber-900 font-bold hover:bg-amber-100"
                  >
                    Track
                  </Button>
                </div>
              )}
              {displayedCategories.map((category) => {
                const categoryItems = menuItems.filter((item) => {
                  if (item.category !== category) return false;
                  if (dietaryFilter === 'VEG') return item.diet === 'VEG';
                  if (dietaryFilter === 'NON_VEG') return item.diet === 'NON_VEG';
                  if (dietaryFilter === 'BESTSELLER') return item.isBestseller;
                  return true;
                });

                if (categoryItems.length === 0) return null;

                return (
                  <section key={category} className="space-y-3.5 scroll-mt-28">
                    {/* Category Header */}
                    <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        {category}
                      </h2>
                      <span className="text-xs font-semibold text-slate-400">
                        {categoryItems.length} dish{categoryItems.length === 1 ? '' : 'es'}
                      </span>
                    </div>

                    {/* Food Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                      {categoryItems.map((item) => (
                        <FoodCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Desktop Persistent Order / Cart Panel (>=1024px) */}
            <div className="hidden lg:block w-80 shrink-0 sticky top-28 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <ShoppingBag className="w-4 h-4 text-brand-600" />
                    <span>Table Cart</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                    <p>Your cart is empty.</p>
                    <p className="text-[11px]">Select items from the menu to start ordering.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                      {cartItems.map((ci) => (
                        <div key={ci.cartItemId} className="py-2 flex justify-between items-start text-xs">
                          <div className="pr-2 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {ci.quantity}x {ci.item.name}
                            </div>
                            {ci.selectedModifiers.length > 0 && (
                              <div className="text-[10px] text-slate-500">
                                {ci.selectedModifiers.map((m) => m.optionName).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-800 tabular-nums">
                            ₹{ci.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ₹{cartSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={openCart}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Review & Send Order
                    </Button>
                  </div>
                )}
              </div>

              {/* Active Session Mini Tracker */}
              {session.orderBatches.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Kitchen Rounds Placed</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                      {session.orderBatches.length} Round{session.orderBatches.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    All batches are automatically tracked under Table 04.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Floating Mobile Cart Dock */}
        <CartDock />

        {/* Overlays, Drawers & Sheets */}
        <SearchOverlay isOpen={isSearchOpen} onClose={closeSearch} />

        {selectedItemForDetail && (
          <FoodDetailModal item={selectedItemForDetail} onClose={closeDetail} />
        )}

        <CartDrawer />
        <OrderTrackingView />
        <ServiceRequestSheet />
        <ChefGameModal />
        <BillAndPaymentView />
        <ReceiptModal />
        <ItemUnavailableRecoverySheet />
      </div>
    </CustomerSessionGuard>
  );
};
