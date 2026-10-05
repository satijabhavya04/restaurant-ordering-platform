import React from 'react';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  CreditCard,
  Flame,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

interface ReceptionOverviewProps {
  onOpenTable: (tableId: string) => void;
  onOpenCashModal: (tableId: string) => void;
  onOpenStaffOrder: (tableId: string) => void;
}

export const ReceptionOverview: React.FC<ReceptionOverviewProps> = ({
  onOpenTable,
  onOpenCashModal,
  onOpenStaffOrder,
}) => {
  const {
    tables,
    setReceptionTab,
    acknowledgeRequest,
    resolveRequest,
    updateOrderStatus,
  } = useCustomer();

  // Aggregate stats across tables
  const totalTables = tables.length;
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
  const activeTables = tables.filter((t) => t.status === 'ACTIVE');
  const payPendingTables = tables.filter((t) => t.status === 'PAYMENT_PENDING');

  // Gather all service requests across all tables
  const allServiceRequests = tables.flatMap((table) => {
    if (!table.session || !table.session.serviceRequests) return [];
    return table.session.serviceRequests
      .filter((r) => r.status === 'REQUESTED' || r.status === 'ACKNOWLEDGED')
      .map((r) => ({
        ...r,
        tableId: table.id,
        tableNumber: table.tableNumber,
        section: table.section,
      }));
  });

  // Gather all order batches across all tables
  const allBatches = tables.flatMap((table) => {
    if (!table.session || !table.session.orderBatches) return [];
    return table.session.orderBatches.map((batch) => ({
      ...batch,
      tableId: table.id,
      tableNumber: table.tableNumber,
      section: table.section,
    }));
  });

  const preparingBatches = allBatches.filter((b) => b.status === 'PREPARING');
  const readyBatches = allBatches.filter((b) => b.status === 'READY');

  // Section occupancy
  const sections = ['Main Dining', 'Terrace', 'Rooftop'] as const;
  const sectionMetrics = sections.map((sec) => {
    const secTables = tables.filter((t) => t.section === sec);
    const occupied = secTables.filter((t) => t.status !== 'AVAILABLE').length;
    return {
      name: sec,
      total: secTables.length,
      occupied,
      pct: secTables.length ? Math.round((occupied / secTables.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* 6 Key Operational KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Available */}
        <div
          onClick={() => setReceptionTab('TABLES')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>Available</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
              {availableTables.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">/{totalTables}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Ready for guests
          </span>
        </div>

        {/* Active Occupied */}
        <div
          onClick={() => setReceptionTab('TABLES')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>Occupied</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
              {activeTables.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({Math.round((activeTables.length / totalTables) * 100)}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Dining in progress
          </span>
        </div>

        {/* In Kitchen Prep */}
        <div
          onClick={() => setReceptionTab('ORDERS')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-sky-700 font-semibold mb-1">
            <span>In Kitchen</span>
            <ChefHat className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
              {preparingBatches.length}
            </span>
            <span className="text-xs text-slate-400">rounds</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Cooking currently
          </span>
        </div>

        {/* Ready for Runner */}
        <div
          onClick={() => setReceptionTab('ORDERS')}
          className={`p-3.5 sm:p-4 rounded-2xl bg-white border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            readyBatches.length > 0
              ? 'border-emerald-500 ring-2 ring-emerald-200/50 bg-emerald-50/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
            <span>Ready to Serve</span>
            <Flame
              className={`w-3.5 h-3.5 ${
                readyBatches.length > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-900">
              {readyBatches.length}
            </span>
            <span className="text-xs text-emerald-700">pickup</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Pass counter hot
          </span>
        </div>

        {/* Payment Pending */}
        <div
          onClick={() => setReceptionTab('PAYMENTS')}
          className={`p-3.5 sm:p-4 rounded-2xl bg-white border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            payPendingTables.length > 0
              ? 'border-purple-500 ring-2 ring-purple-200/50 bg-purple-50/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-800 font-semibold mb-1">
            <span>Bill Pending</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-purple-950">
              {payPendingTables.length}
            </span>
            <span className="text-xs text-purple-700">tables</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Awaiting settlement
          </span>
        </div>

        {/* Service Requests Alert */}
        <div
          onClick={() => setReceptionTab('REQUESTS')}
          className={`p-3.5 sm:p-4 rounded-2xl bg-white border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            allServiceRequests.length > 0
              ? 'border-rose-500 ring-2 ring-rose-200/60 bg-rose-50/30'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
            <span>Open Calls</span>
            <Bell
              className={`w-3.5 h-3.5 ${
                allServiceRequests.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-rose-950">
              {allServiceRequests.length}
            </span>
            <span className="text-xs text-rose-700">active</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Guest assistance
          </span>
        </div>
      </div>

      {/* Main Grid: Priority Attention Stream + Floor Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Attention Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Priority Attention Queue</span>
                {allServiceRequests.length + readyBatches.length + payPendingTables.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {allServiceRequests.length + readyBatches.length + payPendingTables.length} urgent
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Live operational tasks requiring immediate waiter, runner, or cashier action
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReceptionTab('REQUESTS')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Requests
            </Button>
          </div>

          {/* Attention Queue List */}
          <div className="space-y-2.5">
            {/* 1. Guest Service Requests */}
            {allServiceRequests.map((req) => (
              <div
                key={req.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  req.status === 'REQUESTED'
                    ? 'bg-rose-50/70 border-rose-200 ring-1 ring-rose-300'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      req.status === 'REQUESTED'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {req.tableNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {req.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {req.requestedAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {req.note ? `Note: "${req.note}"` : `Guest called for ${req.type.toLowerCase().replace('_', ' ')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {req.status === 'REQUESTED' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => acknowledgeRequest(req.tableId, req.id)}
                      className="text-xs py-1 px-3 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => resolveRequest(req.tableId, req.id)}
                      className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Mark Resolved
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenTable(req.tableId)}
                    className="text-xs py-1 px-2 text-slate-500 hover:text-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 2. Ready Kitchen Orders (Waiters need to deliver) */}
            {readyBatches.map((batch) => (
              <div
                key={batch.batchId}
                className="p-3.5 sm:p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {batch.tableNumber}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                        READY TO SERVE
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Batch {batch.batchId.slice(-4)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">
                      {batch.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateOrderStatus(batch.tableId, batch.batchId, 'SERVED')}
                    className="text-xs py-1 px-3 bg-emerald-700 hover:bg-emerald-800"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Mark Served
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenTable(batch.tableId)}
                    className="text-xs py-1 px-2 text-slate-500 hover:text-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 3. Tables with Payment Pending */}
            {payPendingTables.map((tbl) => (
              <div
                key={tbl.id}
                className="p-3.5 sm:p-4 rounded-xl border border-purple-300 bg-purple-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {tbl.tableNumber}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900">
                        BILL REQUESTED
                      </span>
                      <span className="font-mono font-extrabold text-sm text-slate-900 tabular-nums">
                        ₹{(tbl.session?.bill.finalTotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Guests requested bill settlement ({tbl.serverName})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenCashModal(tbl.id)}
                    className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Accept Cash
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenTable(tbl.id)}
                    className="text-xs py-1 px-2 text-slate-700"
                  >
                    View Bill
                  </Button>
                </div>
              </div>
            ))}

            {/* Clean State When No Urgent Alerts */}
            {allServiceRequests.length === 0 &&
              readyBatches.length === 0 &&
              payPendingTables.length === 0 && (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    All Stations Operating Smoothly
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No urgent pending service requests or unclaimed kitchen passes at this moment.
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Right 1 Col: Floor Section Occupancy & Quick Jump */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Floor Sections</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReceptionTab('TABLES')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Floor Map
            </Button>
          </div>

          {/* Section Occupancy Cards */}
          <div className="space-y-3">
            {sectionMetrics.map((sec) => (
              <div
                key={sec.name}
                onClick={() => setReceptionTab('TABLES')}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                    {sec.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {sec.occupied} / {sec.total} Seated
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sec.pct > 80
                        ? 'bg-rose-500'
                        : sec.pct > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${sec.pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-medium">
                  <span>Occupancy Rate</span>
                  <span className="font-mono font-bold text-slate-700">{sec.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Fast Staff Order Launcher Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-orange-50/50 border border-brand-200/80 space-y-3">
            <div className="flex items-center gap-2 text-brand-800">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Staff-Assisted Order Entry
              </h3>
            </div>
            <p className="text-xs text-brand-900/80 leading-relaxed">
              Take an order directly for walk-in or offline guests and route it instantly to the kitchen KDS.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Find first available or active table
                const target = activeTables[0] || tables[0];
                if (target) onOpenStaffOrder(target.id);
              }}
              className="w-full text-xs"
              leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            >
              Take Staff Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
