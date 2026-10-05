import React, { useEffect } from 'react';
import {
  X,
  Clock,
  Bell,
  CheckCircle2,
  Sparkles,
  Plus,
  Banknote,
  Trash2,
} from 'lucide-react';
import { RestaurantTable } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { StatusBadge } from '../common/StatusBadge';
import { DietaryBadge } from '../common/DietaryBadge';
import { Button } from '../common/Button';

interface TableDetailDrawerProps {
  table: RestaurantTable | null;
  onClose: () => void;
  onOpenStaffOrder: (tableId: string) => void;
  onOpenCashModal: (tableId: string) => void;
  onOpenClearModal: (tableId: string) => void;
}

export const TableDetailDrawer: React.FC<TableDetailDrawerProps> = ({
  table,
  onClose,
  onOpenStaffOrder,
  onOpenCashModal,
  onOpenClearModal,
}) => {
  const { acknowledgeRequest, resolveRequest, updateOrderStatus } = useCustomer();

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
  const isPaid = table.status === 'PAID';
  const isAvailable = table.status === 'AVAILABLE';
  const isPayPending = table.status === 'PAYMENT_PENDING';

  const orderBatches = session?.orderBatches || [];
  const serviceRequests = session?.serviceRequests || [];
  const bill = session?.bill || {
    foodSubtotal: 0,
    discountPercentage: 0,
    discountAmount: 0,
    netFoodAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    finalTotal: 0,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-drawer-title"
        className="relative w-full sm:max-w-md md:max-w-lg h-[92vh] sm:h-full bg-white rounded-t-3xl sm:rounded-l-2xl shadow-overlay flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="table-drawer-title" className="font-mono font-extrabold text-xl text-slate-900 leading-tight">
                {table.tableNumber}
              </h2>
              <StatusBadge
                status={
                  isAvailable
                    ? 'available'
                    : table.status === 'ACTIVE'
                    ? 'active'
                    : isPayPending
                    ? 'pay-pending'
                    : isPaid
                    ? 'paid'
                    : 'closed'
                }
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>{table.section}</span>
              <span>•</span>
              <span>Capacity: {table.capacity} Guests</span>
              <span>•</span>
              <span>Server: {table.serverName}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close table drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 overscroll-contain">
          {/* Vacant State */}
          {isAvailable && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Table is Available</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Ready for guest seating. Customer QR scanning or staff order entry will initialize an active session.
              </p>
              <div className="pt-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onOpenStaffOrder(table.id)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Start Staff-Assisted Order
                </Button>
              </div>
            </div>
          )}

          {/* Active / Payment Pending / Paid Content */}
          {!isAvailable && (
            <>
              {/* Operational Session Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Seated: <strong>{table.seatedDurationMinutes || 20}m ago</strong></span>
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  ID: #{session?.sessionId.slice(-6).toUpperCase() || 'SESSION'}
                </div>
              </div>

              {/* Pending Service Requests Alert Section */}
              {serviceRequests.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <Bell className="w-3.5 h-3.5 text-rose-600" />
                    <span>Active Table Calls ({serviceRequests.length})</span>
                  </div>

                  <div className="space-y-2">
                    {serviceRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-rose-950 capitalize">
                            {req.type.toLowerCase().replace('_', ' ')}
                            {req.note && (
                              <span className="font-normal text-slate-700 ml-1">
                                - "{req.note}"
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Requested at {req.requestedAt}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {req.status === 'REQUESTED' ? (
                            <button
                              onClick={() => acknowledgeRequest(table.id, req.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-colors shadow-xs"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <button
                              onClick={() => resolveRequest(table.id, req.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placed Order Batches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kitchen Order Batches ({orderBatches.length})
                  </h3>
                  <button
                    onClick={() => onOpenStaffOrder(table.id)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Order</span>
                  </button>
                </div>

                {orderBatches.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderBatches.map((batch) => (
                      <div
                        key={batch.batchId}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs"
                      >
                        {/* Batch Header */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">
                              Round #{batch.batchSequence}
                            </span>
                            <span className="ml-1.5 text-[11px] text-slate-500">
                              ({batch.placedAt})
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
                            size="sm"
                          />
                        </div>

                        {/* Items in Batch */}
                        <div className="p-3 divide-y divide-slate-100 text-xs">
                          {batch.items.map((item) => (
                            <div
                              key={item.orderItemId}
                              className="py-1.5 first:pt-0 last:pb-0 flex justify-between items-start"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <DietaryBadge diet={item.diet} />
                                  <span>{item.quantity}x</span>
                                  <span>{item.name}</span>
                                </div>
                                {item.selectedModifiers.length > 0 && (
                                  <div className="text-[11px] text-slate-500 pl-5">
                                    {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                                  </div>
                                )}
                                {item.specialInstructions && (
                                  <div className="text-[10px] text-amber-700 italic pl-5">
                                    {item.specialInstructions}
                                  </div>
                                )}
                              </div>
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                ₹{item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Batch Footer Actions */}
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-700">
                            Subtotal: ₹{batch.batchSubtotal.toFixed(2)}
                          </span>

                          <div className="flex gap-1.5">
                            {batch.status === 'PREPARING' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(table.id, batch.batchId, 'READY')
                                }
                                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors"
                              >
                                Mark Ready
                              </button>
                            )}
                            {batch.status === 'READY' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(table.id, batch.batchId, 'SERVED')
                                }
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                              >
                                Mark Served
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Bill Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                    Cumulative Table Bill
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Payment: {session?.paymentStatus || 'UNPAID'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Food Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ₹{bill.foodSubtotal.toFixed(2)}
                  </span>
                </div>

                {bill.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Game Discount ({bill.discountPercentage}%)
                    </span>
                    <span className="font-mono tabular-nums">
                      -₹{bill.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (5%)</span>
                  <span className="font-mono tabular-nums">
                    ₹{(bill.cgstAmount + bill.sgstAmount).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
                  <span>Total Amount Due</span>
                  <span className="font-mono text-lg text-slate-950 tabular-nums">
                    ₹{bill.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Operational Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5">
            {!isAvailable && !isPaid && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenCashModal(table.id)}
                leftIcon={<Banknote className="w-4 h-4" />}
                className="flex-1 shadow-md bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
              >
                Accept Cash Payment
              </Button>
            )}

            {!isAvailable && (
              <Button
                variant="destructive"
                size="md"
                disabled={!isPaid}
                onClick={() => onOpenClearModal(table.id)}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className={isPaid ? 'flex-1' : 'flex-1 opacity-40 cursor-not-allowed'}
                title={!isPaid ? 'Cannot clear table: Bill is unpaid!' : 'Clear table for next guests'}
              >
                {isPaid ? 'Clear Table' : 'Clear (Unpaid Lock)'}
              </Button>
            )}
          </div>

          {!isPaid && !isAvailable && (
            <p className="text-[11px] text-center text-slate-400 font-medium">
              *Table cannot be cleared while balance remains unpaid.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
