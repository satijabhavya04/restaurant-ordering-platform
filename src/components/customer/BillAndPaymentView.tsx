import React, { useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';
import { Button } from '../common/Button';

type DemoPaymentState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export const BillAndPaymentView: React.FC = () => {
  const {
    session,
    isBillOpen,
    closeBill,
    openReceipt,
    initiatePayment,
  } = useCustomer();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [demoState, setDemoState] = useState<DemoPaymentState>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  if (!isBillOpen) return null;

  const isPaid = session.paymentStatus === 'PAID';
  const isCashPending = session.paymentMethod === 'CASH' && !isPaid;

  const handlePayClick = async (forceFail = false) => {
    if (isPaid) {
      setPaymentError('Bill already paid.');
      return;
    }

    setIsProcessing(true);
    setDemoState('PROCESSING');
    setPaymentError(null);

    // Provide a brief realistic processing delay (1.2s) so the demo state is visible
    if (selectedMethod !== 'CASH') {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    try {
      const result = await initiatePayment(selectedMethod, forceFail || simulateFail);
      if (result.success) {
        setDemoState('SUCCESS');
      } else {
        setDemoState('FAILED');
        setPaymentError(result.message || 'Payment simulation declined. You can retry or choose another method.');
      }
    } catch {
      setDemoState('FAILED');
      setPaymentError('Demo payment gateway simulation timeout. Please retry or pay cash at the counter.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-title"
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={closeBill}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Back to order tracking"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 id="bill-title" className="text-base font-bold text-slate-900 leading-tight">
              Table {session.tableNumber} Bill
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Tax Invoice #{session.sessionId.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {isPaid && (
          <button
            onClick={openReceipt}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>E-Receipt</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-28">
        {/* Processing State Banner */}
        {demoState === 'PROCESSING' && (
          <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 text-center space-y-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-brand-950">Payment processing...</h3>
            <p className="text-xs text-brand-700 max-w-sm mx-auto leading-relaxed">
              Simulating secure {selectedMethod} authorization in demo sandbox. Please do not close this window.
            </p>
          </div>
        )}

        {/* Paid Status Hero Banner */}
        {isPaid ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-extrabold text-emerald-950">
              Payment Confirmed! (Demo Mode)
            </h2>
            <p className="text-xs text-emerald-800">
              Reference #{session.paymentReferenceId} • Paid via {session.paymentMethod} (Simulated Sandbox)
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
              <span>Client Demo Simulation: No real money was transferred.</span>
            </div>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={openReceipt}
                leftIcon={<Receipt className="w-4 h-4" />}
                className="bg-white border-emerald-300 text-emerald-900 font-bold shadow-xs"
              >
                View & Download E-Receipt
              </Button>
            </div>
          </div>
        ) : isCashPending ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <Banknote className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-amber-950">
              Awaiting Cash Confirmation
            </h2>
            <p className="text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
              Please hand cash to your server or pay at the reception counter. Staff will verify the payment using their terminal.
            </p>
          </div>
        ) : null}

        {/* Itemized Bill Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-5">
          {/* Restaurant Legal Heading */}
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              {session.restaurantName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{session.restaurantAddress}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>GSTIN: {session.gstin}</span>
              <span>•</span>
              <span>FSSAI: {session.fssai}</span>
            </div>
          </div>

          {/* Batches Items Breakdown */}
          <div className="space-y-4">
            {session.orderBatches.map((batch) => (
              <div key={batch.batchId} className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Round #{batch.batchSequence} • {batch.placedAt}
                </div>

                <div className="divide-y divide-slate-100">
                  {batch.items.map((item) => (
                    <div key={item.orderItemId} className="py-2 flex justify-between items-start text-xs">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <DietaryBadge diet={item.diet} />
                          <span>{item.quantity}x</span>
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.selectedModifiers.length > 0 && (
                          <div className="text-[11px] text-slate-500 pl-5">
                            {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        ₹{item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Calculations Summary */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Cumulative Food Subtotal</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                ₹{session.bill.foodSubtotal.toFixed(2)}
              </span>
            </div>

            {session.bill.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Chef's Challenge Discount ({session.bill.discountPercentage}%)
                </span>
                <span className="font-mono tabular-nums">
                  -₹{session.bill.discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Net Taxable Amount</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                ₹{session.bill.netFoodAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>CGST (2.5%)</span>
              <span className="font-mono tabular-nums">₹{session.bill.cgstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>SGST (2.5%)</span>
              <span className="font-mono tabular-nums">₹{session.bill.sgstAmount.toFixed(2)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Grand Total Due
              </span>
              <span className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
                ₹{session.bill.finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector (If unpaid) */}
        {!isPaid && !isCashPending && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            {/* Demo Notice */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Client Demo Mode:</strong> Payments are simulated for presentation. No real money will be charged.
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Choose Payment Method
            </h3>

            <div className="space-y-2.5">
              {/* UPI Option */}
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedMethod === 'UPI'
                    ? 'bg-brand-50/70 border-brand-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Instant UPI Payment (Demo)
                    </div>
                    <div className="text-xs text-slate-500">
                      GPay, PhonePe, Paytm, BHIM (Simulated Sandbox)
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={selectedMethod === 'UPI'}
                  onChange={() => setSelectedMethod('UPI')}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
              </label>

              {/* Card Option */}
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedMethod === 'CARD'
                    ? 'bg-brand-50/70 border-brand-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Credit / Debit Card (Demo)
                    </div>
                    <div className="text-xs text-slate-500">
                      Visa, Mastercard, RuPay (Simulated Sandbox)
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={selectedMethod === 'CARD'}
                  onChange={() => setSelectedMethod('CARD')}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
              </label>

              {/* Cash Option */}
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedMethod === 'CASH'
                    ? 'bg-brand-50/70 border-brand-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Pay at Restaurant (Cash)
                    </div>
                    <div className="text-xs text-slate-500">
                      Staff will collect cash at your table
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={selectedMethod === 'CASH'}
                  onChange={() => setSelectedMethod('CASH')}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>

            {/* QA Testing Toggle */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-400">Demo QA State Testing:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={simulateFail}
                  onChange={(e) => setSimulateFail(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[11px] font-medium">Simulate Payment Failure</span>
              </label>
            </div>

            {/* Error Message / Failed State with Retry */}
            {paymentError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-semibold leading-relaxed">{paymentError}</div>
                </div>
                {!isPaid && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePayClick(false)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment</span>
                    </button>
                    <span className="text-rose-600 text-[11px]">or select another payment method above</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      {!isPaid && !isCashPending && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 pb-6 sm:pb-4 shadow-elevated">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium">To Pay (Demo)</div>
              <div className="font-mono font-extrabold text-xl text-slate-950 tabular-nums">
                ₹{session.bill.finalTotal.toFixed(2)}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isProcessing}
              onClick={() => handlePayClick(simulateFail)}
              className="flex-1 shadow-md"
            >
              {selectedMethod === 'CASH'
                ? 'Request Cash Settlement'
                : `Pay ₹${session.bill.finalTotal.toFixed(2)} (Demo)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
