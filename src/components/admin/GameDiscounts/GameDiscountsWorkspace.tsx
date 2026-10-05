import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';

export const GameDiscountsWorkspace: React.FC = () => {
  const { gameSettings, updateGameSettings } = useCustomer();

  const [enabled, setEnabled] = useState(gameSettings.enabled);
  const [maxDiscount, setMaxDiscount] = useState<number>(gameSettings.maxDiscountPercentage);
  const [minOrder, setMinOrder] = useState<number>(gameSettings.minOrderAmount);
  const [scoreTarget, setScoreTarget] = useState<number>(gameSettings.scoreThreshold);
  const [gameTitle, setGameTitle] = useState<string>(gameSettings.gameTitle);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation: discount capped at 20%
    const clampedDiscount = Math.min(20, Math.max(0, maxDiscount));
    const clampedMinOrder = Math.max(0, minOrder);
    const clampedScore = Math.min(100, Math.max(10, scoreTarget));

    updateGameSettings({
      enabled,
      maxDiscountPercentage: clampedDiscount,
      minOrderAmount: clampedMinOrder,
      scoreThreshold: clampedScore,
      gameTitle: gameTitle.trim() || "Chef's Challenge",
    });

    setToastMessage('Saved Game & Discount configuration successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Chef’s Challenge & Discount Engine
            </h2>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                enabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {enabled ? 'LIVE IN CUSTOMER APP' : 'PAUSED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure skill-based gamified discount rules, maximum discount caps, and eligibility limits
          </p>
        </div>
      </div>

      {/* 3 Impact Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Discounts Granted (MTD)
          </span>
          <div className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
            ₹28,400.00
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Across 264 table sessions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Guest Participation Rate
          </span>
          <div className="font-mono font-extrabold text-2xl text-slate-950">
            78.4%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            High customer engagement
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Average Discount Won
          </span>
          <div className="font-mono font-extrabold text-2xl text-slate-950 tabular-nums">
            13.2%
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            Capped at max limit of {gameSettings.maxDiscountPercentage}%
          </span>
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Master Enable Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="gameEnabled" className="font-bold text-sm text-slate-900 block cursor-pointer">
                Enable Chef’s Challenge Interactive Game
              </label>
              <p className="text-xs text-slate-500">
                When enabled, diners who place at least 1 order can play the mini-game to earn discounts on their final bill.
              </p>
            </div>
            <input
              type="checkbox"
              id="gameEnabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
            />
          </div>

          {/* Maximum Discount Slider & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Maximum Allowable Discount Cap (%)
              </label>
              <span className="font-mono font-extrabold text-base text-brand-600">
                {maxDiscount}% Max
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(parseInt(e.target.value, 10))}
              className="w-full accent-brand-500 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>0% (No discount)</span>
              <span>10% Default</span>
              <span className="font-bold text-slate-700">20% Strict Platform Limit</span>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Minimum Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={minOrder}
                onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bill threshold required to unlock game play
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Score Threshold for Max Discount
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={scoreTarget}
                onChange={(e) => setScoreTarget(parseInt(e.target.value, 10) || 60)}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Score needed in mini-game to unlock the top discount bracket
              </span>
            </div>
          </div>

          {/* Game Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Customer-Facing Game Banner Title
            </label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="e.g. Chef's Challenge: Flavor Match"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
            />
          </div>

          {/* Security & Validation Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Backend Fraud Prevention & Authorization Boundary</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Discount calculation is sealed on the server. Customers cannot modify discount percentages in local browser storage or tamper with final bill payloads.
            </p>
          </div>

          {/* Save CTA */}
          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md" leftIcon={<Check className="w-4 h-4" />}>
              Save Game Settings
            </Button>
          </div>
        </form>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
