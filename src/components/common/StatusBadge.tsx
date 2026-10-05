import React from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  CheckCheck,
  Utensils,
  Flame,
  Check,
  AlertCircle,
  Slash,
} from 'lucide-react';

export type StatusBadgeVariant =
  | 'available'
  | 'active'
  | 'pay-pending'
  | 'paid'
  | 'closed'
  | 'new'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'sold-out';

interface StatusBadgeProps {
  status: StatusBadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'available':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {label || 'Available'}
        </span>
      );

    case 'active':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          {label || 'Active Session'}
        </span>
      );

    case 'pay-pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}
        >
          <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          {label || 'Payment Pending'}
        </span>
      );

    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses} ${className}`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {label || 'Paid'}
        </span>
      );

    case 'preparing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses} ${className}`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          {label || 'Preparing'}
        </span>
      );

    case 'ready':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {label || 'Ready for Table'}
        </span>
      );

    case 'served':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses} ${className}`}
        >
          <Utensils className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {label || 'Served'}
        </span>
      );

    case 'sold-out':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}
        >
          <Slash className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          {label || 'Sold Out'}
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses} ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {label || status}
        </span>
      );
  }
};
