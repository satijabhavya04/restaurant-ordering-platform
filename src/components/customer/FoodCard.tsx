import React from 'react';
import { Star, Plus, Clock, Flame } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { DietaryBadge } from '../common/DietaryBadge';
import { QuantityStepper } from '../common/QuantityStepper';

interface FoodCardProps {
  item: MenuItem;
  variant?: 'standard' | 'compact';
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, variant = 'standard' }) => {
  const { openDetail, cartItems, addToCart, updateCartQuantity } = useCustomer();

  // Check if item has any active cart occurrences
  const matchingCartItems = cartItems.filter((ci) => ci.menuItemId === item.id);
  const totalQuantityInCart = matchingCartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

  const prepTime =
    item.prepTimeMinutes ||
    (item.category === 'Beverages & Shakes' || item.category === 'Mocktails & Coolers'
      ? 6
      : item.category === 'Desserts & Mithai' || item.category === 'Ice Cream & Kulfi'
      ? 5
      : item.category === 'Soups'
      ? 10
      : item.category === 'Tandoori Breads' || item.category === 'Accompaniments & Add-ons'
      ? 8
      : item.category === 'Tandoori & Grills'
      ? 18
      : item.category === 'North Indian Curries'
      ? 16
      : item.category === 'Rice & Biryani'
      ? 15
      : 12);

  const spiceLevel: number = (() => {
    if (item.spiceLevel !== undefined) return item.spiceLevel;
    const hasSpiceMod = item.modifierGroups?.some((g) => g.name.toLowerCase().includes('spice'));
    if (hasSpiceMod) return 2;
    const text = `${item.name} ${item.description}`.toLowerCase();
    if (
      text.includes('fiery') ||
      text.includes('extra spicy') ||
      text.includes('ghost') ||
      text.includes('schezwan') ||
      text.includes('mirch') ||
      text.includes('angara') ||
      text.includes('vindaloo')
    )
      return 3;
    if (
      text.includes('spiced') ||
      text.includes('spicy') ||
      text.includes('masala') ||
      text.includes('peppercorn') ||
      text.includes('tikka') ||
      text.includes('kadai') ||
      text.includes('kolhapuri') ||
      text.includes('chilli')
    )
      return 2;
    if (
      item.category === 'Tandoori & Grills' ||
      item.category === 'North Indian Curries' ||
      item.category === 'Chinese & Asian'
    )
      return 1;
    return 0;
  })();

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;

    if (hasModifiers) {
      // Open customization sheet
      openDetail(item);
    } else {
      // Direct quick-add 1 portion
      addToCart(item, 1, [], '');
    }
  };

  const handleIncrement = () => {
    if (hasModifiers) {
      // If it has modifiers, open customization sheet to specify which version or add another
      openDetail(item);
    } else if (matchingCartItems.length > 0) {
      updateCartQuantity(matchingCartItems[0].cartItemId, 1);
    }
  };

  const handleDecrement = () => {
    if (matchingCartItems.length > 0) {
      updateCartQuantity(matchingCartItems[0].cartItemId, -1);
    }
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => item.isAvailable && openDetail(item)}
        className={`flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 transition-all ${
          item.isAvailable ? 'hover:border-slate-300 cursor-pointer shadow-xs' : 'opacity-60 grayscale'
        }`}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 aspect-square"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <DietaryBadge diet={item.diet} />
            <h4 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h4>
          </div>
          <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
            ₹{item.basePrice.toFixed(2)}
          </span>
        </div>
        {item.isAvailable ? (
          <button
            onClick={handleAddClick}
            className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 active:scale-95 transition-all shrink-0"
          >
            ADD +
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-400">Sold out</span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => item.isAvailable && openDetail(item)}
      className={`relative group bg-white border border-slate-200 rounded-2xl p-4 transition-all duration-200 ${
        item.isAvailable
          ? 'hover:border-slate-300 hover:shadow-subtle cursor-pointer'
          : 'opacity-65 bg-slate-50/70 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-3.5">
        {/* Left Info Column */}
        <div className="flex-1 min-w-0">
          {/* Tags Header */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <DietaryBadge diet={item.diet} showLabel />
            {item.isBestseller && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[10px] tracking-wide uppercase">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                Bestseller
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              {prepTime}m
            </span>
            {spiceLevel > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]"
                title={`Spice Level: ${spiceLevel === 1 ? 'Mild' : spiceLevel === 2 ? 'Medium' : 'Hot'}`}
              >
                <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                {spiceLevel === 3 ? 'Spicy' : spiceLevel === 2 ? 'Medium' : 'Mild'}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
            {item.name}
          </h3>

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono font-bold text-base sm:text-lg text-slate-900 tabular-nums">
              ₹{item.basePrice.toFixed(2)}
            </span>
            {hasModifiers && (
              <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                Customizable
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Right Image + Action Column */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 aspect-square ${
                !item.isAvailable ? 'grayscale' : ''
              }`}
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-1">
                <span className="px-2 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider text-center">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Add or Stepper CTA Button */}
          {item.isAvailable && (
            <div className="absolute -bottom-3 shadow-md rounded-lg z-10">
              {totalQuantityInCart > 0 && !hasModifiers ? (
                <QuantityStepper
                  quantity={totalQuantityInCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  size="sm"
                  className="bg-white border-brand-200 shadow-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="relative min-h-[36px] h-9 px-4 rounded-lg bg-white border border-brand-200 text-brand-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand-50 hover:border-brand-400 active:scale-95 transition-all shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 before:absolute before:-inset-1.5 before:content-['']"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ADD</span>
                  {totalQuantityInCart > 0 && hasModifiers && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] ml-0.5 font-mono">
                      {totalQuantityInCart}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
