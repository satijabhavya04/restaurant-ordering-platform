import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode, ShieldCheck, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { RestaurantTable } from '../../../types';
import { Button } from '../../common/Button';

interface QRCodeModalProps {
  table: RestaurantTable | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ table, isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const targetUrl = typeof window !== 'undefined' && table
    ? `${window.location.origin}/customer?table=${table.id}&resto=resto_spice_pavilion`
    : '';

  useEffect(() => {
    if (table && targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to render authentic QR code data URL:', err));
    }
  }, [table, targetUrl]);

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !table) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `table_${table.tableNumber.toLowerCase().replace(/\s+/g, '_')}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-overlay overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="font-bold text-base text-slate-900 leading-tight">
                Table QR Tent Stand
              </h3>
              <p className="text-xs text-slate-500">
                {table.tableNumber} • {table.section}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 printable-tent-stand">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50/40 via-white to-orange-50/30 border-2 border-brand-200/80 shadow-xs space-y-4 max-w-xs mx-auto">
            {/* Restaurant Badge */}
            <div className="space-y-0.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-serif font-black text-base flex items-center justify-center mx-auto shadow-xs">
                P
              </div>
              <h4 className="font-bold text-sm text-slate-900">The Spice Pavilion</h4>
              <p className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
                Contactless Digital Dining
              </p>
            </div>

            {/* High-Resolution Dynamic QR Code */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for Table ${table.tableNumber}`}
                  className="w-44 h-44 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 font-mono text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Scannable Target URL */}
            <div className="text-[10px] text-slate-400 font-mono break-all px-2 select-all bg-slate-50 py-1 rounded border border-slate-200">
              {targetUrl}
            </div>

            {/* Table Number Identifier */}
            <div className="space-y-0.5">
              <span className="font-mono font-black text-2xl text-slate-900 tracking-tight block">
                {table.tableNumber}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Scan with Camera to Order & Pay
              </span>
            </div>
          </div>

          {/* Architectural Callout Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Dynamic Multi-Tenant Session</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Scanning this QR automatically attaches diner devices to {table.tableNumber}'s live authoritative session. Multiple diners at this table share a single synchronized order cart and bill.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            leftIcon={downloaded ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
          >
            {downloaded ? 'Saved PNG' : 'Download QR'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Tent Stand
          </Button>
        </div>
      </div>
    </div>
  );
};
