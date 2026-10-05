import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChefHat,
  CheckCircle2,
  Volume2,
  VolumeX,
  Flame,
  AlertTriangle,
  Smartphone,
  Layers,
  ShieldCheck,
  Check,
  LogOut,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { OrderBatchStatus } from '../../types';
import { securityGateway, KitchenSanitizedBatch } from '../../services/securityGateway';

export const KitchenDisplayShell: React.FC = () => {
  const { tables, updateOrderStatus, setCurrentView } = useCustomer();
  const { currentStaff, hasRole, staffLogout } = useAuth();

  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [timeString, setTimeString] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  // Synthesize Web Audio API 2-tone kitchen bell chime for incoming orders
  const playKitchenChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: A5 (880 Hz harmonic)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.14);
      gain2.gain.setValueAtTime(0.22, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.8);
    } catch {
      // Ignore audio autoplay policy restrictions if not yet interacted
    }
  };

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Collect sanitized batches across all tables (Strict zero PII / zero financial exposure)
  const allBatches: KitchenSanitizedBatch[] = useMemo(() => {
    return securityGateway.sanitizeOrdersForKitchen(tables);
  }, [tables]);

  // Active batches (New, Submitted, Preparing, Ready) filtered by Station
  const displayedBatches = useMemo(() => {
    return allBatches
      .filter((batch) => {
        if (filterStatus === 'ACTIVE') {
          if (batch.status === 'SERVED' || batch.status === 'CANCELLED') return false;
        }
        if (selectedStation !== 'ALL') {
          return batch.items.some((item) => item.station === selectedStation);
        }
        return true;
      })
      .map((batch) => {
        if (selectedStation === 'ALL') return batch;
        return {
          ...batch,
          items: batch.items.filter((item) => item.station === selectedStation),
        };
      });
  }, [allBatches, filterStatus, selectedStation]);

  const activeCount = allBatches.filter(
    (b) => b.status === 'NEW' || b.status === 'SUBMITTED' || b.status === 'PREPARING'
  ).length;

  // Trigger audio chime on new incoming tickets
  const prevActiveCount = useRef(activeCount);
  useEffect(() => {
    if (activeCount > prevActiveCount.current && soundEnabled) {
      playKitchenChime();
    }
    prevActiveCount.current = activeCount;
  }, [activeCount, soundEnabled]);

  // All-day item prep summary count (aggregated across active tickets)
  const allDaySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    allBatches
      .filter((b) => b.status === 'NEW' || b.status === 'SUBMITTED' || b.status === 'PREPARING')
      .forEach((b) => {
        b.items.forEach((item) => {
          summary[item.name] = (summary[item.name] || 0) + item.quantity;
        });
      });

    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [allBatches]);

  // Toggle strikethrough for individual line item
  const toggleItemStrike = (batchId: string, itemIdx: number) => {
    const key = `${batchId}_${itemIdx}`;
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Bump order status
  const handleBump = (tableId: string, batchId: string, currentStatus: OrderBatchStatus) => {
    if (currentStatus === 'NEW' || currentStatus === 'SUBMITTED') {
      updateOrderStatus(tableId, batchId, 'PREPARING');
    } else if (currentStatus === 'PREPARING') {
      updateOrderStatus(tableId, batchId, 'READY');
    } else if (currentStatus === 'READY') {
      updateOrderStatus(tableId, batchId, 'SERVED');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none">
      {/* Top KDS Command Bar */}
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4 shadow-md shrink-0">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#182234] border border-[#334155] flex items-center justify-center font-black text-xl text-orange-500 shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-white uppercase whitespace-nowrap">
                Kitchen Display System (KDS)
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-[#334155]">
                LINE STATION
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Expedite Feed
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300 font-bold">{timeString}</span>
            </div>
          </div>
        </div>

        {/* Center: Station Filter Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex items-center bg-[#0B0F19] p-1 rounded-xl border border-[#334155] text-xs font-bold overflow-x-auto no-scrollbar max-w-sm lg:max-w-md xl:max-w-xl shrink min-w-0">
          {['ALL', 'TANDOOR', 'CURRY', 'CHINESE', 'PAN_FRY', 'PANTRY', 'BEVERAGE', 'DESSERT'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStation(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedStation === st
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {st === 'ALL' ? 'ALL' : st}
            </button>
          ))}
        </div>

        {/* Right: Metrics & Portal Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Tickets Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#334155] text-xs font-mono">
            <span className="text-slate-400">TICKETS:</span>
            <span className="font-extrabold text-white text-sm">{activeCount}</span>
          </div>

          {/* Sound Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-[#334155] text-orange-400 hover:text-orange-300'
                : 'bg-[#0B0F19] border-[#334155] text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Chime Alert Enabled' : 'Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Authenticated Staff Station Profile */}
          {currentStaff && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#334155] text-xs">
              <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px]">
                {currentStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200 leading-none">{currentStaff.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentStaff.role}</div>
              </div>
              <button
                onClick={staffLogout}
                className="ml-1 p-1 text-slate-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
                title="Sign Out of Station"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Cross Portal Navigation Switcher (Filtered by RBAC) */}
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-xl border border-[#334155] text-xs font-semibold">
            <button
              onClick={() => setCurrentView('CUSTOMER')}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Diner App"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Diner</span>
            </button>
            {hasRole(['OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER']) && (
              <button
                onClick={() => setCurrentView('RECEPTION')}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Switch to Reception Console"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reception</span>
              </button>
            )}
            <div className="px-2.5 py-1 rounded-lg bg-[#182234] text-white font-bold flex items-center gap-1.5 border border-[#334155] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              <ChefHat className="w-3.5 h-3.5 text-orange-400" />
              <span>KDS</span>
            </div>
            {hasRole(['OWNER_ADMIN', 'MANAGER']) && (
              <button
                onClick={() => setCurrentView('ADMIN')}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Switch to Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Admin</span>
              </button>
            )}
            <button
              onClick={staffLogout}
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors flex md:hidden items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Station Filter Bar (< 768px) */}
      <div className="md:hidden bg-[#1E293B] border-b border-[#334155] px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        {['ALL', 'TANDOOR', 'CURRY', 'CHINESE', 'PAN_FRY', 'PANTRY', 'BEVERAGE', 'DESSERT'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStation(st)}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedStation === st
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-[#0B0F19] text-slate-300 border border-[#334155]'
            }`}
          >
            {st === 'ALL' ? 'ALL' : st}
          </button>
        ))}
      </div>

      {/* Main KDS Rail Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden">
        {/* Active Order Tickets Rail (75% on large screens) */}
        <div className="flex-1 p-4 sm:p-6 overflow-x-auto overflow-y-auto">
          {/* Subheader: Filter Status & Ticket Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'ACTIVE'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-[#182234] border border-[#334155] text-slate-400 hover:text-white'
                }`}
              >
                Active Line Tickets ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-[#182234] border border-[#334155] text-slate-400 hover:text-white'
                }`}
              >
                All Orders ({allBatches.length})
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span>Tip:</span>
              <span className="text-slate-300">Tap items to strike off as completed on line</span>
            </div>
          </div>

          {/* Multi-Column Tickets Grid */}
          {displayedBatches.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/80">
              <ChefHat className="w-16 h-16 text-slate-700 mb-3" />
              <h3 className="text-base font-bold text-slate-300">All Kitchen Tickets Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No orders pending preparation. When diners or waiters submit rounds, tickets appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
              {displayedBatches.map((batch) => {
                const isNew = batch.status === 'NEW' || batch.status === 'SUBMITTED';
                const isPreparing = batch.status === 'PREPARING';
                const isReady = batch.status === 'READY';
                const isServed = batch.status === 'SERVED';

                return (
                  <div
                    key={batch.batchId}
                    className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                      isReady
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30'
                        : isPreparing
                        ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/20'
                        : isNew
                        ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/40 animate-in fade-in'
                        : 'bg-slate-900/60 border-slate-800 opacity-70'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div
                      className={`p-3.5 border-b flex items-center justify-between ${
                        isReady
                          ? 'bg-emerald-950/60 border-emerald-800/60'
                          : isPreparing
                          ? 'bg-amber-950/60 border-amber-800/60'
                          : isNew
                          ? 'bg-blue-950/60 border-blue-800/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xl text-white tracking-tight">
                            {batch.tableNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                            Round #{batch.batchSequence}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {batch.section} • Waiter: {batch.serverName}
                        </span>
                      </div>

                      {/* State Chronometer Badge */}
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase ${
                            isReady
                              ? 'bg-emerald-500 text-white'
                              : isPreparing
                              ? 'bg-amber-500 text-slate-950'
                              : isNew
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {batch.status}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {batch.placedAt}
                        </div>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="p-4 space-y-3 divide-y divide-slate-800/60 flex-1">
                      {batch.items.map((item, idx) => {
                        const strikeKey = `${batch.batchId}_${idx}`;
                        const isStriked = completedItemIds.has(strikeKey);

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemStrike(batch.batchId, idx)}
                            className={`pt-2 first:pt-0 cursor-pointer group flex items-start gap-3 transition-opacity ${
                              isStriked ? 'opacity-40' : 'opacity-100'
                            }`}
                          >
                            {/* Quantity Badge */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 transition-colors ${
                                isStriked
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-orange-400 group-hover:bg-slate-700'
                              }`}
                            >
                              {item.quantity}x
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm font-extrabold leading-tight text-white ${
                                  isStriked ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {item.name}
                              </div>

                              {/* Modifiers */}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="text-[11px] text-orange-200/90 font-medium mt-0.5 space-x-1">
                                  {item.selectedModifiers.map((mod, mIdx) => (
                                    <span key={mIdx} className="inline-block">
                                      • {mod.optionName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Special Cooking Note */}
                              {item.specialInstructions && (
                                <div className="mt-1 text-[11px] font-bold text-rose-300 bg-rose-950/50 border border-rose-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{item.specialInstructions}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tactile 52px Bump Button Footer */}
                    <div className="p-3 bg-slate-950/80 border-t border-slate-800">
                      {isNew && (
                        <button
                          onClick={() => handleBump(batch.tableId, batch.batchId, batch.status)}
                          className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                        >
                          <Flame className="w-4 h-4" />
                          <span>Start Preparation</span>
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          onClick={() => handleBump(batch.tableId, batch.batchId, batch.status)}
                          className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Pass to Ready</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => handleBump(batch.tableId, batch.batchId, batch.status)}
                          className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Mark Served & Clear</span>
                        </button>
                      )}

                      {isServed && (
                        <div className="h-10 flex items-center justify-center text-xs font-mono font-bold text-slate-500">
                          COMPLETED & DELIVERED
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: All-Day Kitchen Prep Summary Panel */}
        <aside className="w-full lg:w-72 bg-[#182234] border-t lg:border-t-0 lg:border-l border-[#334155] p-5 shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#334155] mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  All-Day Prep Queue
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-600/20 text-orange-400 border border-orange-600/30">
                ACTIVE FIRE
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Aggregated units on fire across all active tickets:
            </p>

            {allDaySummary.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-4 text-center">
                No active items currently cooking
              </div>
            ) : (
              <div className="space-y-2">
                {allDaySummary.map(([itemName, totalQty]) => (
                  <div
                    key={itemName}
                    className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#334155] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-200 truncate pr-2">{itemName}</span>
                    <span className="font-mono font-black text-orange-400 px-2 py-0.5 rounded bg-[#182234] text-sm">
                      {totalQty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#334155] text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Station Router:</span>
              <span className="font-mono text-slate-400">{selectedStation}</span>
            </div>
            <div className="flex justify-between">
              <span>Audio Chime:</span>
              <span className="font-mono text-emerald-400">
                {soundEnabled ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
