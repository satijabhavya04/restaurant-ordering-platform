import { AlertTriangle, Trash2, Bell, RefreshCw } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

export const ItemUnavailableRecoverySheet: React.FC = () => {
  const {
    unavailableItem,
    isItemUnavailableSheetOpen,
    menuItems,
    resolveUnavailableItem,
  } = useCustomer();

  if (!isItemUnavailableSheetOpen || !unavailableItem) return null;

  // Find similar available items in the same category
  const recommendations = menuItems
    .filter(
      (m) =>
        m.id !== unavailableItem.id &&
        m.category === unavailableItem.category &&
        m.isAvailable &&
        m.diet === unavailableItem.diet
    )
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-unavailable-title"
        className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-overlay overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        {/* Header Alert */}
        <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-start gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="item-unavailable-title" className="text-base font-bold text-rose-950 leading-tight">
              Item Just Sold Out
            </h3>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              <strong>{unavailableItem.name}</strong> was just marked out of stock by the kitchen. How would you like to proceed?
            </p>
          </div>
        </div>

        {/* Body Options */}
        <div className="p-5 pb-6 sm:pb-5 overflow-y-auto space-y-5 overscroll-contain">
          {/* Option 1: Suggested Replacements */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
                <span>Recommended Instant Replacements</span>
              </div>
              <div className="space-y-2">
                {recommendations.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => resolveUnavailableItem('REPLACE', rep.id)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-brand-300 bg-slate-50/50 hover:bg-brand-50/30 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {rep.name}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {rep.description}
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                        ₹{rep.basePrice.toFixed(2)}
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="shrink-0 font-bold">
                      Swap with this
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option 2 & 3 Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="destructive"
              size="md"
              onClick={() => resolveUnavailableItem('REMOVE')}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="flex-1"
            >
              Remove from Order
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => resolveUnavailableItem('WAITER')}
              leftIcon={<Bell className="w-4 h-4" />}
              className="flex-1"
            >
              Ask Waiter for Options
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
