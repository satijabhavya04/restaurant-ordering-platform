import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';

export const MenuStockManager: React.FC = () => {
  const { menuItems, categories, toggleMenuItemAvailability } = useCustomer();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const outOfStockCount = useMemo(
    () => menuItems.filter((i) => !i.isAvailable).length,
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesStation = item.station?.toLowerCase().includes(q);
        if (!matchesName && !matchesStation) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Menu Item Availability & 86'ing
              </h2>
              {outOfStockCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {outOfStockCount} {outOfStockCount === 1 ? 'item' : 'items'} 86'd
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All in stock
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1-tap depletion controls. Items toggled off will instantly disable on guest QR menus in real-time.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes or stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.map((item) => {
          const isAvailable = item.isAvailable;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-white border transition-all flex items-center justify-between gap-3 ${
                isAvailable
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Thumbnail */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={`w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 ${
                    !isAvailable ? 'grayscale opacity-60' : ''
                  }`}
                  loading="lazy"
                />

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <DietaryBadge diet={item.diet} />
                    <span
                      className={`text-xs font-bold truncate ${
                        isAvailable ? 'text-slate-900' : 'text-slate-500 line-through'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-slate-800">
                      ₹{item.basePrice.toFixed(2)}
                    </span>
                    <span>•</span>
                    <span className="uppercase text-[10px] tracking-wide font-mono">
                      {item.station}
                    </span>
                  </div>

                  {/* Stock Status Pill */}
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isAvailable ? 'In Stock' : '86’d (Depleted)'}
                  </span>
                </div>
              </div>

              {/* 1-Tap Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleMenuItemAvailability(item.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isAvailable}
                aria-label={`Toggle availability for ${item.name}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No menu items found matching the selected filters.
        </div>
      )}
    </div>
  );
};
