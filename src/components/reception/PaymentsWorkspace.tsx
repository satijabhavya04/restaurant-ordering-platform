import React, { useState, useMemo } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';

interface PaymentsWorkspaceProps {
  onOpenTable: (tableId: string) => void;
  onOpenCashModal: (tableId: string) => void;
}

export const PaymentsWorkspace: React.FC<PaymentsWorkspaceProps> = ({
  onOpenTable,
  onOpenCashModal,
}) => {
  const { tables } = useCustomer();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNSETTLED' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect active tables with dining sessions
  const activeTables = useMemo(() => {
    return tables.filter(
      (t) => t.status !== 'AVAILABLE' && t.session && t.session.orderBatches.length > 0
    );
  }, [tables]);

  // Aggregate totals
  const metrics = useMemo(() => {
    let unsettledSum = 0;
    let settledSum = 0;
    let pendingCount = 0;

    activeTables.forEach((table) => {
      const billTotal = table.session?.bill.finalTotal || 0;
      if (table.session?.paymentStatus === 'PAID') {
        settledSum += billTotal;
      } else {
        unsettledSum += billTotal;
        if (table.status === 'PAYMENT_PENDING') {
          pendingCount += 1;
        }
      }
    });

    return {
      unsettledSum,
      settledSum,
      pendingCount,
      activeCount: activeTables.length,
    };
  }, [activeTables]);

  // Filtered
  const filteredTables = useMemo(() => {
    return activeTables.filter((table) => {
      const isPaid = table.session?.paymentStatus === 'PAID';
      if (selectedFilter === 'UNSETTLED' && isPaid) return false;
      if (selectedFilter === 'PAID' && !isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTable = table.tableNumber.toLowerCase().includes(q);
        const matchesServer = table.serverName.toLowerCase().includes(q);
        if (!matchesTable && !matchesServer) return false;
      }
      return true;
    });
  }, [activeTables, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unsettled Total */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
            <span>Outstanding / Unsettled</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-mono font-extrabold text-2xl sm:text-3xl text-rose-950 tabular-nums">
            ₹{metrics.unsettledSum.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Across active dining tables
          </span>
        </div>

        {/* Tables Awaiting Settlement */}
        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-purple-700 font-semibold mb-1">
            <span>Bill Requested</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-mono font-extrabold text-2xl sm:text-3xl text-purple-950">
            {metrics.pendingCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Tables ready for cashier check
          </span>
        </div>

        {/* Settled Today */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>Collected / Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-extrabold text-2xl sm:text-3xl text-emerald-950 tabular-nums">
            ₹{metrics.settledSum.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Completed cash & online bills
          </span>
        </div>
      </div>

      {/* Register Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Tables ({metrics.activeCount})
            </button>
            <button
              onClick={() => setSelectedFilter('UNSETTLED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedFilter === 'UNSETTLED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Unsettled
            </button>
            <button
              onClick={() => setSelectedFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedFilter === 'PAID'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Settled (Paid)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search table or server..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Payments Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Duration & Server</th>
                <th className="py-3 px-4">Rounds</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Taxes</th>
                <th className="py-3 px-4 text-right">Total Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTables.map((table) => {
                const session = table.session;
                if (!session) return null;
                const bill = session.bill;
                const isPaid = session.paymentStatus === 'PAID';
                const isPending = table.status === 'PAYMENT_PENDING';

                return (
                  <tr
                    key={table.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isPending ? 'bg-purple-50/20' : ''
                    }`}
                  >
                    {/* Table */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span>{table.tableNumber}</span>
                        <span className="text-[10px] font-sans font-normal text-slate-400">
                          ({table.section})
                        </span>
                      </div>
                    </td>

                    {/* Duration & Server */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{table.seatedDurationMinutes || 25} min</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{table.serverName}</span>
                    </td>

                    {/* Rounds */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {session.orderBatches.length} batch
                      {session.orderBatches.length === 1 ? '' : 'es'}
                    </td>

                    {/* Subtotal */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      ₹{bill.foodSubtotal.toFixed(2)}
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 tabular-nums">
                      {bill.discountAmount > 0 ? `-₹${bill.discountAmount.toFixed(2)}` : '—'}
                    </td>

                    {/* Taxes */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 tabular-nums">
                      ₹{(bill.cgstAmount + bill.sgstAmount).toFixed(2)}
                    </td>

                    {/* Final Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-950 tabular-nums">
                      ₹{bill.finalTotal.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge
                        status={
                          isPaid ? 'paid' : isPending ? 'pay-pending' : 'active'
                        }
                        size="sm"
                      />
                      {isPaid && session.paymentMethod && (
                        <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                          via {session.paymentMethod}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenCashModal(table.id)}
                            className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            leftIcon={<Banknote className="w-3.5 h-3.5" />}
                          >
                            Cash
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenTable(table.id)}
                          className="text-xs py-1 px-2 text-slate-700"
                          title="View Bill Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTables.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No active billing records match the current filter.
          </div>
        )}
      </div>
    </div>
  );
};
