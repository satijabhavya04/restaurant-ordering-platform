import React from 'react';
import { Clock, ShoppingBag, Bell, CheckCircle2 } from 'lucide-react';
import { RestaurantTable } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface TableCardProps {
  table: RestaurantTable;
  onSelect: (tableId: string) => void;
  onQuickOrder?: (tableId: string) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, onSelect, onQuickOrder }) => {
  const session = table.session;
  const isAvailable = table.status === 'AVAILABLE';
  const isActive = table.status === 'ACTIVE';
  const isPayPending = table.status === 'PAYMENT_PENDING';
  const isPaid = table.status === 'PAID';
  const isClosed = table.status === 'CLOSED';

  // Count active requests
  const pendingRequests = session?.serviceRequests?.filter(
    (r) => r.status === 'REQUESTED' || r.status === 'ACKNOWLEDGED'
  ) || [];

  // Count total orders & balance
  const activeBatchesCount = session?.orderBatches?.length || 0;
  const finalTotal = session?.bill?.finalTotal || 0;

  // Visual border and background encoding per Master Design System
  let borderClasses = 'border-slate-200 bg-white hover:border-slate-300';
  if (isAvailable) {
    borderClasses = 'border-emerald-500/80 bg-emerald-50/40 hover:bg-emerald-50/60 hover:border-emerald-600';
  } else if (isActive) {
    borderClasses = 'border-amber-400 bg-white hover:border-amber-500 shadow-xs';
  } else if (isPayPending) {
    borderClasses = 'border-purple-500 bg-purple-50/50 hover:border-purple-600 ring-2 ring-purple-200/60 animate-pulse';
  } else if (isPaid) {
    borderClasses = 'border-emerald-600 bg-emerald-50/70 hover:border-emerald-700 shadow-xs';
  } else if (isClosed) {
    borderClasses = 'border-slate-300 bg-slate-100/70 opacity-75';
  }

  return (
    <div
      onClick={() => onSelect(table.id)}
      className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${borderClasses}`}
    >
      {/* Top Header: Table Number & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-xl text-slate-900 tracking-tight">
                {table.tableNumber}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ({table.capacity}p)
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {table.section}
            </span>
          </div>

          <StatusBadge
            status={
              isAvailable
                ? 'available'
                : isActive
                ? 'active'
                : isPayPending
                ? 'pay-pending'
                : isPaid
                ? 'paid'
                : 'closed'
            }
            size="sm"
          />
        </div>

        {/* Operational Context Metadata */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
          {isAvailable ? (
            <div className="py-2 text-center text-slate-400 font-medium text-xs flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ready for Seating</span>
            </div>
          ) : (
            <>
              {/* Seated duration & Server */}
              <div className="flex items-center justify-between text-slate-600">
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Seated: {table.seatedDurationMinutes || 20}m ago
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                  {table.serverName}
                </span>
              </div>

              {/* Order Batches Count & Financial Total */}
              <div className="flex items-center justify-between pt-1 font-semibold">
                <span className="inline-flex items-center gap-1 text-slate-700">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  {activeBatchesCount} Round{activeBatchesCount === 1 ? '' : 's'}
                </span>
                <span className="font-mono font-bold text-sm text-slate-950 tabular-nums">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Pending Service Requests Alert Badge */}
              {pendingRequests.length > 0 && (
                <div className="mt-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-rose-600 animate-bounce" />
                  <span>
                    {pendingRequests[0].type.replace('_', ' ')} (
                    {pendingRequests[0].requestedAt})
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(table.id);
          }}
          className="flex-1 py-1 px-2 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
        >
          Details
        </button>

        {!isAvailable && !isPaid && onQuickOrder && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickOrder(table.id);
            }}
            className="flex-1 py-1 px-2 text-center rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold border border-brand-200 transition-colors"
          >
            + Order
          </button>
        )}

        {isPaid && (
          <span className="flex-1 py-1 px-2 text-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
            Ready to Clear
          </span>
        )}
      </div>
    </div>
  );
};
