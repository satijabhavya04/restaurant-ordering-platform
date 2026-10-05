import React, { useState } from 'react';
import { Sliders, Wifi, Slash, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const DemoControlBar: React.FC = () => {
  const {
    isOffline,
    simulateOfflineToggle,
    simulateItemDepleted,
    simulateRestoreItem,
    simulateSessionExpired,
    reopenSession,
    menuItems,
    openTracking,
    openGame,
    openBill,
  } = useCustomer();

  const [isExpanded, setIsExpanded] = useState(false);

  const paneerTikka = menuItems.find((m) => m.id === 'item_st_01');
  const isPaneerSoldOut = paneerTikka && !paneerTikka.isAvailable;

  return (
    <div className="fixed top-20 right-3 z-30 flex flex-col items-end">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-2.5 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-md hover:bg-slate-900 flex items-center gap-1.5 backdrop-blur-xs border border-slate-700 transition-all"
        title="Interactive QA Controls"
      >
        <Sliders className="w-3.5 h-3.5 text-brand-400" />
        <span className="hidden xs:inline">Demo Controls</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="mt-2 w-64 p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-800 flex justify-between items-center">
            <span>QA State Triggers</span>
            <span className="text-[10px] text-amber-400">Interactive</span>
          </div>

          {/* Sold Out Simulator */}
          <button
            onClick={() =>
              isPaneerSoldOut
                ? simulateRestoreItem('item_st_01')
                : simulateItemDepleted('item_st_01')
            }
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Slash className="w-3.5 h-3.5 text-rose-400" />
              <span>86 Paneer Tikka</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isPaneerSoldOut ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isPaneerSoldOut ? 'SOLD OUT' : 'IN STOCK'}
            </span>
          </button>

          {/* Offline Simulator */}
          <button
            onClick={simulateOfflineToggle}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Offline</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isOffline ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </button>

          {/* Session Lockout Simulator */}
          <button
            onClick={simulateSessionExpired}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between text-rose-300 transition-colors"
          >
            <span>Simulate Session Closed</span>
            <span className="text-[10px] text-slate-500">Lockout</span>
          </button>

          {/* Direct Navigation Shortcuts */}
          <div className="pt-1.5 border-t border-slate-800 grid grid-cols-3 gap-1">
            <button
              onClick={openTracking}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-center truncate"
            >
              Tracking
            </button>
            <button
              onClick={openGame}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-center truncate text-amber-300"
            >
              Game
            </button>
            <button
              onClick={openBill}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-center truncate text-emerald-300"
            >
              Bill
            </button>
          </div>

          {/* Reset Demo Session */}
          <button
            onClick={reopenSession}
            className="w-full px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 font-bold text-center text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Session</span>
          </button>
        </div>
      )}
    </div>
  );
};
