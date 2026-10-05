import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  allowZero?: boolean;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  allowZero = true,
  min = 1,
  max = 99,
  size = 'md',
  className = '',
}) => {
  const isMin = !allowZero && quantity <= min;
  const isMax = quantity >= max;
  const isTrash = allowZero && quantity === 1;

  const btnClasses =
    size === 'sm'
      ? 'w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-700 hover:text-brand-600 active:scale-95 transition-transform cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500'
      : 'w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-700 hover:text-brand-600 active:scale-95 transition-transform cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500';

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-100 border border-slate-200 p-0.5 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={isMin}
        className={`${btnClasses} ${isMin ? 'opacity-30 cursor-not-allowed' : ''} rounded-lg hover:bg-white`}
        aria-label={isTrash ? 'Remove item' : 'Decrease quantity'}
      >
        {isTrash ? (
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
        ) : (
          <Minus className="w-3.5 h-3.5" />
        )}
      </button>

      <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 tabular-nums">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={isMax}
        className={`${btnClasses} ${isMax ? 'opacity-30 cursor-not-allowed' : ''} rounded-lg hover:bg-white`}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
