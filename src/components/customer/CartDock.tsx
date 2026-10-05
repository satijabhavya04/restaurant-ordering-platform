import React from 'react';
import { ShoppingBag, ArrowRight, Flame } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const CartDock: React.FC = () => {
  const {
    session,
    cartCount,
    cartSubtotal,
    openCart,
    isCartOpen,
    openTracking,
    isTrackingOpen,
  } = useCustomer();

  // If cart is open, or tracking is already open, do not render dock
  if (isCartOpen || isTrackingOpen) return null;

  // Active batches in the kitchen pipeline
  const activeBatches = session.orderBatches.filter(
    (b) =>
      b.status === 'NEW' ||
      b.status === 'SUBMITTED' ||
      b.status === 'PREPARING' ||
      b.status === 'READY'
  );

  // Case 1: Active Cart Items Present (Primary CTA)
  if (cartCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={openCart}
          className="w-full h-14 px-4 sm:px-5 bg-slate-950 text-white rounded-2xl shadow-elevated flex items-center justify-between hover:bg-slate-900 active:scale-[0.99] transition-all border border-slate-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          aria-label={`View cart containing ${cartCount} items totaling ₹${cartSubtotal.toFixed(2)}`}
        >
          {/* Left Icon & Count */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-mono font-extrabold text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-400 font-medium">
                {cartCount} {cartCount === 1 ? 'dish' : 'dishes'} selected
              </div>
              <div className="font-mono font-bold text-sm text-white tabular-nums">
                ₹{cartSubtotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-brand-400 uppercase tracking-wider">
            <span>Review Order</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    );
  }

  // Case 2: Cart Empty, but Active Kitchen Rounds Exist (Persistent Live Order Tracker)
  if (activeBatches.length > 0) {
    const latestBatch = activeBatches[activeBatches.length - 1];
    const totalActiveItems = activeBatches.reduce(
      (sum, b) => sum + b.items.reduce((acc, i) => acc + i.quantity, 0),
      0
    );

    const isReady = latestBatch.status === 'READY';
    const isNew = latestBatch.status === 'NEW' || latestBatch.status === 'SUBMITTED';

    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-3 duration-200">
        <button
          onClick={openTracking}
          className={`w-full h-13 px-4 sm:px-5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-elevated flex items-center justify-between hover:bg-slate-900 active:scale-[0.99] transition-all border focus:outline-hidden focus-visible:ring-2 cursor-pointer ${
            isReady
              ? 'border-emerald-500/50 focus-visible:ring-emerald-400'
              : 'border-amber-500/40 focus-visible:ring-amber-400'
          }`}
          aria-label={`Kitchen is preparing ${activeBatches.length} order batch${activeBatches.length > 1 ? 'es' : ''}. Tap to track live status.`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                isReady
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              <Flame className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isReady ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isReady ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
            </div>
            <div className="text-left min-w-0">
              <div
                className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isReady ? 'text-emerald-300' : 'text-amber-300/90'
                }`}
              >
                <span>
                  {isReady
                    ? 'Order Ready to Serve!'
                    : isNew
                    ? 'Order Received'
                    : 'Kitchen Preparing'}
                </span>
                <span>•</span>
                <span className="font-mono text-white">
                  {totalActiveItems} item{totalActiveItems > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium truncate">
                {session.tableNumber} • {activeBatches.length} round{activeBatches.length > 1 ? 's' : ''} in progress
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-bold shrink-0 ${
              isReady ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <span>Track Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    );
  }

  return null;
};
