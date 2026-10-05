import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RestaurantTable } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

interface ClearTableDialogProps {
  table: RestaurantTable | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ClearTableDialog: React.FC<ClearTableDialogProps> = ({
  table,
  onClose,
  onSuccess,
}) => {
  const { clearTable } = useCustomer();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (!table) return null;

  const session = table.session;
  const isAvailable = table.status === 'AVAILABLE';
  const hasUnpaidBalance =
    Boolean(session) && session?.paymentStatus !== 'PAID' && (session?.bill?.finalTotal || 0) > 0;
  const unpaidTotal = session?.bill?.finalTotal || 0;

  const handleConfirmClear = () => {
    setErrorMessage(null);
    const result = clearTable(table.id);
    if (result.success) {
      onSuccess(result.message);
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-table-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-overlay overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                hasUnpaidBalance
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {hasUnpaidBalance ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="clear-table-title" className="font-mono font-bold text-lg text-slate-900 leading-tight">
                {hasUnpaidBalance ? 'Clear Table Blocked' : 'Clear & Reset Table'}
              </h3>
              <p className="text-xs text-slate-500">
                {table.tableNumber} • {table.section}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {hasUnpaidBalance ? (
            /* Unpaid Lockout Guardrail */
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Unpaid Bill Guardrail Active</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-700">
                This table cannot be cleared because an unsettled balance of{' '}
                <strong className="font-mono font-bold text-rose-950">
                  ₹{unpaidTotal.toFixed(2)}
                </strong>{' '}
                remains. All orders must be marked as PAID prior to clearing the table to
                prevent revenue leakage.
              </p>
              <div className="pt-2 text-xs font-medium text-rose-600">
                Action required: Collect Cash or complete Online Payment before clearing.
              </div>
            </div>
          ) : isAvailable ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 text-xs">
              <p className="font-semibold">Table is already Available.</p>
              <p className="text-emerald-700">No active dining session is currently seated at this table.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to clear{' '}
                <strong className="text-slate-900 font-bold">{table.tableNumber}</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Guest Duration:</span>
                  <span className="font-semibold text-slate-800">
                    {table.seatedDurationMinutes || 0} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Status:</span>
                  <span className="font-bold text-emerald-700">PAID & SETTLED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bill Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(session?.bill?.finalTotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Clearing will archive the dining session, remove table assignments, and
                immediately transition the table state to{' '}
                <span className="font-bold text-emerald-700">AVAILABLE</span> for the host team.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="md" onClick={onClose}>
            {hasUnpaidBalance ? 'Dismiss' : 'Cancel'}
          </Button>

          {!hasUnpaidBalance && !isAvailable && (
            <Button
              variant="destructive"
              size="md"
              onClick={handleConfirmClear}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Clear Table
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
