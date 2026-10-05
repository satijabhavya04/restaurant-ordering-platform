import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  UserCheck,
  Receipt,
  X,
} from 'lucide-react';
import { HistoricalOrder } from '../../../types';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';

export const OrdersHistoryWorkspace: React.FC = () => {
  const { historicalOrders } = useCustomer();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<HistoricalOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return historicalOrders.filter((order) => {
      if (statusFilter !== 'ALL' && order.orderStatus !== statusFilter) {
        return false;
      }
      if (paymentFilter !== 'ALL' && order.paymentMethod !== paymentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = order.orderNumber.toLowerCase().includes(q);
        const matchesTable = order.tableNumber.toLowerCase().includes(q);
        const matchesItems = order.itemsSummary.toLowerCase().includes(q);
        if (!matchesNum && !matchesTable && !matchesItems) return false;
      }
      return true;
    });
  }, [historicalOrders, statusFilter, paymentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Operational Orders & Audit History
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {historicalOrders.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all completed, served, and settled dining round transactions
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Method:
            </span>
            {(['ALL', 'UPI', 'CARD', 'CASH'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentFilter(method)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  paymentFilter === method
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {method === 'ALL' ? 'All Channels' : method}
              </button>
            ))}

            <span className="text-slate-300">|</span>

            <span className="text-slate-400 font-semibold text-[11px]">
              Status:
            </span>
            {(['ALL', 'SERVED', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order #, table, dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Table & Section</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Order ID */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {ord.orderNumber}
                  </td>

                  {/* Table & Zone */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{ord.tableNumber}</div>
                    <div className="text-[11px] text-slate-400">{ord.section}</div>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {ord.createdAt}
                  </td>

                  {/* Items Summary */}
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                    <span className="font-bold text-slate-900 mr-1">
                      ({ord.itemsCount})
                    </span>
                    {ord.itemsSummary}
                  </td>

                  {/* Source */}
                  <td className="py-3 px-4">
                    {ord.source === 'QR_CUSTOMER' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        <Smartphone className="w-3 h-3 text-brand-600" />
                        Guest QR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Staff Waiter
                      </span>
                    )}
                  </td>

                  {/* Discount */}
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 tabular-nums">
                    {ord.discount > 0 ? `-₹${ord.discount.toFixed(2)}` : '—'}
                  </td>

                  {/* Final Total */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm tabular-nums">
                    ₹{ord.finalTotal.toFixed(2)}
                  </td>

                  {/* Payment */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {ord.paymentMethod}
                    </span>
                  </td>

                  {/* View Details Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="View Receipt Breakdown"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            No orders match the selected filters.
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-md h-full bg-white shadow-overlay p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-600" />
                  <h3 className="font-mono font-black text-lg text-slate-900">
                    {selectedOrder.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Meta */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Table & Section:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.tableNumber} ({selectedOrder.section})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-800">{selectedOrder.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Channel:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="font-bold text-emerald-700">PAID via {selectedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Itemized Audit Log
                </h4>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <p className="font-medium text-slate-800 leading-relaxed">
                    {selectedOrder.itemsSummary}
                  </p>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Food Subtotal</span>
                  <span className="font-mono tabular-nums">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Chef Game Discount</span>
                    <span className="font-mono tabular-nums">-₹{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Taxes (GST 5%)</span>
                  <span className="font-mono tabular-nums">₹{selectedOrder.taxes.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-slate-950 tabular-nums">
                    ₹{selectedOrder.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-4"
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
