import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Send, Check } from 'lucide-react';
import { MenuItem, SelectedModifier, RestaurantTable } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';
import { QuantityStepper } from '../common/QuantityStepper';
import { Button } from '../common/Button';

interface StaffOrderModalProps {
  isOpen?: boolean;
  tableId: string | null;
  tables: RestaurantTable[];
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface DraftOrderItem {
  draftId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export const StaffOrderModal: React.FC<StaffOrderModalProps> = ({
  isOpen = true,
  tableId,
  tables,
  onClose,
  onSuccess,
}) => {
  const { menuItems, categories, addStaffOrderToTable } = useCustomer();

  const [selectedTableId, setSelectedTableId] = useState<string>(
    tableId || tables[0]?.id || 'tbl_01'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [specialNote, setSpecialNote] = useState('');

  // Active customization drawer
  const [activeItemForCustomization, setActiveItemForCustomization] = useState<MenuItem | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<SelectedModifier[]>([]);
  const [activeQty, setActiveQty] = useState(1);

  // Sync selectedTableId whenever tableId prop updates
  useEffect(() => {
    if (tableId) {
      setSelectedTableId(tableId);
    }
  }, [tableId]);

  // Hierarchical Escape key to dismiss:
  // If customization sheet is open, ESC dismisses that sheet first.
  // Otherwise, ESC dismisses the main modal.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (activeItemForCustomization) {
          setActiveItemForCustomization(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemForCustomization, onClose]);

  // Strict guard: if not open or no tables exist, do not render
  if (!isOpen || (!tableId && tables.length === 0)) return null;

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCustomization = (item: MenuItem) => {
    // Default required modifiers
    const defaultMods: SelectedModifier[] = [];
    if (item.modifierGroups) {
      item.modifierGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          defaultMods.push({
            groupId: group.id,
            groupName: group.name,
            optionId: group.options[0].id,
            optionName: group.options[0].name,
            priceDelta: group.options[0].priceDelta,
          });
        }
      });
    }

