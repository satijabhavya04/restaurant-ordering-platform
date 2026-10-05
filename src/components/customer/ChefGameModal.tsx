import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Trophy, Play, CheckCircle2 } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

export const ChefGameModal: React.FC = () => {
  const { session, isGameOpen, closeGame, submitGameScore } = useCustomer();
  const [gameState, setGameState] = useState<'INTRO' | 'PLAYING' | 'RESULT'>(
    session.gameStatus.hasPlayed ? 'RESULT' : 'INTRO'
  );
  const [score, setScore] = useState(session.gameStatus.score || 0);
  const [timeLeft, setTimeLeft] = useState(15);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (session.gameStatus.hasPlayed) {
      setGameState('RESULT');
      setScore(session.gameStatus.score);
    }
  }, [session.gameStatus.hasPlayed, session.gameStatus.score]);

  // Mini-game physics & rendering engine
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentScore = 0;
    let timer = 15;

    // Countdown interval
    const interval = setInterval(() => {
      timer -= 1;
      setTimeLeft(timer);
      if (timer <= 0) {
        clearInterval(interval);
        setScore(currentScore);
        submitGameScore(currentScore);
        setGameState('RESULT');
      }
    }, 1000);

    // Game objects
    const pan = {
      x: canvas.width / 2 - 40,
      y: canvas.height - 35,
      width: 80,
      height: 16,
    };

    interface FallingItem {
      x: number;
      y: number;
      speed: number;
      type: 'HERB' | 'SAFFRON' | 'TRUFFLE' | 'BURNT';
      radius: number;
    }

    const items: FallingItem[] = [];
    let lastSpawn = Date.now();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
      }
      const xInCanvas = (clientX - rect.left) * (canvas.width / rect.width);
      pan.x = Math.max(0, Math.min(canvas.width - pan.width, xInCanvas - pan.width / 2));
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Game loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn falling ingredients
      const now = Date.now();
      if (now - lastSpawn > 400) {
        const types: FallingItem['type'][] = ['HERB', 'SAFFRON', 'TRUFFLE', 'BURNT'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        items.push({
          x: Math.random() * (canvas.width - 20) + 10,
          y: -10,
          speed: Math.random() * 2 + 2.5,
          type: chosen,
          radius: 9,
        });
        lastSpawn = now;
      }

      // Draw and update falling items
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Draw item
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);

        if (item.type === 'HERB') {
          ctx.fillStyle = '#10B981'; // Fresh Green
          ctx.fill();
        } else if (item.type === 'SAFFRON') {
          ctx.fillStyle = '#F59E0B'; // Saffron Gold
          ctx.fill();
        } else if (item.type === 'TRUFFLE') {
          ctx.fillStyle = '#EA580C'; // Royal Tangerine
          ctx.fill();
        } else {
          ctx.fillStyle = '#475569'; // Burnt Ember
          ctx.fill();
        }
        ctx.closePath();

        // Check collision with pan
        if (
          item.y + item.radius >= pan.y &&
          item.y - item.radius <= pan.y + pan.height &&
          item.x >= pan.x &&
          item.x <= pan.x + pan.width
        ) {
          if (item.type === 'BURNT') {
            currentScore = Math.max(0, currentScore - 10);
          } else {
            currentScore = Math.min(100, currentScore + 10);
          }
          setScore(currentScore);
          items.splice(i, 1);
          continue;
        }

        // Remove if off-screen
        if (item.y > canvas.height + 20) {
          items.splice(i, 1);
        }
      }

      // Draw Copper Saute Pan
      ctx.fillStyle = '#B45309'; // Copper pan rim
      ctx.beginPath();
      ctx.roundRect(pan.x, pan.y, pan.width, pan.height, [4, 4, 10, 10]);
      ctx.fill();
      ctx.closePath();

      // Pan highlight
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(pan.x + 4, pan.y + 2, pan.width - 8, 2);

      // Pan handle
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(pan.x - 12, pan.y + 4, 12, 5);

      if (timer > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [gameState, submitGameScore]);

  if (!isGameOpen) return null;

  const discountEarned =
    score >= 80 ? 20 : score >= 60 ? 15 : score >= 40 ? 10 : score >= 20 ? 5 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeGame}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-overlay overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 id="game-title" className="text-base font-bold text-slate-900 leading-tight">
                Chef's Precision Catch
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Win up to 20% discount on Table 04's meal
              </p>
            </div>
          </div>

          <button
            onClick={closeGame}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Introduction */}
        {gameState === 'INTRO' && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                15-Second Skill Challenge
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Catch gourmet herbs, saffron, and truffles in your copper pan. Dodge burnt charcoal!
              </p>
            </div>

            {/* Discount Tiers Table */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                Discount Scoring Tiers
              </div>
              <div className="flex justify-between text-slate-600">
                <span>80 – 100 Points</span>
                <strong className="text-emerald-700">20% OFF (Max Cap)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>60 – 79 Points</span>
                <strong className="text-emerald-700">15% OFF</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>40 – 59 Points</span>
                <strong className="text-emerald-700">10% OFF</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>20 – 39 Points</span>
                <strong className="text-emerald-700">5% OFF</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              *One attempt per table session. Discount applies to cumulative final food subtotal.
            </p>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                setTimeLeft(15);
                setScore(0);
                setGameState('PLAYING');
              }}
              leftIcon={<Play className="w-4 h-4 fill-white" />}
            >
              Start Challenge Now
            </Button>
          </div>
        )}

        {/* State 2: Active Gameplay */}
        {gameState === 'PLAYING' && (
          <div className="p-4 space-y-3">
            {/* Game Dashboard */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Score:
                </span>
                <span className="font-mono font-extrabold text-xl text-brand-600 tabular-nums">
                  {score}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
              </div>
            </div>

            {/* HTML5 Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 touch-none select-none">
              <canvas
                ref={canvasRef}
                width={360}
                height={260}
                className="w-full h-[260px] block cursor-ew-resize"
              />
              <div className="absolute top-2 left-2 text-[10px] text-slate-400 pointer-events-none">
                Drag pan left / right
              </div>
            </div>
          </div>
        )}

        {/* State 3: Result & Discount Voucher */}
        {gameState === 'RESULT' && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Final Score: {score} Points
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {discountEarned > 0
                  ? `🎉 You Unlocked ${discountEarned}% OFF!`
                  : 'Good Effort!'}
              </h3>
            </div>

            {discountEarned > 0 ? (
              <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  {discountEarned}% Session Voucher Applied
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  This discount has been permanently applied to the cumulative food subtotal of Table 04 across all ordering rounds.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Score 20+ points to earn a discount. Enjoy your freshly prepared food!
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={closeGame}
            >
              Continue Dining
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
