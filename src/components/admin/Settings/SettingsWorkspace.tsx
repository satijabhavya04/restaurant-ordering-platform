import React, { useState } from 'react';
import {
  Building2,
  Percent,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Utensils,
  Receipt,
  Save,
} from 'lucide-react';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';

export const SettingsWorkspace: React.FC = () => {
  const { restaurantSettings, updateRestaurantSettings } = useCustomer();

  const [name, setName] = useState(restaurantSettings.name);
  const [legalName, setLegalName] = useState(restaurantSettings.legalName);
  const [tagline, setTagline] = useState(restaurantSettings.tagline);
  const [address, setAddress] = useState(restaurantSettings.address);
  const [phone, setPhone] = useState(restaurantSettings.phone);
  const [email, setEmail] = useState(restaurantSettings.email);
  const [gstin, setGstin] = useState(restaurantSettings.gstin);
  const [fssai, setFssai] = useState(restaurantSettings.fssai);
  const [taxRate, setTaxRate] = useState(restaurantSettings.taxRate);
  const [orderingEnabled, setOrderingEnabled] = useState(restaurantSettings.orderingEnabled);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(restaurantSettings.serviceChargeEnabled);
  const [serviceChargePercent, setServiceChargePercent] = useState(restaurantSettings.serviceChargePercent);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Restaurant display name cannot be blank.');
      return;
    }

    if (!gstin.trim() || gstin.trim().length !== 15) {
      setFormError('GSTIN must be a valid 15-character statutory alphanumeric code (e.g. 29AABCT1332L1ZV).');
      return;
    }

    if (!fssai.trim() || fssai.trim().length !== 14 || !/^\d+$/.test(fssai.trim())) {
      setFormError('FSSAI license must be a valid 14-digit statutory registration number.');
      return;
    }

    const parsedTax = Math.max(0, Math.min(28, taxRate));
    const parsedSC = Math.max(0, Math.min(20, serviceChargePercent));

    updateRestaurantSettings({
      name: name.trim(),
      legalName: legalName.trim() || name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      fssai: fssai.trim(),
      taxRate: parsedTax,
      orderingEnabled,
      serviceChargeEnabled,
      serviceChargePercent: parsedSC,
    });

    setToastMessage('Restaurant configuration & tax profile updated successfully.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Restaurant Configuration & Tax Profile
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage legal registration, statutory GSTIN/FSSAI details, dining service toggles, and tax policies.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {formError && (
        <div className="p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Configuration Validation Error: </span>
            <span>{formError}</span>
          </div>
        </div>
      )}

      {/* Reactive System Notice */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-950">
          <span className="font-bold">Real-time Reactive Propagation: </span>
          <span>
            Changes made here propagate immediately to customer QR dining headers, reception settlement dockets, tax invoices, and Kitchen tickets across all operational devices without requiring a system restart.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              Establishment Identity
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Customer-facing brand information and receipt headers
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name <span className="text-crimson-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="e.g. The Spice Pavilion"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Legal Registered Entity Name <span className="text-crimson-500">*</span>
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="e.g. Spice Pavilion Hospitality Private Limited"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline / Culinary Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="e.g. Authentic North Indian & Mughlai Fine Dining"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Premise Address
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  placeholder="Street address, locality, city, pincode"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="+91 80 4123 8890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="concierge@thespicepavilion.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Compliance & Tax Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Taxation & Compliance Registration
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Statutory tax identifiers printed on customer tax invoices
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  GSTIN (15-digit Tax Identification) <span className="text-crimson-500">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {gstin.length}/15
                </span>
              </div>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="29AABCT1332L1ZV"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Printed on formal tax dockets (2.5% CGST + 2.5% SGST)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  FSSAI License (14-digit Food Safety ID) <span className="text-crimson-500">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {fssai.length}/14
                </span>
              </div>
              <input
                type="text"
                maxLength={14}
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="11221334000452"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statutory GST Rate (%)
                </label>
                <div className="relative">
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="28"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Default 5.0% for restaurant services
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="₹ INR (Indian Rupee)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Standard national payment currency
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Dining Operations & Service Charges */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-slate-600" />
            Operational & Dining Policies
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Control customer digital ordering capabilities and optional discretionary charges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Digital Ordering Master Switch */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Customer Digital Table Ordering
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    orderingEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {orderingEnabled ? 'ENABLED' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                When enabled, seated guests can add dishes and submit kitchen batches directly from their mobile devices. If paused, the digital menu becomes view-only.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOrderingEnabled(!orderingEnabled)}
              className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Toggle Digital Table Ordering"
            >
              {orderingEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </div>

          {/* Discretionary Service Charge Toggle */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Discretionary Service Charge
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      serviceChargeEnabled
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {serviceChargeEnabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Voluntary hospitality contribution added to customer checks prior to statutory taxes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setServiceChargeEnabled(!serviceChargeEnabled)}
                className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                aria-label="Toggle Service Charge"
              >
                {serviceChargeEnabled ? (
                  <ToggleRight className="w-8 h-8 text-amber-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            {serviceChargeEnabled && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Service Charge Rate (%)
                </label>
                <div className="w-28 relative">
                  <Percent className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="15"
                    value={serviceChargePercent}
                    onChange={(e) => setServiceChargePercent(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold text-slate-900 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Live Docket & Receipt Header Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Receipt className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Live Settlement Docket Preview
          </h3>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 max-w-md mx-auto space-y-1 text-center shadow-inner">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">{name || 'RESTAURANT NAME'}</div>
          <div className="text-[10px] text-slate-500">{legalName}</div>
          <div className="text-[10px] text-slate-500">{address}</div>
          <div className="text-[10px] text-slate-500">Ph: {phone}</div>
          <div className="border-t border-dashed border-slate-300 my-2 pt-1 text-[10px]">
            GSTIN: <span className="font-bold text-slate-900">{gstin}</span> • FSSAI: <span className="font-bold text-slate-900">{fssai}</span>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            *** TAX INVOICE SAMPLE PREVIEW ***
          </div>
        </div>
      </div>

      {/* Save Button Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save All Changes
        </Button>
      </div>
    </form>
  );
};
