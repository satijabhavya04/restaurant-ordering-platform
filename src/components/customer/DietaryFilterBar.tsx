import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';

export const DietaryFilterBar: React.FC = () => {
  const { dietaryFilter, setDietaryFilter } = useCustomer();

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar"
      role="group"
      aria-label="Dietary preferences filter"
    >
      <button
        onClick={() => setDietaryFilter('ALL')}
        className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
          dietaryFilter === 'ALL'
            ? 'bg-brand-50 border-brand-300 text-brand-800 font-bold shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        All Dishes
      </button>

      <button
        onClick={() => setDietaryFilter('VEG')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          dietaryFilter === 'VEG'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <DietaryBadge diet="VEG" />
        <span>Veg Only</span>
      </button>

      <button
        onClick={() => setDietaryFilter('NON_VEG')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 ${
          dietaryFilter === 'NON_VEG'
            ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <DietaryBadge diet="NON_VEG" />
        <span>Non-Veg</span>
      </button>

      <button
        onClick={() => setDietaryFilter('BESTSELLER')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
          dietaryFilter === 'BESTSELLER'
            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Bestsellers</span>
      </button>
    </div>
  );
};
