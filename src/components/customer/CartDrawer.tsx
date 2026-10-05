import React, { useState } from 'react';
import { X, Utensils, ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';
import { QuantityStepper } from '../common/QuantityStepper';
import { Button } from '../common/Button';

export const CartDrawer: React.FC = () => {
  const {
    session,
    cartItems,
    cartSubtotal,
    isCartOpen,
    closeCart,
    updateCartQuantity,
    placeOrder,
  } = useCustomer();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  // Projection calculations for cart
  const discountPct = session.gameStatus.discountPercentage || 0;
  const discountAmt = Math.round((cartSubtotal * discountPct) / 100);
  const netFood = cartSubtotal - discountAmt;
  const projectedTax = Math.round(netFood * 0.05 * 100) / 100;
  const projectedTotal = Math.round((netFood + projectedTax) * 100) / 100;

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const success = await placeOrder();
      if (!success) {
        setSubmissionError('Could not place order. Please review unavailable items.');
      }
    } catch {
      setSubmissionError('Network error. Please try sending order again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeCart}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="relative w-full sm:max-w-md h-[92vh] sm:h-full bg-white rounded-t-3xl sm:rounded-l-2xl shadow-overlay flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={closeCart}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Back to menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 id="cart-drawer-title" className="text-base font-bold text-slate-900 leading-tight">
                Review Table Order
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {session.tableNumber} • {cartItems.length} unique dish{cartItems.length === 1 ? '' : 'es'}
              </p>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close cart drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Body */}
        {cartItems.length === 0 ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Your cart is empty</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
              Explore our chef's signature appetizers, curries, and breads to add them to your table.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={closeCart}
              className="mt-5"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
            {/* Items List */}
            <div className="divide-y divide-slate-100">
              {cartItems.map((ci) => (
                <div key={ci.cartItemId} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <DietaryBadge diet={ci.item.diet} />
                        <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                          {ci.item.name}
                        </h4>
                      </div>

                      {/* Selected Modifiers Tags */}
                      {ci.selectedModifiers.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ci.selectedModifiers.map((mod) => (
                            <span
                              key={mod.optionId}
                              className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              {mod.optionName}
                              {mod.priceDelta > 0 && ` (+₹${mod.priceDelta})`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Special Instructions Note */}
                      {ci.specialInstructions && (
                        <p className="mt-1 text-[11px] text-slate-500 italic bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          Note: "{ci.specialInstructions}"
                        </p>
                      )}

                      <div className="mt-1.5 font-mono font-bold text-xs text-slate-900 tabular-nums">
                        ₹{ci.totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="shrink-0">
                      <QuantityStepper
                        quantity={ci.quantity}
                        onIncrement={() => updateCartQuantity(ci.cartItemId, 1)}
                        onDecrement={() => updateCartQuantity(ci.cartItemId, -1)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Items trigger */}
            <button
              type="button"
              onClick={closeCart}
              className="w-full py-2 text-center text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50/60 rounded-xl border border-dashed border-brand-200 transition-colors"
            >
              + Add More Dishes to this Round
            </button>

            {/* Discount Notification if Active */}
            {discountPct > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Chef's Challenge: {discountPct}% OFF</strong> applies to all eligible food rounds!
                </span>
              </div>
            )}

            {/* Bill Projection Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Order Batch Summary
              </h4>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Food Subtotal</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  ₹{cartSubtotal.toFixed(2)}
                </span>
              </div>

              {discountAmt > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>Game Discount ({discountPct}%)</span>
                  <span className="font-mono tabular-nums">-₹{discountAmt.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-600">
                <span>Estimated GST (5%)</span>
                <span className="font-mono text-slate-900 tabular-nums">
                  ₹{projectedTax.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Batch Estimated Total</span>
                <span className="font-mono text-base text-slate-900 tabular-nums">
                  ₹{projectedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submission Error Alert */}
            {submissionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}
          </div>
        )}

        {/* Sticky Footer Action */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 pb-6 sm:pb-5 bg-white border-t border-slate-200 shrink-0 space-y-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              onClick={handlePlaceOrder}
              rightIcon={<Send className="w-4 h-4" />}
              className="shadow-md"
            >
              Send Order to Kitchen • ₹{projectedTotal.toFixed(2)}
            </Button>
            <p className="text-[11px] text-center text-slate-400">
              Orders are sent directly to the kitchen display line
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
