import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { MenuItem, DietaryType } from '../../../types';
import { useCustomer } from '../../../context/CustomerContext';
import { DietaryBadge } from '../../common/DietaryBadge';
import { Button } from '../../common/Button';
import { ItemEditorModal } from './ItemEditorModal';
import { CategoryEditorModal } from './CategoryEditorModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const MenuWorkspace: React.FC = () => {
  const {
    menuItems,
    categories,
    deleteMenuItem,
    deleteCategory,
    toggleMenuItemAvailability,
  } = useCustomer();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | DietaryType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const [deleteTargetItem, setDeleteTargetItem] = useState<MenuItem | null>(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (dietaryFilter !== 'ALL' && item.diet !== dietaryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Menu Architecture & Catalog
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {menuItems.length} Dishes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dishes, culinary categories, pricing, prep stations, and real-time inventory
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            leftIcon={<Layers className="w-3.5 h-3.5 text-slate-500" />}
          >
            + Category
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Add Dish
          </Button>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Row 1: Category Pills + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Dishes ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <div key={cat} className="flex items-center group">
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                  {/* Category edit/delete icon button */}
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1 ml-0.5 text-slate-300 hover:text-slate-700 transition-colors"
                    title={`Rename ${cat}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetCategory(cat)}
                    className="p-1 text-slate-300 hover:text-crimson-600 transition-colors"
                    title={`Delete ${cat}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Row 2: Dietary Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Diet:</span>
          {(['ALL', 'VEG', 'NON_VEG', 'EGG'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDietaryFilter(filter)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                dietaryFilter === filter
                  ? 'bg-brand-50 text-brand-800 border border-brand-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter === 'ALL'
                ? 'All Dietary'
                : filter === 'VEG'
                ? 'Vegetarian'
                : filter === 'NON_VEG'
                ? 'Non-Vegetarian'
                : 'Contains Egg'}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Catalog Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Dish</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Dish Thumbnail & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 ${
                          !item.isAvailable ? 'grayscale opacity-60' : ''
                        }`}
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <DietaryBadge diet={item.diet} />
                          <span className="font-bold text-slate-900 truncate">{item.name}</span>
                          {item.isBestseller && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              ★ Bestseller
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {item.category}
                    </span>
                  </td>

                  {/* Prep Station */}
                  <td className="py-3 px-4 font-mono uppercase text-[11px] text-slate-500">
                    {item.station}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                    ₹{item.basePrice.toFixed(2)}
                  </td>

                  {/* Stock Toggle Switch */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleMenuItemAvailability(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        item.isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={item.isAvailable}
                      title={`Toggle availability (Currently ${item.isAvailable ? 'In Stock' : '86’d'})`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs space-y-1">
            <p className="font-bold text-slate-700">No dishes match your filters</p>
            <p>Try clearing your search or switching to another category.</p>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      <ItemEditorModal
        item={editingItem}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      <CategoryEditorModal
        category={editingCategory}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetItem)}
        title="Delete Menu Item"
        message={`Are you sure you want to permanently delete "${deleteTargetItem?.name}"? It will be removed from all customer menus immediately.`}
        confirmText="Delete Item"
        onConfirm={() => {
          if (deleteTargetItem) {
            deleteMenuItem(deleteTargetItem.id);
            setToastMessage(`Deleted "${deleteTargetItem.name}" from menu.`);
            setDeleteTargetItem(null);
          }
        }}
        onCancel={() => setDeleteTargetItem(null)}
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetCategory)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteTargetCategory}"? Any dishes assigned to this category will need to be recategorized.`}
        confirmText="Delete Category"
        onConfirm={() => {
          if (deleteTargetCategory) {
            deleteCategory(deleteTargetCategory);
            setToastMessage(`Deleted category "${deleteTargetCategory}".`);
            if (selectedCategory === deleteTargetCategory) {
              setSelectedCategory('ALL');
            }
            setDeleteTargetCategory(null);
          }
        }}
        onCancel={() => setDeleteTargetCategory(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
