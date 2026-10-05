import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  Award,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { SEED_ANALYTICS_DATA } from '../../data/seedAdmin';
import { Button } from '../common/Button';

export const AdminOverview: React.FC = () => {
  const {
    setAdminTab,
    tables,
    menuItems,
    restaurantSettings,
    gameSettings,
  } = useCustomer();

  const metrics = SEED_ANALYTICS_DATA.TODAY;

  // Active table stats
  const totalTables = tables.length;
  const activeTablesCount = tables.filter((t) => t.status === 'ACTIVE').length;
  const payPendingCount = tables.filter((t) => t.status === 'PAYMENT_PENDING').length;
  const occupancyRate = totalTables > 0 ? Math.round((activeTablesCount / totalTables) * 100) : 0;

  // Top 5 dishes from menuItems sorted by price / popular
  const topDishes = [
    { rank: 1, name: 'Paneer Tikka Multani', category: 'Starters', sold: 42, revenue: 14280 },
    { rank: 2, name: 'Butter Chicken Aslam Style', category: 'Main Course', sold: 38, revenue: 17480 },
    { rank: 3, name: 'Dal Makhani Bukhara', category: 'Main Course', sold: 35, revenue: 11200 },
    { rank: 4, name: 'Butter Naan', category: 'Breads', sold: 88, revenue: 5280 },
    { rank: 5, name: 'Alphonso Mango Lassi', category: 'Beverages', sold: 29, revenue: 4060 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Restaurant Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {restaurantSettings.name}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              OPEN FOR SERVICE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {restaurantSettings.tagline} • GSTIN: <span className="font-mono text-slate-700">{restaurantSettings.gstin}</span>
          </p>
        </div>

        {/* Quick Management CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdminTab('TABLES_QR')}
            leftIcon={<QrCode className="w-3.5 h-3.5 text-slate-500" />}
          >
            Table QRs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAdminTab('MENU')}
            leftIcon={<UtensilsCrossed className="w-3.5 h-3.5" />}
          >
            Manage Menu
          </Button>
        </div>
      </div>

      {/* 5 Management KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Today's Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Today’s Revenue</span>
            <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {metrics.revenueChange}
            </span>
          </div>
          <div className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
            ₹{metrics.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Gross customer billings
          </span>
        </div>

        {/* Today's Orders */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Today’s Orders</span>
            <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {metrics.ordersChange}
            </span>
          </div>
          <div className="font-mono font-extrabold text-2xl text-slate-950">
            {metrics.ordersCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            QR orders + staff rounds
          </span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Average Order Value</span>
            <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {metrics.aovChange}
            </span>
          </div>
          <div className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
            ₹{metrics.aov.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Per completed dining bill
          </span>
        </div>

        {/* Table Occupancy */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Floor Occupancy</span>
            <span className="text-amber-700 bg-amber-50 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {occupancyRate}%
            </span>
          </div>
          <div className="font-mono font-extrabold text-2xl text-slate-950">
            {activeTablesCount} <span className="text-xs text-slate-400 font-normal">/ {totalTables} tables</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Dining in progress
          </span>
        </div>

        {/* Payment Pending */}
        <div
          onClick={() => setAdminTab('PAYMENTS')}
          className={`p-4 rounded-2xl bg-white border shadow-2xs transition-all cursor-pointer ${
            payPendingCount > 0
              ? 'border-purple-300 ring-1 ring-purple-200 bg-purple-50/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-800 font-semibold mb-1">
            <span>Awaiting Settlement</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="font-mono font-extrabold text-2xl text-purple-950">
            {payPendingCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Bills waiting for cashier
          </span>
        </div>
      </div>

      {/* 2-Column Analytics & Top Performers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hourly Sales & Order Activity Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today’s Hourly Sales Trend</h2>
              <p className="text-xs text-slate-400">Order throughput and gross revenue by meal service hour</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdminTab('ANALYTICS')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Full Analytics
            </Button>
          </div>

          {/* Hourly Volume Bar Graph */}
          <div className="pt-4">
            <div className="grid grid-cols-7 gap-2 items-end h-44 border-b border-slate-200 pb-2">
              {metrics.hourlyVolume.map((slot) => {
                const maxRevenue = 15000;
                const heightPct = Math.min(100, Math.round((slot.revenue / maxRevenue) * 100));

                return (
                  <div key={slot.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs mb-1">
                      ₹{slot.revenue}
                    </div>
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-brand-500 group-hover:bg-brand-600 rounded-t-lg transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {slot.hour}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-brand-500" />
                Hourly Gross Sales Volume
              </span>
              <span>Peak Service: 01:00 PM – 02:00 PM Lunch Rush</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Performing Menu Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Performing Dishes</h2>
              <p className="text-xs text-slate-400">By sales volume and revenue contribution</p>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {topDishes.map((dish) => (
              <div key={dish.rank} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                    {dish.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{dish.name}</p>
                    <p className="text-[10px] text-slate-400">{dish.category} • {dish.sold} sold</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                  ₹{dish.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdminTab('MENU')}
            className="w-full text-xs"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Menu Catalog ({menuItems.length} items)
          </Button>
        </div>
      </div>

      {/* Floor & Quick Governance Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game & Discounts Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Chef's Challenge Game</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                gameSettings.enabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {gameSettings.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gamified discount engine cap is set to <strong className="text-slate-900">{gameSettings.maxDiscountPercentage}%</strong> on eligible tables.
          </p>
          <div className="pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAdminTab('GAME_DISCOUNTS')}
              className="w-full text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Configure Discount Rules
            </Button>
          </div>
        </div>

        {/* Staff & Access Control Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Staff Governance</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">6 Members</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Role-based boundaries for Owner, Manager, Waiters, and Kitchen staff PIN authorization.
          </p>
          <div className="pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAdminTab('STAFF')}
              className="w-full text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Manage Roles & Permissions
            </Button>
          </div>
        </div>

        {/* Tables & QR Code Generator Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>Table Nodes & QR Codes</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">{totalTables} Tables</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Download print-ready QR codes for Main Dining, Terrace, and Rooftop tables.
          </p>
          <div className="pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAdminTab('TABLES_QR')}
              className="w-full text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Download Table Tent QRs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
