import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100';

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs gap-1.5 min-h-[36px]',
    md: 'h-11 px-4 text-sm gap-2 min-h-[44px]',
    lg: 'h-12 px-6 text-base gap-2.5 min-h-[48px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-500 hover:bg-brand-600 text-white shadow-subtle focus-visible:ring-brand-500 border border-brand-600',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-subtle focus-visible:ring-slate-400',
    tertiary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 focus-visible:ring-slate-300',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-300',
    destructive:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 focus-visible:ring-rose-500',
    success:
      'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 focus-visible:ring-emerald-500',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
