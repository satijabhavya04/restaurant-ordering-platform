import React, { useState } from 'react';
import {
  X,
  Droplet,
  UtensilsCrossed,
  Bell,
  Receipt,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { ServiceRequestType } from '../../types';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../common/Button';

export const ServiceRequestSheet: React.FC = () => {
  const { session, isHelpOpen, closeHelp, submitServiceRequest } = useCustomer();
  const [selectedType, setSelectedType] = useState<ServiceRequestType>('WATER');
  const [customNote, setCustomNote] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  if (!isHelpOpen) return null;

  const handleSubmit = () => {
    submitServiceRequest(selectedType, customNote.trim() || undefined);
    setCustomNote('');
    setSubmittedFeedback(true);
    setTimeout(() => {
      setSubmittedFeedback(false);
    }, 3000);
  };

  const quickOptions: {
    type: ServiceRequestType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: 'WATER', label: 'Water Bottle', icon: <Droplet className="w-5 h-5" /> },
    { type: 'CUTLERY', label: 'Extra Cutlery', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { type: 'WAITER', label: 'Call Waiter', icon: <Bell className="w-5 h-5" /> },
    { type: 'BILL', label: 'Request Bill', icon: <Receipt className="w-5 h-5" /> },
    { type: 'OTHER', label: 'Other Help', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeHelp}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-request-title"
        className="relative w-full max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-overlay overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 id="service-request-title" className="text-base font-bold text-slate-900 leading-tight">
              Table Assistance
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Direct service request for {session.tableNumber}
            </p>
          </div>

          <button
            onClick={closeHelp}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close help sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 pb-6 sm:pb-5 overflow-y-auto space-y-5 overscroll-contain">
          {/* Quick Select Tiles */}
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2.5">
              Select Service Request
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {quickOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="customHelpNote"
              className="text-xs font-bold text-slate-900 uppercase tracking-wider block"
            >
              Additional Note (Optional)
            </label>
            <div className="relative">
              <input
                id="customHelpNote"
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please bring extra ice cubes or paper napkins..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 placeholder:text-slate-400 pr-10"
              />
              <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send Request to Staff
          </Button>

          {/* Instant Confirmation Toast */}
          {submittedFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Staff notified! Someone will visit {session.tableNumber} shortly.</span>
            </div>
          )}

          {/* Recent Service Requests List */}
          {session.serviceRequests.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Table Requests
              </h4>
              <div className="space-y-2">
                {session.serviceRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 capitalize">
                        {req.type.toLowerCase().replace('_', ' ')}
                        {req.note && <span className="font-normal text-slate-600 ml-1">- "{req.note}"</span>}
                      </div>
                      <span className="text-[11px] text-slate-400">{req.requestedAt}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                        req.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
