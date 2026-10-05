import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, simulateOfflineToggle } = useCustomer();

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
        <span>
          Connection Lost. Reconnecting to table session... Your cart is saved offline.
        </span>
      </div>

      <button
        onClick={simulateOfflineToggle}
        className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Reconnect</span>
      </button>
    </div>
  );
};