    setActiveItemForCustomization(item);
    setActiveModifiers(defaultMods);
    setActiveQty(1);
  };

  const handleAddDraftItem = () => {
    if (!activeItemForCustomization) return;
    const modifierDelta = activeModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const unitPrice = activeItemForCustomization.basePrice + modifierDelta;

    const newItem: DraftOrderItem = {
      draftId: `draft_${Date.now()}_${Math.random()}`,
      menuItem: activeItemForCustomization,
      quantity: activeQty,
      selectedModifiers: activeModifiers,
      specialInstructions: specialNote.trim() || undefined,
      unitPrice,
      totalPrice: unitPrice * activeQty,
    };

    setDraftItems((prev) => [...prev, newItem]);
    setActiveItemForCustomization(null);
    setSpecialNote('');
  };

  const handleRemoveDraftItem = (draftId: string) => {
    setDraftItems((prev) => prev.filter((d) => d.draftId !== draftId));
  };

  const handleSubmitOrder = () => {
    if (draftItems.length === 0) return;

    addStaffOrderToTable(
      selectedTableId,
      draftItems.map((d) => ({
        menuItem: d.menuItem,
        quantity: d.quantity,
        selectedModifiers: d.selectedModifiers,
        specialInstructions: d.specialInstructions,
      }))
    );

    if (onSuccess) {
      onSuccess(`Staff order placed for ${selectedTable?.tableNumber || 'Table'}`);
    }

    onClose();
  };

  const draftSubtotal = draftItems.reduce((acc, d) => acc + d.totalPrice, 0);
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (activeItemForCustomization) {
        setActiveItemForCustomization(null);
      } else {
        onClose();
      }
    }
  };

  const handleCloseButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-order-title"
        className="relative w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[92vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 id="staff-order-title" className="text-sm sm:text-base font-black tracking-wide uppercase text-white">
                STAFF-ASSISTED ORDER ENTRY
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                POS TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Input orders on behalf of walk-ins or guests without phones.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseButton}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label="Close Staff Order Entry"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Main Workspace: Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Menu Catalog Explorer */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
            {/* Table Selector & Search */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Target Table:
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="flex-1 h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-brand-500"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      {tbl.tableNumber} ({tbl.section}) — {tbl.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes to add..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                    selectedCategory === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2 overscroll-contain">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenCustomization(item)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-brand-400 bg-white hover:bg-brand-50/20 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                      <DietaryBadge diet={item.diet} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-sm">
                      {item.description}
                    </p>
                    <span className="font-mono font-bold text-xs text-slate-900 mt-0.5 block">
                      ₹{item.basePrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="h-8 px-3 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Active Draft Items for Table */}
          <div className="w-full md:w-80 bg-slate-50 flex flex-col justify-between p-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Draft Round: {selectedTable?.tableNumber}
                </h3>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {draftItems.length} dish{draftItems.length === 1 ? '' : 'es'}
                </span>
              </div>

              {draftItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-1">
                  <p>No dishes selected yet.</p>
                  <p className="text-[11px]">Click any menu item on the left to add.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto py-2 pr-1">
                  {draftItems.map((d) => (
                    <div key={d.draftId} className="py-2.5 flex justify-between items-start text-xs">
                      <div className="pr-2 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {d.quantity}x {d.menuItem.name}
                        </div>
                        {d.selectedModifiers.length > 0 && (
                          <div className="text-[10px] text-slate-500">
                            {d.selectedModifiers.map((m) => m.optionName).join(', ')}
                          </div>
                        )}
                        {d.specialInstructions && (
                          <div className="text-[10px] text-amber-700 italic">
                            Note: "{d.specialInstructions}"
                          </div>
                        )}
                        <span className="font-mono font-semibold text-slate-800">
                          ₹{d.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveDraftItem(d.draftId)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Submission Summary */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-baseline font-bold text-sm text-slate-900">
                <span>Batch Total</span>
                <span className="font-mono text-lg text-slate-950 tabular-nums">
                  ₹{draftSubtotal.toFixed(2)}
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={draftItems.length === 0}
                onClick={handleSubmitOrder}
                rightIcon={<Send className="w-4 h-4" />}
                className="shadow-md"
              >
                Send Order to Kitchen
              </Button>
            </div>
          </div>
        </div>

        {/* Nested Modifier Selection Sheet (When selecting a dish) */}
        {activeItemForCustomization && (
          <div
            className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveItemForCustomization(null);
              }
            }}
          >
            <div
              className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {activeItemForCustomization.name}
                  </h3>
                  <span className="font-mono text-xs font-semibold text-slate-600">
                    Base Price: ₹{activeItemForCustomization.basePrice.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveItemForCustomization(null)}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close customization sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modifier Groups */}
              {activeItemForCustomization.modifierGroups?.map((group) => {
                const isRadio = group.maxSelection === 1;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="text-xs font-bold text-slate-900 uppercase">
                      {group.name}
                    </div>
                    <div className="space-y-1.5">
                      {group.options.map((opt) => {
                        const isSelected = activeModifiers.some((m) => m.optionId === opt.id);

                        return (
                          <div
                            key={opt.id}
                            onClick={() => {
                              if (isRadio) {
                                setActiveModifiers((prev) => [
                                  ...prev.filter((m) => m.groupId !== group.id),
                                  {
                                    groupId: group.id,
                                    groupName: group.name,
                                    optionId: opt.id,
                                    optionName: opt.name,
                                    priceDelta: opt.priceDelta,
                                  },
                                ]);
                              } else {
                                setActiveModifiers((prev) => {
                                  const exists = prev.some((m) => m.optionId === opt.id);
                                  if (exists) return prev.filter((m) => m.optionId !== opt.id);
                                  return [
                                    ...prev,
                                    {
                                      groupId: group.id,
                                      groupName: group.name,
                                      optionId: opt.id,
                                      optionName: opt.name,
                                      priceDelta: opt.priceDelta,
                                    },
                                  ];
                                });
                              }
                            }}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer select-none ${
                              isSelected
                                ? 'bg-brand-50 border-brand-400 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'bg-brand-500 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span>{opt.name}</span>
                            </span>
                            <span className="font-mono">
                              {opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : 'Included'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Special Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 uppercase">
                  Staff Cooking Note
                </label>
                <input
                  type="text"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="e.g. Extra spicy, serve fast..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              {/* Quantity Stepper & Add */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <QuantityStepper
                  quantity={activeQty}
                  onIncrement={() => setActiveQty((q) => q + 1)}
                  onDecrement={() => setActiveQty((q) => Math.max(1, q - 1))}
                  allowZero={false}
                  size="sm"
                />
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleAddDraftItem}
                >
                  Add to Batch
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
