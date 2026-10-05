import React from 'react';
import { X, Printer, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

export const ReceiptModal: React.FC = () => {
  const { session, isReceiptOpen, closeReceipt, finishDining } = useCustomer();

  if (!isReceiptOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeReceipt}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="relative w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-overlay overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span id="receipt-title">Tax Invoice E-Receipt</span>
          </div>

          <button
            onClick={closeReceipt}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close receipt modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white text-slate-900 font-sans text-xs printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
            <h2 className="text-base font-extrabold tracking-wide uppercase">
              {session.restaurantName}
            </h2>
            <p className="text-slate-500">{session.restaurantAddress}</p>
            <p className="font-mono text-[11px] text-slate-500">
              GSTIN: {session.gstin} | FSSAI: {session.fssai}
            </p>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-2 text-slate-600 border-b border-dashed border-slate-300 pb-3">
            <div>
              <span className="font-semibold text-slate-900">Table:</span> {session.tableNumber}
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">Session:</span> #{session.sessionId.slice(-6).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Date:</span> {new Date(session.startedAt).toLocaleDateString()}
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">Paid Via:</span> {session.paymentMethod || 'UPI'}
            </div>
          </div>

          {/* Itemized Items */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex justify-between">
              <span>Item Description</span>
              <span>Amount</span>
            </div>

            {session.orderBatches.map((b) =>
              b.items.map((i) => (
                <div key={i.orderItemId} className="flex justify-between items-start">
                  <div className="pr-2">
                    <span className="font-bold">{i.quantity}x</span> {i.name}
                    {i.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-slate-500 pl-4">
                        {i.selectedModifiers.map((m) => m.optionName).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-mono tabular-nums">₹{i.totalPrice.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {/* Subtotal, Discounts & Taxes */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Food Subtotal</span>
              <span className="font-mono tabular-nums">₹{session.bill.foodSubtotal.toFixed(2)}</span>
            </div>

            {session.bill.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Chef's Challenge Discount ({session.bill.discountPercentage}%)</span>
                <span className="font-mono tabular-nums">-₹{session.bill.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxable Net Amount</span>
              <span className="font-mono tabular-nums">₹{session.bill.netFoodAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>CGST (2.5%)</span>
              <span className="font-mono tabular-nums">₹{session.bill.cgstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>SGST (2.5%)</span>
              <span className="font-mono tabular-nums">₹{session.bill.sgstAmount.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-900 flex justify-between text-sm font-extrabold text-slate-950">
              <span>Total Paid</span>
              <span className="font-mono text-base tabular-nums">₹{session.bill.finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-slate-500 text-[11px] space-y-1">
            <p>Thank you for dining with us at The Spice Pavilion!</p>
            <p className="font-mono text-[10px]">Txn Ref: {session.paymentReferenceId || 'TXN-VERIFIED'}</p>
            <div className="pt-2 border-t border-dashed border-slate-200 text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Client Demo Tax Invoice • Simulated Payment (No Real Funds Transferred)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="flex-1"
          >
            Print / Save PDF
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={finishDining}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="flex-1 shadow-md"
          >
            Finish Dining
          </Button>
        </div>
      </div>
    </div>
  );
};
