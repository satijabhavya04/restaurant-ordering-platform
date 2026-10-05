import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Banknote, ShieldCheck } from 'lucide-react';
import { RestaurantTable } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

interface CashPaymentModalProps {
  table: RestaurantTable | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  table,
  onClose,
  onSuccess,
}) => {
  const { confirmTableCashPayment } = useCustomer();
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [staffPin, setStaffPin] = useState<string>('1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!table || !table.session) return null;

  const bill = table.session.bill;
  const finalTotal = bill.finalTotal || 0;

  // Initialize tendered with exact amount if not set
  React.useEffect(() => {
    if (finalTotal > 0 && tenderedAmount === 0) {
      setTenderedAmount(Math.ceil(finalTotal));
    }
  }, [finalTotal, tenderedAmount]);

  const changeDue = Math.max(0, tenderedAmount - finalTotal);
  const isShort = tenderedAmount < finalTotal;

  // Preset options
  const exactAmount = Math.ceil(finalTotal);
  const round100 = Math.ceil(finalTotal / 100) * 100;
  const round500 = Math.ceil(finalTotal / 500) * 500;

  const handleConfirm = () => {
    setErrorMessage(null);
    if (isShort) {
      setErrorMessage(`Tendered amount is ₹${(finalTotal - tenderedAmount).toFixed(2)} short of the total.`);
      return;
    }
    if (!staffPin.trim()) {
      setErrorMessage('Please enter staff PIN for audit authorization.');
      return;
    }

    const result = confirmTableCashPayment(table.id, staffPin, tenderedAmount);
    if (result.success) {
      onSuccess(result.message);
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-overlay overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cash-modal-title" className="font-mono font-bold text-lg text-slate-900 leading-tight">
                Cash Settlement
              </h3>
              <p className="text-xs text-slate-500">
                {table.tableNumber} • {table.section}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Bill Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Amount Due
              </span>
              <span className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <div>Subtotal: ₹{bill.foodSubtotal.toFixed(2)}</div>
              {bill.discountAmount > 0 && (
                <div className="text-emerald-600 font-medium">
                  Discount: -₹{bill.discountAmount.toFixed(2)}
                </div>
              )}
              <div>GST (5%): ₹{(bill.cgstAmount + bill.sgstAmount).toFixed(2)}</div>
            </div>
          </div>

          {/* Quick Tender Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Quick Tender Amount
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTenderedAmount(exactAmount)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  tenderedAmount === exactAmount
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Exact (₹{exactAmount})
              </button>
              <button
                type="button"
                onClick={() => setTenderedAmount(round100)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  tenderedAmount === round100
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Round ₹{round100}
              </button>
              <button
                type="button"
                onClick={() => setTenderedAmount(round500)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  tenderedAmount === round500
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Round ₹{round500}
              </button>
            </div>
          </div>

          {/* Custom Tendered Input & Change Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Cash Tendered (₹)
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={tenderedAmount || ''}
                onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-base font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Change to Return (₹)
              </label>
              <div
                className={`w-full px-3 py-2 rounded-xl border font-mono font-extrabold text-base flex items-center justify-between ${
                  isShort
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                <span>₹{changeDue.toFixed(2)}</span>
                {isShort ? (
                  <span className="text-[10px] font-sans font-bold bg-rose-200/60 px-1.5 py-0.5 rounded text-rose-800">
                    SHORT
                  </span>
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>
          </div>

          {/* Staff Authorization PIN */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                Staff Audit PIN
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                (Default: 1234)
              </span>
            </label>
            <input
              type="password"
              maxLength={6}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-900 bg-white"
              placeholder="Enter PIN"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isShort || !staffPin.trim()}
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};
