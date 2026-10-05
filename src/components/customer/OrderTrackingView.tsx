import React, { useState } from 'react';
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Receipt,
  Utensils,
  HelpCircle,
  Bell,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { StatusBadge } from '../common/StatusBadge';
import { DietaryBadge } from '../common/DietaryBadge';
import { Button } from '../common/Button';

export const OrderTrackingView: React.FC = () => {
  const {
    session,
    isTrackingOpen,
    closeTracking,
    openGame,
    openBill,
    openHelp,
  } = useCustomer();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  if (!isTrackingOpen) return null;

  const totalItemsCount = session.orderBatches.reduce(
    (acc, b) => acc + b.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  // Active batches currently in kitchen/service workflow
  const activeBatches = session.orderBatches.filter(
    (b) => b.status === 'NEW' || b.status === 'SUBMITTED' || b.status === 'PREPARING' || b.status === 'READY'
  );

  // Derive current batch: user-selected, or latest active batch, or latest overall batch
  const currentBatch =
    (selectedBatchId && session.orderBatches.find((b) => b.batchId === selectedBatchId)) ||
    (activeBatches.length > 0 ? activeBatches[activeBatches.length - 1] : session.orderBatches[session.orderBatches.length - 1]);

  const currentStatus = currentBatch?.status || 'NEW';

  // Step state calculations
  const isStep1Done = Boolean(currentBatch);
  const isStep2Active = currentStatus === 'PREPARING';
  const isStep2Done = currentStatus === 'READY' || currentStatus === 'SERVED';
  const isStep3Active = currentStatus === 'READY';
  const isStep3Done = currentStatus === 'SERVED';
  const isStep4Active = currentStatus === 'SERVED';

  // Dynamic progress connector bar width
  let progressWidth = 'w-0';
  if (currentStatus === 'NEW' || currentStatus === 'SUBMITTED') {
    progressWidth = 'w-[12%]';
  } else if (currentStatus === 'PREPARING') {
    progressWidth = 'w-[45%]';
  } else if (currentStatus === 'READY') {
    progressWidth = 'w-[78%]';
  } else if (currentStatus === 'SERVED') {
    progressWidth = 'w-full';
  }

  // Dynamic header badge & title
  let statusBadgeText = 'Order Received • In Queue';
  let statusBadgeClass = 'text-sky-800 bg-sky-50 border-sky-200';
  let pingDotClass = 'bg-sky-500';

  if (currentStatus === 'PREPARING') {
    statusBadgeText = 'Cooking in Kitchen • Est. 10-15 Mins';
    statusBadgeClass = 'text-amber-800 bg-amber-50 border-amber-200';
    pingDotClass = 'bg-amber-500';
  } else if (currentStatus === 'READY') {
    statusBadgeText = 'Order Ready to Serve!';
    statusBadgeClass = 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold';
    pingDotClass = 'bg-emerald-500';
  } else if (currentStatus === 'SERVED') {
    statusBadgeText = 'Delivered to Table';
    statusBadgeClass = 'text-slate-800 bg-slate-100 border-slate-300 font-semibold';
    pingDotClass = 'bg-emerald-500';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-tracking-title"
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={closeTracking}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 id="order-tracking-title" className="text-base font-bold text-slate-900 leading-tight">
              Table Order Status
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {session.tableNumber} • {session.orderBatches.length} batch{session.orderBatches.length === 1 ? '' : 'es'} ({totalItemsCount} items)
            </p>
          </div>
        </div>

        <button
          onClick={openHelp}
          className="px-3 py-1.5 min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Need Help?</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Active Kitchen Pipeline Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${pingDotClass} ${currentStatus !== 'SERVED' ? 'animate-ping' : ''}`}></span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {currentBatch ? `Kitchen Status — Round #${currentBatch.batchSequence}` : 'Kitchen Status Timeline'}
              </h2>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClass}`}>
              {statusBadgeText}
            </span>
          </div>

          {/* Multi-Round Selector (If more than 1 batch placed) */}
          {session.orderBatches.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100 pt-1">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Viewing Round:</span>
              {session.orderBatches.map((batch) => {
                const isSelected = currentBatch?.batchId === batch.batchId;
                return (
                  <button
                    key={batch.batchId}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.batchId)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>Round #{batch.batchSequence}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        batch.status === 'READY'
                          ? 'bg-emerald-500 text-white'
                          : batch.status === 'PREPARING'
                          ? 'bg-amber-500 text-white'
                          : batch.status === 'SERVED'
                          ? 'bg-slate-600 text-white'
                          : 'bg-sky-500 text-white'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 4-Stage Step Tracker */}
          <div className="pt-2">
            <div className="relative flex items-center justify-between">
              {/* Connector Bar Background */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0"></div>
              {/* Connector Bar Progress */}
              <div className={`absolute top-1/2 left-4 ${progressWidth} -translate-y-1/2 h-1 bg-emerald-500 -z-0 transition-all duration-300`}></div>

              {/* Stage 1: Received */}
              <div className="relative z-10 flex flex-col items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                  isStep1Done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className={`mt-1.5 text-[11px] font-bold ${isStep1Done ? 'text-slate-900' : 'text-slate-400 font-medium'}`}>
                  Received
                </span>
              </div>

              {/* Stage 2: Cooking */}
              <div className="relative z-10 flex flex-col items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isStep2Active
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : isStep2Done
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {isStep2Done ? <CheckCircle2 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                </span>
                <span className={`mt-1.5 text-[11px] font-bold transition-colors ${
                  isStep2Active ? 'text-amber-700' : isStep2Done ? 'text-slate-900' : 'text-slate-400 font-medium'
                }`}>
                  Preparing
                </span>
              </div>

              {/* Stage 3: Ready */}
              <div className="relative z-10 flex flex-col items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isStep3Active
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse'
                    : isStep3Done
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {isStep3Done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isStep3Active ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </span>
                <span className={`mt-1.5 text-[11px] font-bold transition-colors ${
                  isStep3Active ? 'text-emerald-700' : isStep3Done ? 'text-slate-900' : 'text-slate-400 font-medium'
                }`}>
                  Ready
                </span>
              </div>

              {/* Stage 4: Served */}
              <div className="relative z-10 flex flex-col items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isStep4Active
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-xs'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Utensils className="w-4 h-4" />
                </span>
                <span className={`mt-1.5 text-[11px] font-bold transition-colors ${
                  isStep4Active ? 'text-slate-900' : 'text-slate-400 font-medium'
                }`}>
                  Served
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Promo Card (If game not yet played) */}
        {!session.gameStatus.hasPlayed ? (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-500 via-brand-500 to-orange-600 p-5 text-white shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Chef's Challenge
                </span>
                <h3 className="text-lg font-extrabold leading-snug">
                  Play & Win Up to 20% OFF!
                </h3>
                <p className="text-xs text-white/90 leading-relaxed max-w-sm">
                  Catch gourmet ingredients in 15 seconds while your food is prepared. Your earned discount applies directly to {session.tableNumber}'s final bill!
                </p>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={openGame}
                className="shrink-0 bg-white text-slate-900 font-extrabold hover:bg-white/90 shadow-md self-center"
              >
                Play Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  {session.gameStatus.discountPercentage}% Discount Active!
                </h4>
                <p className="text-xs text-emerald-700">
                  Applied to all food orders for this dining session.
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
              -₹{session.bill.discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Order Batches List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Order Batches Placed
          </h3>

          {session.orderBatches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
              No orders placed yet.
            </div>
          ) : (
            session.orderBatches.map((batch) => {
              const isSelected = currentBatch?.batchId === batch.batchId;
              return (
              <div
                key={batch.batchId}
                onClick={() => setSelectedBatchId(batch.batchId)}
                className={`rounded-2xl bg-white border overflow-hidden shadow-xs cursor-pointer transition-all ${
                  isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Batch Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900">
                      Round #{batch.batchSequence}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      Placed at {batch.placedAt}
                    </span>
                  </div>
                  <StatusBadge
                    status={
                      batch.status === 'PREPARING'
                        ? 'preparing'
                        : batch.status === 'READY'
                        ? 'ready'
                        : batch.status === 'SERVED'
                        ? 'served'
                        : 'new'
                    }
                  />
                </div>

                {/* Items in Batch */}
                <div className="p-4 divide-y divide-slate-100">
                  {batch.items.map((item) => (
                    <div key={item.orderItemId} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DietaryBadge diet={item.diet} />
                          <span className="font-bold text-sm text-slate-900">
                            {item.quantity}x
                          </span>
                          <span className="text-sm font-medium text-slate-800">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-slate-700 tabular-nums">
                          ₹{item.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Modifiers line */}
                      {item.selectedModifiers.length > 0 && (
                        <p className="mt-0.5 text-xs text-slate-500 pl-6">
                          {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                        </p>
                      )}

                      {/* Special instructions */}
                      {item.specialInstructions && (
                        <p className="mt-0.5 text-[11px] text-amber-700 italic pl-6">
                          Note: "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Batch Subtotal Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Round Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    ₹{batch.batchSubtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 pb-6 sm:pb-4 shadow-elevated">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={closeTracking}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1"
          >
            Add More Dishes
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              closeTracking();
              openBill();
            }}
            rightIcon={<Receipt className="w-4 h-4" />}
            className="flex-1 shadow-md"
          >
            View Bill & Pay
          </Button>
        </div>
      </div>
    </div>
  );
};
