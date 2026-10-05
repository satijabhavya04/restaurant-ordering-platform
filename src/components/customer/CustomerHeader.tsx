import React from 'react';
import { Bell, Search, Clock, Sparkles } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

interface CustomerHeaderProps {
  onSearchClick?: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ onSearchClick }) => {
  const { session, openHelp, openGame, openTracking } = useCustomer();

  const activeOrdersCount = session.orderBatches.filter(
    (b) => b.status === 'NEW' || b.status === 'SUBMITTED' || b.status === 'PREPARING' || b.status === 'READY'
  ).length;

  const hasReadyOrders = session.orderBatches.some((b) => b.status === 'READY');

  const pendingRequestsCount = session.serviceRequests.filter(
    (r) => r.status === 'REQUESTED' || r.status === 'ACKNOWLEDGED'
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-shadow duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Restaurant Identity & Table Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            SP
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
              {session.restaurantName}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                {session.tableNumber}
              </span>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Header Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Orders Tracker Pill */}
          {activeOrdersCount > 0 && (
            <button
              onClick={openTracking}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer ${
                hasReadyOrders
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
              aria-label={`View active order status (${activeOrdersCount} order batch${activeOrdersCount > 1 ? 'es' : ''} in kitchen)`}
              role="status"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasReadyOrders ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${hasReadyOrders ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="font-bold font-mono">{activeOrdersCount}</span>
              <span className="hidden xs:inline">{hasReadyOrders ? 'Ready to Serve' : 'in Kitchen'}</span>
            </button>
          )}

          {/* Game Shortcut Pill */}
          {session.orderBatches.length > 0 && !session.gameStatus.hasPlayed && (
            <button
              onClick={openGame}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-linear-to-r from-amber-500 to-brand-500 text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all"
              title="Play Chef's Challenge & Win 20% Off"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Win 20% Off</span>
              <span className="sm:hidden">Game</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            type="button"
            onClick={onSearchClick}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Search food items"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Service Call Bell */}
          <button
            type="button"
            onClick={openHelp}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Call waiter or request service"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {pendingRequestsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
