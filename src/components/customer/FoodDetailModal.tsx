import React, { useState, useMemo } from 'react';
import { X, Star, AlertCircle, Check } from 'lucide-react';
import { MenuItem, SelectedModifier } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';
import { QuantityStepper } from '../common/QuantityStepper';
import { Button } from '../common/Button';

interface FoodDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCustomer();

  // Initialize selected modifiers with default required choices if applicable
  const initialModifiers = useMemo(() => {
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
    return defaultMods;
  }, [item]);

  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(initialModifiers);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate live item unit price and total price
  const modifierPriceDelta = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
  const unitPrice = item.basePrice + modifierPriceDelta;
  const totalPrice = unitPrice * quantity;

  // Radio button modifier handler
  const handleSelectRadio = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    priceDelta: number
  ) => {
    setSelectedModifiers((prev) => {
      const filtered = prev.filter((m) => m.groupId !== groupId);
      return [
        ...filtered,
        { groupId, groupName, optionId, optionName, priceDelta },
      ];
    });
    setValidationError(null);
  };

  // Checkbox multi-select modifier handler
  const handleToggleCheckbox = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    priceDelta: number
  ) => {
    setSelectedModifiers((prev) => {
      const exists = prev.some((m) => m.optionId === optionId);
      if (exists) {
        return prev.filter((m) => m.optionId !== optionId);
      }
      return [...prev, { groupId, groupName, optionId, optionName, priceDelta }];
    });
  };

  const handleAddQuickInstruction = (text: string) => {
    setInstructions((prev) => {
      if (prev.includes(text)) return prev;
      const separator = prev.length > 0 ? ', ' : '';
      const combined = `${prev}${separator}${text}`;
      return combined.slice(0, 120);
    });
  };

  const handleAddToCart = () => {
    // Validate that all required modifier groups have a selection
    if (item.modifierGroups) {
      for (const group of item.modifierGroups) {
        if (group.required) {
          const hasSelection = selectedModifiers.some((m) => m.groupId === group.id);
          if (!hasSelection) {
            setValidationError(`Please select a ${group.name}`);
            return;
          }
        }
      }
    }

    addToCart(item, quantity, selectedModifiers, instructions);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-detail-title"
        className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-overlay overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="sm:hidden w-full pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300"></div>
        </div>

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-white active:scale-95 shadow-sm transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Hero Food Image */}
          <div className="relative w-full h-52 sm:h-64 bg-slate-100">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <DietaryBadge diet={item.diet} showLabel />
                {item.isBestseller && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px]">
                    <Star className="w-3 h-3 fill-slate-950" />
                    Bestseller
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-xl text-white drop-shadow-sm tabular-nums">
                ₹{unitPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Description & Metadata */}
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h2 id="food-detail-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {item.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Modifiers List */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="p-4 sm:p-6 space-y-6">
              {item.modifierGroups.map((group) => {
                const isRadio = group.maxSelection === 1;

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          {group.name}
                        </h3>
                        {group.required && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {isRadio ? 'Select 1' : `Select up to ${group.maxSelection}`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedModifiers.some(
                          (m) => m.optionId === opt.id
                        );

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-brand-50/70 border-brand-300 text-slate-900'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-5 h-5 rounded-${
                                  isRadio ? 'full' : 'md'
                                } border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-brand-500 border-brand-500 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </span>
                              <span className="text-sm font-medium">{opt.name}</span>
                            </div>

                            <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                              {opt.priceDelta > 0
                                ? `+₹${opt.priceDelta.toFixed(2)}`
                                : 'Included'}
                            </div>

                            <input
                              type={isRadio ? 'radio' : 'checkbox'}
                              name={group.id}
                              checked={isSelected}
                              onChange={() => {
                                if (isRadio) {
                                  handleSelectRadio(
                                    group.id,
                                    group.name,
                                    opt.id,
                                    opt.name,
                                    opt.priceDelta
                                  );
                                } else {
                                  handleToggleCheckbox(
                                    group.id,
                                    group.name,
                                    opt.id,
                                    opt.name,
                                    opt.priceDelta
                                  );
                                }
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Cooking Instructions */}
          <div className="p-4 sm:p-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="instructions"
                className="text-sm font-bold text-slate-900 uppercase tracking-wide"
              >
                Special Cooking Instructions
              </label>
              <span className="text-xs text-slate-400 tabular-nums">
                {instructions.length}/120
              </span>
            </div>

            <textarea
              id="instructions"
              value={instructions}
              maxLength={120}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Less oil, extra well-done, no raw onions..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-slate-900 placeholder:text-slate-400"
            />

            {/* Quick helper chips */}
            <div className="flex flex-wrap gap-1.5">
              {['Less Spicy', 'No Onion / Garlic', 'Extra Crispy', 'Mild Gravy'].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddQuickInstruction(chip)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="px-4 sm:px-6 pb-2">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 sm:p-5 pb-6 sm:pb-5 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <QuantityStepper
            quantity={quantity}
            onIncrement={() => setQuantity((q) => q + 1)}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            allowZero={false}
            size="md"
          />

          {/* Add to Cart CTA */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            className="flex-1 shadow-md"
          >
            Add to Order • ₹{totalPrice.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};
