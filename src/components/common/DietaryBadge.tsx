import React from 'react';
import { DietaryType } from '../../types';

interface DietaryBadgeProps {
  diet: DietaryType;
  showLabel?: boolean;
  className?: string;
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({
  diet,
  showLabel = false,
  className = '',
}) => {
  if (diet === 'VEG') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        role="img"
        aria-label="Vegetarian dish"
        title="Vegetarian"
      >
        <span className="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center p-0.5 bg-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        </span>
        {showLabel && (
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Veg
          </span>
        )}
      </span>
    );
  }

  if (diet === 'NON_VEG') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        role="img"
        aria-label="Non-vegetarian dish"
        title="Non-Vegetarian"
      >
        <span className="w-3.5 h-3.5 border border-rose-600 rounded-xs flex items-center justify-center p-0.5 bg-white shrink-0">
          <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600"></span>
        </span>
        {showLabel && (
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
            Non-Veg
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label="Egg dish"
      title="Egg"
    >
      <span className="w-3.5 h-3.5 border border-amber-600 rounded-xs flex items-center justify-center p-0.5 bg-white shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Egg
        </span>
      )}
    </span>
  );
};
