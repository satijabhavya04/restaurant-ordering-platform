import React, { useRef, useEffect } from 'react';
import { Search, X, Frown } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { FoodCard } from './FoodCard';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const { searchQuery, setSearchQuery, menuItems } = useCustomer();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = menuItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const recentKeywords = ['Butter Chicken', 'Paneer Tikka', 'Naan', 'Biryani', 'Lassi'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search food menu"
      className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150"
    >
      {/* Search Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search curries, breads, appetizers, desserts..."
            className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-9 rounded-xl bg-slate-100 border border-slate-200 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            aria-label="Search dish name, ingredient, or category"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-400 transition-colors cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="min-h-[38px] px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
        >
          Cancel
        </button>
      </div>

      {/* Recent Keywords Chips */}
      {!searchQuery && (
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Popular Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {recentKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => setSearchQuery(kw)}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Frown className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              No dishes found matching "{searchQuery}"
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Try searching for "Paneer", "Chicken", "Naan" or check our category sections.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="text-xs text-slate-400 font-semibold mb-2">
              Found {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
