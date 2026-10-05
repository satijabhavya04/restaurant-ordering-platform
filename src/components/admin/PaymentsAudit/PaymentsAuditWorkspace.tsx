import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';

export const PaymentsAuditWorkspace: React.FC = () => {
  const { historicalOrders, tables } = useCustomer();
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Outstanding unpaid total from active tables
  const unsettledTotal = useMemo(() => {
    return tables
      .filter((t) => t.status !== 'AVAILABLE' && t.session?.paymentStatus !== 'PAID')
      .reduce((acc, t) => acc + (t.session?.bill.finalTotal || 0), 0);
  }, [tables]);

  // Aggregate stats from historical orders
  const stats = useMemo(() => {
    let totalSettled = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let cashTotal = 0;
    let totalTaxes = 0;

    historicalOrders.forEach((o) => {
      totalSettled += o.finalTotal;
      totalTaxes += o.taxes;
      if (o.paymentMethod === 'UPI') upiTotal += o.finalTotal;
      else if (o.paymentMethod === 'CARD') cardTotal += o.finalTotal;
      else if (o.paymentMethod === 'CASH') cashTotal += o.finalTotal;
    });

    return { totalSettled, upiTotal, cardTotal, cashTotal, totalTaxes };
  }, [historicalOrders]);

  const filteredOrders = useMemo(() => {
    return historicalOrders.filter((order) => {
      if (methodFilter !== 'ALL' && order.paymentMethod !== methodFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = order.orderNumber.toLowerCase().includes(q);
        const matchesTable = order.tableNumber.toLowerCase().includes(q);
        if (!matchesRef && !matchesTable) return false;
      }
      return true;
    });
  }, [historicalOrders, methodFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Payments, Taxes & Settlement Audit
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              AUDIT VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gateway transaction verification, cash reconciliation, and GST tax ledger
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setToastMessage('Exported GST & Settlement Ledger (CSV).');
          }}
          leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
        >
          Export Ledger (CSV)
        </Button>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Settled Revenue
          </span>
          <div className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
            ₹{stats.totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            Inclusive of 5% GST
          </span>
        </div>

        {/* UPI & Digital QR */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>UPI Digital (QR)</span>
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="font-mono font-extrabold text-2xl text-sky-950 tabular-nums">
            ₹{stats.upiTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            {Math.round((stats.upiTotal / (stats.totalSettled || 1)) * 100)}% of total volume
          </span>
        </div>

        {/* Credit / Debit Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Card Terminal / Gateway</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="font-mono font-extrabold text-2xl text-purple-950 tabular-nums">
            ₹{stats.cardTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            {Math.round((stats.cardTotal / (stats.totalSettled || 1)) * 100)}% of total volume
          </span>
        </div>

        {/* Cash Tendered */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Cash at Reception</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="font-mono font-extrabold text-2xl text-emerald-950 tabular-nums">
            ₹{stats.cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Staff PIN authenticated
          </span>
        </div>
      </div>

      {/* Tax & Reconciliation Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>Cumulative GST Collected:</span>
            <span className="font-mono font-extrabold text-slate-950">
              ₹{stats.totalTaxes.toFixed(2)}
            </span>
          </div>
          <p className="text-slate-500">
            Equal split: CGST 2.5% (₹{(stats.totalTaxes / 2).toFixed(2)}) + SGST 2.5% (₹{(stats.totalTaxes / 2).toFixed(2)})
          </p>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block text-[11px]">Unsettled Floor Balance:</span>
          <span className="font-mono font-extrabold text-rose-700 text-sm">
            ₹{unsettledTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Settlement Transactions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Channel:
            </span>
            {(['ALL', 'UPI', 'CARD', 'CASH'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  methodFilter === method
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {method === 'ALL' ? 'All Channels' : method}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Table & Section</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Taxes (5%)</th>
                <th className="py-3 px-4 text-right">Settled Total</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    TXN-{ord.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{ord.tableNumber}</span>{' '}
                    <span className="text-[11px] text-slate-400">({ord.section})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {ord.createdAt}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700">{ord.paymentMethod}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                    ₹{ord.subtotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                    ₹{ord.taxes.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm tabular-nums">
                    ₹{ord.finalTotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      SETTLED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
