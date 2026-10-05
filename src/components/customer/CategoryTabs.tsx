import React, { useRef, useEffect } from 'react';
import { useCustomer } from '../../context/CustomerContext';

export const CategoryTabs: React.FC = () => {
  const { categories, activeCategory, setActiveCategory } = useCustomer();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active chip into center view when changed
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const targetCat = !activeCategory || activeCategory === 'ALL' ? 'ALL' : activeCategory;
    const activeEl = container.querySelector(`[data-category="${targetCat}"]`) as HTMLElement;
    if (activeEl) {
      const scrollLeft =
        activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const isAllSelected = !activeCategory || activeCategory === 'ALL';

  return (
    <div className="sticky top-14 sm:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div
        ref={scrollContainerRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5"
      >
        {/* All Dishes Chip */}
        <button
          key="ALL"
          data-category="ALL"
          onClick={() => setActiveCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none shrink-0 ${
            isAllSelected
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          All Dishes
        </button>

        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              data-category={cat}
              onClick={() => setActiveCategory(isActive ? 'ALL' : cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
