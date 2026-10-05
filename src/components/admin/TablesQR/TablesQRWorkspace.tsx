import React, { useState, useMemo } from 'react';
import {
  QrCode,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Check,
} from 'lucide-react';
import { RestaurantTable } from '../../../types';
import { useCustomer } from '../../../context/CustomerContext';
import { StatusBadge } from '../../common/StatusBadge';
import { Button } from '../../common/Button';
import { QRCodeModal } from './QRCodeModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const TablesQRWorkspace: React.FC = () => {
  const { tables, addTable, deactivateTable } = useCustomer();

  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [qrModalTable, setQrModalTable] = useState<RestaurantTable | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<RestaurantTable | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);

  // New table form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [newSection, setNewSection] = useState<'Main Dining' | 'Terrace' | 'Rooftop'>('Main Dining');
  const [newServerName, setNewServerName] = useState('Vikram S.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const sections = ['ALL', 'Main Dining', 'Terrace', 'Rooftop'];

  const filteredTables = useMemo(() => {
    if (selectedSection === 'ALL') return tables;
    return tables.filter((t) => t.section === selectedSection);
  }, [tables, selectedSection]);

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    addTable({
      tableNumber: newTableNumber.trim(),
      capacity: parseInt(newCapacity, 10) || 4,
      section: newSection,
      serverName: newServerName.trim() || 'Staff Assigned',
    });

    setToastMessage(`Created ${newTableNumber.trim()} in ${newSection}.`);
    setIsAddTableOpen(false);
    setNewTableNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Table Layout & QR Node Management
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {tables.length} Tables Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage floor zones, guest seating capacity, active session states, and print-ready QR codes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}
          >
            Bulk Print QRs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddTableOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Add Table
          </Button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedSection === sec
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {sec === 'ALL' ? `All Zones (${tables.length})` : `${sec} (${tables.filter((t) => t.section === sec).length})`}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isAvailable = table.status === 'AVAILABLE';
          const isClosed = table.status === 'CLOSED';

          return (
            <div
              key={table.id}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                isClosed
                  ? 'border-slate-200 opacity-60 bg-slate-50'
                  : 'border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-xl text-slate-900">
                        {table.tableNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        ({table.capacity}p)
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {table.section}
                    </span>
                  </div>

                  <StatusBadge
                    status={
                      isAvailable
                        ? 'available'
                        : table.status === 'ACTIVE'
                        ? 'active'
                        : table.status === 'PAYMENT_PENDING'
                        ? 'pay-pending'
                        : table.status === 'PAID'
                        ? 'paid'
                        : 'closed'
                    }
                    size="sm"
                  />
                </div>

                {/* Session Meta */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Server:</span>
                    <span className="font-semibold text-slate-800">{table.serverName}</span>
                  </div>

                  {!isAvailable && !isClosed && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Seated Duration:</span>
                      <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {table.seatedDurationMinutes || 15}m
                      </span>
                    </div>
                  )}

                  {!isAvailable && !isClosed && table.session && (
                    <div className="flex items-center justify-between pt-1 font-bold">
                      <span className="text-slate-400">Active Bill:</span>
                      <span className="font-mono text-slate-950 tabular-nums">
                        ₹{table.session.bill.finalTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQrModalTable(table)}
                  className="flex-1 text-xs"
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-brand-600" />}
                >
                  View QR
                </Button>

                {!isClosed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeactivateTarget(table)}
                    className="text-xs text-slate-400 hover:text-rose-600"
                    title="Deactivate Table"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {isAddTableOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAddTableOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-overlay overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-base text-slate-900">Add Table Node</h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Table Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. Table 11"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Floor Zone
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Terrace">Terrace</option>
                    <option value="Rooftop">Rooftop</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Capacity (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Default Server
                </label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Server name"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddTableOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                  Create Table & QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      <QRCodeModal
        table={qrModalTable}
        isOpen={Boolean(qrModalTable)}
        onClose={() => setQrModalTable(null)}
      />

      {/* Deactivate Table Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        title="Deactivate Table"
        message={`Are you sure you want to deactivate ${deactivateTarget?.tableNumber}? Guests will not be able to scan or place orders until it is reactivated.`}
        confirmText="Deactivate"
        onConfirm={() => {
          if (deactivateTarget) {
            deactivateTable(deactivateTarget.id);
            setToastMessage(`Deactivated ${deactivateTarget.tableNumber}.`);
            setDeactivateTarget(null);
          }
        }}
        onCancel={() => setDeactivateTarget(null)}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
