import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Sparkles,
  BarChart3,
  PieChart,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useCustomer } from '../../../context/CustomerContext';
import { SEED_ANALYTICS_DATA } from '../../../data/seedAdmin';
import { AnalyticsTimeRange } from '../../../types';

export const AnalyticsWorkspace: React.FC = () => {
  const { analyticsRange, setAnalyticsRange } = useCustomer();

  const metrics = SEED_ANALYTICS_DATA[analyticsRange] || SEED_ANALYTICS_DATA.TODAY;

  const rangeLabels: { id: AnalyticsTimeRange; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: 'YESTERDAY', label: 'Yesterday' },
    { id: '7D', label: 'Last 7 Days' },
    { id: '30D', label: 'Last 30 Days' },
  ];

  // Calculate maximum revenue in hourly/daily volume for bar scaling
  const maxRevenue = Math.max(...metrics.hourlyVolume.map((item) => item.revenue), 1);
  const maxVolumeItem = metrics.hourlyVolume.reduce(
    (prev, current) => (current.revenue > prev.revenue ? current : prev),
    metrics.hourlyVolume[0]
  );

  const categoryColors = [
    'bg-amber-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-sky-500',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Time Range Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Performance & Financial Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              AGGREGATED REPORT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operational visibility into gross receipts, order throughput, category split, and payment channels.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          {rangeLabels.map((r) => (
            <button
              key={r.id}
              onClick={() => setAnalyticsRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                analyticsRange === r.id
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Gross Settled Revenue</span>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {metrics.revenueChange}
              </span>
            </div>
            <div className="font-mono font-extrabold text-2xl text-slate-950 tracking-tight">
              ₹{metrics.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-3 pt-3 border-t border-slate-100">
            Total receipts settled across all tables
          </span>
        </div>

        {/* Orders Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Completed Orders</span>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ShoppingBag className="w-3 h-3" />
                {metrics.ordersChange}
              </span>
            </div>
            <div className="font-mono font-extrabold text-2xl text-slate-950">
              {metrics.ordersCount}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-3 pt-3 border-t border-slate-100">
            QR orders + staff rounds fulfilled
          </span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Average Order Value (AOV)</span>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {metrics.aovChange}
              </span>
            </div>
            <div className="font-mono font-extrabold text-2xl text-slate-950 tracking-tight">
              ₹{metrics.aov.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-3 pt-3 border-t border-slate-100">
            Average ticket size per completed table
          </span>
        </div>

        {/* Chef Game Discount Redeemed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Chef Game Discounts</span>
              <span className="text-amber-700 bg-amber-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                Promo
              </span>
            </div>
            <div className="font-mono font-extrabold text-2xl text-amber-600 tracking-tight">
              ₹{metrics.discountRedeemed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-3 pt-3 border-t border-slate-100">
            {((metrics.discountRedeemed / metrics.revenue) * 100).toFixed(1)}% effective promotional cost of sales
          </span>
        </div>
      </div>

      {/* Two Column Section: Volume Distribution & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Volume & Throughput Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {analyticsRange === '7D' || analyticsRange === '30D'
                    ? 'Daily Revenue & Volume Trend'
                    : 'Hourly Operations & Throughput'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Peak service distribution across the selected time horizon
              </p>
            </div>
            {maxVolumeItem && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Peak: <strong className="text-slate-900">{maxVolumeItem.hour}</strong> (₹{maxVolumeItem.revenue.toLocaleString('en-IN')})
              </span>
            )}
          </div>

          {/* Bar Histogram Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end gap-2.5 sm:gap-4 px-2">
              {metrics.hourlyVolume.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
                const isPeak = item.revenue === maxVolumeItem.revenue;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-10 font-mono">
                      ₹{item.revenue.toLocaleString('en-IN')} • {item.orders} orders
                    </div>

                    {/* Peak badge */}
                    {isPeak && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded mb-1">
                        Peak
                      </span>
                    )}

                    {/* Bar Pillar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isPeak
                          ? 'bg-amber-500 group-hover:bg-amber-600'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />

                    {/* Label below */}
                    <span className="text-[10px] font-semibold text-slate-500 mt-2 block text-center truncate w-full">
                      {item.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              <span>Peak Service Period</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" />
              <span>Standard Service</span>
            </div>
          </div>
        </div>

        {/* Right: Category Revenue Share (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Menu Category Contribution
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Gross sales share generated by each kitchen catalog section
            </p>

            {/* Category Stacked Progress Breakdown */}
            <div className="space-y-3.5">
              {metrics.categoryShare.map((cat, idx) => {
                const barColor = categoryColors[idx % categoryColors.length];

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <span className={`w-2 h-2 rounded-full ${barColor}`} />
                        <span>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500">
                          ₹{cat.revenue.toLocaleString('en-IN')}
                        </span>
                        <span className="font-mono font-bold text-slate-900 w-8 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Primary Revenue Driver:</span>
            <span className="font-bold text-slate-900">
              Main Course (48% of gross sales)
            </span>
          </div>
        </div>
      </div>

      {/* Payment Channel Distribution & Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Payment Mix Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Settlement Channels & Payment Mix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Customer payment method distribution for audit & reconciliation
          </p>

          <div className="space-y-3">
            {metrics.paymentMix.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-xs font-bold text-slate-700 shadow-2xs">
                    {item.percentage}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.method}</h4>
                    <p className="text-[11px] text-slate-500">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} settled
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.method.includes('UPI')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.method.includes('Card')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.method.includes('UPI') ? 'Instant Contactless' : item.method.includes('Card') ? 'POS Terminal' : 'Reception Register'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Contactless Digital Adoption:</span>
            <span className="font-mono font-bold text-emerald-700">
              {metrics.paymentMix.find((m) => m.method.includes('UPI'))?.percentage || 60}% of total transactions
            </span>
          </div>
        </div>

        {/* Right: Operational Insights & Automated Takeaways (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Automated Operational Insights
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              AI-assisted operational efficiency and revenue optimization observations
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Peak Rush Notice: 01:00 PM – 02:00 PM
                  </h4>
                  <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                    Over 35% of daily covers are concentrated during lunch rush. Pre-firing tandoor breads and stocking prep stations reduces kitchen ticket times by an estimated 6 minutes.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    High Digital Payment Efficiency
                  </h4>
                  <p className="text-[11px] text-emerald-900/80 mt-0.5 leading-relaxed">
                    QR UPI settlements eliminated cashier queue bottlenecks for 64% of dining guests, reducing table turnaround time by 8.4 minutes per party.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Chef’s Challenge Gamification Lift
                  </h4>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5 leading-relaxed">
                    Customers who unlocked game discounts showed a 14.2% higher basket size due to add-on beverage and dessert orders before requesting the check.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Report generated in:</span>
            <span className="font-mono text-slate-700">Real-time local audit engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
