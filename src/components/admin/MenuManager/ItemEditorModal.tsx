import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { MenuItem, DietaryType, ModifierGroup, KitchenStation } from '../../../types';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';

interface ItemEditorModalProps {
  item: MenuItem | null; // null when creating a new item
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, addMenuItem, updateMenuItem } = useCustomer();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Starters');
  const [diet, setDiet] = useState<DietaryType>('VEG');
  const [basePrice, setBasePrice] = useState<string>('250');
  const [station, setStation] = useState<KitchenStation>('TANDOOR');
  const [imageUrl, setImageUrl] = useState('');
  const [isBestseller, setIsBestseller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setCategory(item.category);
      setDiet(item.diet);
      setBasePrice(item.basePrice.toString());
      setStation(item.station);
      setImageUrl(item.imageUrl);
      setIsBestseller(item.isBestseller);
      setIsAvailable(item.isAvailable);
      setModifierGroups(item.modifierGroups || []);
    } else {
      setName('');
      setDescription('');
      setCategory(categories[0] || 'Starters');
      setDiet('VEG');
      setBasePrice('250');
      setStation('TANDOOR');
      setImageUrl('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80');
      setIsBestseller(false);
      setIsAvailable(true);
      setModifierGroups([]);
    }
    setErrorMessage(null);
  }, [item, isOpen, categories]);

  // Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddModifierGroup = () => {
    const newGroup: ModifierGroup = {
      id: `mod_${Date.now()}`,
      name: 'Portion Size',
      required: true,
      minSelection: 1,
      maxSelection: 1,
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Regular', priceDelta: 0 },
        { id: `opt_${Date.now()}_2`, name: 'Large', priceDelta: 80 },
      ],
    };
    setModifierGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveModifierGroup = (groupId: string) => {
    setModifierGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleAddOption = (groupId: string) => {
    setModifierGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: [
              ...g.options,
              { id: `opt_${Date.now()}`, name: 'New Option', priceDelta: 40 },
            ],
          };
        }
        return g;
      })
    );
  };

  const handleRemoveOption = (groupId: string, optionId: string) => {
    setModifierGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.filter((o) => o.id !== optionId),
          };
        }
        return g;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Dish name is required.');
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Please enter a valid price greater than 0.');
      return;
    }

    if (item) {
      // Update existing item
      updateMenuItem(item.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        diet,
        basePrice: priceNum,
        station,
        imageUrl: imageUrl.trim(),
        isBestseller,
        isAvailable,
        modifierGroups,
      });
      onSuccess(`Updated "${name}".`);
    } else {
      // Create new item
      addMenuItem({
        name: name.trim(),
        description: description.trim(),
        category,
        diet,
        basePrice: priceNum,
        station,
        imageUrl: imageUrl.trim(),
        isBestseller,
        isAvailable,
        modifierGroups,
      });
      onSuccess(`Added "${name}" to menu.`);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-editor-title"
        className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-overlay overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 id="item-editor-title" className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
              {item ? `Edit Dish: ${item.name}` : 'Create New Menu Item'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure dish attributes, station routing, and customizable modifier groups
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Dish Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Murgh Makhani"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price, Dietary Classification, Station */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Base Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Dietary Classification
              </label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value as DietaryType)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
              >
                <option value="VEG">Vegetarian (VEG)</option>
                <option value="NON_VEG">Non-Vegetarian (NON-VEG)</option>
                <option value="EGG">Contains Egg (EGG)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Kitchen Prep Station
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value as KitchenStation)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 uppercase font-mono text-xs"
              >
                <option value="TANDOOR">Tandoor</option>
                <option value="CURRY">Curry / Gravy</option>
                <option value="PAN_FRY">Pan Fry / Tawa</option>
                <option value="BEVERAGE">Beverage Bar</option>
                <option value="PANTRY">Pantry</option>
                <option value="DESSERT">Dessert / Mithai</option>
                <option value="CHINESE">Chinese & Asian</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Description & Culinary Ingredients
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe culinary preparation, spices, and texture..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
            />
          </div>

          {/* Image URL & Preview */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              High-Resolution Food Photography URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 font-mono"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              )}
            </div>
          </div>

          {/* Toggles: Bestseller and In Stock */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isBestseller"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="isBestseller" className="text-xs font-bold text-slate-800 cursor-pointer">
                Chef's Bestseller Badge (Featured at top of customer category)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailable"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="isAvailable" className="text-xs font-bold text-slate-800 cursor-pointer">
                In Stock & Available to Order
              </label>
            </div>
          </div>

          {/* Modifier Groups Section */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customization & Modifier Groups
                </h4>
                <p className="text-[11px] text-slate-400">
                  Allow guests to pick portion sizes, spice levels, or paid additions
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddModifierGroup}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                + Add Modifier Group
              </Button>
            </div>

            {modifierGroups.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No modifiers configured. Click "+ Add Modifier Group" to attach portion sizes or add-ons.
              </div>
            ) : (
              <div className="space-y-3">
                {modifierGroups.map((group) => (
                  <div key={group.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) =>
                            setModifierGroups((prev) =>
                              prev.map((g) => (g.id === group.id ? { ...g, name: e.target.value } : g))
                            )
                          }
                          className="font-bold text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 w-44"
                          placeholder="Group name"
                        />
                        <label className="flex items-center gap-1 text-[11px] text-slate-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) =>
                              setModifierGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id ? { ...g, required: e.target.checked } : g
                                )
                              )
                            }
                            className="w-3.5 h-3.5 rounded text-brand-600"
                          />
                          Required Choice
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveModifierGroup(group.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-100">
                      {group.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) =>
                              setModifierGroups((prev) =>
                                prev.map((g) => {
                                  if (g.id === group.id) {
                                    return {
                                      ...g,
                                      options: g.options.map((o) =>
                                        o.id === opt.id ? { ...o, name: e.target.value } : o
                                      ),
                                    };
                                  }
                                  return g;
                                })
                              )
                            }
                            className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs"
                            placeholder="Option name"
                          />
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <span>+₹</span>
                            <input
                              type="number"
                              min="0"
                              value={opt.priceDelta}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setModifierGroups((prev) =>
                                  prev.map((g) => {
                                    if (g.id === group.id) {
                                      return {
                                        ...g,
                                        options: g.options.map((o) =>
                                          o.id === opt.id ? { ...o, priceDelta: val } : o
                                        ),
                                      };
                                    }
                                    return g;
                                  })
                                );
                              }}
                              className="w-16 px-1.5 py-1 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(group.id, opt.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOption(group.id)}
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" leftIcon={<Check className="w-4 h-4" />}>
              {item ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
