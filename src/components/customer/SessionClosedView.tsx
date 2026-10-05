import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

export const SessionClosedView: React.FC = () => {
  const { session, reopenSession } = useCustomer();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-subtle text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {session.restaurantName} • {session.tableNumber}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            Dining Session Concluded
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your bill has been settled and this table session is now closed. Further orders cannot be placed against this table.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Thank you for visiting us!</p>
          <p>If you need further assistance or wish to dine again, please ask our floor team to seat you.</p>
        </div>

        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={reopenSession}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Start Fresh Table Session (Demo)
          </Button>
        </div>
      </div>
    </div>
  );
};
