import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  ChefHat,
  Layers,
  Users,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { StaffRole } from '../../types';
import { SEED_STAFF } from '../../data/seedAdmin';

interface StaffLoginViewProps {
  redirectAfterLogin?: string;
}

export const StaffLoginView: React.FC<StaffLoginViewProps> = ({ redirectAfterLogin }) => {
  const { staffLogin } = useAuth();
  const { setCurrentView, restaurantSettings } = useCustomer();

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await staffLogin(identifier, pin);
      if (result.success) {
        // If a redirect was specified, route to it via view state or path
        if (redirectAfterLogin) {
          const path = redirectAfterLogin.toLowerCase();
          if (path.startsWith('/admin')) {
            setCurrentView('ADMIN');
            return;
          }
          if (path.startsWith('/reception')) {
            setCurrentView('RECEPTION');
            return;
          }
          if (path.startsWith('/kitchen')) {
            setCurrentView('KITCHEN');
            return;
          }
          if (path.startsWith('/customer')) {
            setCurrentView('CUSTOMER');
            return;
          }
          window.location.href = redirectAfterLogin;
          return;
        }

        // Navigate automatically based on staff credentials
        const staff = SEED_STAFF.find(
          (s) =>
            s.email.toLowerCase() === identifier.trim().toLowerCase() ||
            s.name.toLowerCase() === identifier.trim().toLowerCase() ||
            s.role.toLowerCase() === identifier.trim().toLowerCase()
        );

        if (staff?.role === 'KITCHEN') {
          setCurrentView('KITCHEN');
        } else if (staff?.role === 'WAITER' || staff?.role === 'CASHIER') {
          setCurrentView('RECEPTION');
        } else {
          setCurrentView('ADMIN');
        }
      } else {
        setErrorMessage(result.message || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setErrorMessage('An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (staffEmail: string, staffPin: string, _targetRole?: StaffRole) => {
    setIdentifier(staffEmail);
    setPin(staffPin);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between p-4 sm:p-6 selection:bg-orange-600 selection:text-white">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-serif font-black text-xl text-white shadow-xs">
            P
          </div>
          <div>
            <span className="font-bold text-sm text-[#0F172A] tracking-tight block">
              {restaurantSettings.name}
            </span>
            <span className="text-[10px] font-mono text-[#475569]">
              STAFF AUTHENTICATION GATEWAY
            </span>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('CUSTOMER')}
          className="text-xs text-[#475569] hover:text-[#0F172A] flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Diner View</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600 mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Staff Portal Sign In
            </h1>
            <p className="text-xs text-[#475569]">
              Enter your registered restaurant credentials and 4-digit security PIN to access your workstation.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Staff Email or Name
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rajiv.m@thespicepavilion.com"
                  className="w-full pl-10 pr-3.5 h-11 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  4-Digit Security PIN
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Audit PIN
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-3.5 h-11 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 tracking-widest font-mono text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Staff Logins */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#475569] font-medium">
              <span>Demo Quick-Fill Roles:</span>
              <span className="text-[10px] font-mono text-orange-600 font-bold">Click to test</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect('rajiv.m@thespicepavilion.com', '1234', 'OWNER_ADMIN')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Rajiv (Owner)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">PIN: 1234 • Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('ananya.s@thespicepavilion.com', '2345', 'MANAGER')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ananya (Manager)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">PIN: 2345 • Ops</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('devendra.r@thespicepavilion.com', '6789', 'KITCHEN')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Devendra (Chef)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">PIN: 6789 • KDS</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('vikram.s@thespicepavilion.com', '3456', 'WAITER')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Vikram (Waiter)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">PIN: 3456 • Tables</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="max-w-md mx-auto w-full text-center pb-2 text-[11px] text-slate-400">
        Secured by Platform RBAC & Row-Level Authorization • Multi-Tenant Protected
      </footer>
    </div>
  );
};
