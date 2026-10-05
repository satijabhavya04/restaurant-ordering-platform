import React, { useState, useMemo } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DiningSessionStatus } from '../../types';
import { TableCard } from './TableCard';
import { Button } from '../common/Button';

interface TablesWorkspaceProps {
  onOpenTable: (tableId: string) => void;
  onOpenStaffOrder: (tableId: string) => void;
}

export const TablesWorkspace: React.FC<TablesWorkspaceProps> = ({
  onOpenTable,
  onOpenStaffOrder,
}) => {
  const { tables } = useCustomer();
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections = ['ALL', 'Main Dining', 'Terrace', 'Rooftop'];
  const statusOptions: { id: string; label: string; status?: DiningSessionStatus }[] = [
    { id: 'ALL', label: 'All Tables' },
    { id: 'AVAILABLE', label: 'Available', status: 'AVAILABLE' },
    { id: 'ACTIVE', label: 'Active Dining', status: 'ACTIVE' },
    { id: 'PAYMENT_PENDING', label: 'Bill Pending', status: 'PAYMENT_PENDING' },
    { id: 'PAID', label: 'Paid / Clearable', status: 'PAID' },
  ];

  // Count by status
  const counts = useMemo(() => {
    return {
      all: tables.length,
      available: tables.filter((t) => t.status === 'AVAILABLE').length,
      active: tables.filter((t) => t.status === 'ACTIVE').length,
      payPending: tables.filter((t) => t.status === 'PAYMENT_PENDING').length,
      paid: tables.filter((t) => t.status === 'PAID').length,
    };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      // Section filter
      if (selectedSection !== 'ALL' && table.section !== selectedSection) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && table.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = table.tableNumber.toLowerCase().includes(q);
        const matchesServer = table.serverName.toLowerCase().includes(q);
        const matchesSection = table.section.toLowerCase().includes(q);
        if (!matchesNumber && !matchesServer && !matchesSection) return false;
      }
      return true;
    });
  }, [tables, selectedSection, selectedStatus, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Control Bar: Section Tabs, Status Filter, Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Row 1: Section Pills + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Section Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSection === sec
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sec === 'ALL' ? 'All Sections' : sec}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search table, server..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Row 2: Status Filter Pills with Counts */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.id;
            let count = counts.all;
            if (opt.id === 'AVAILABLE') count = counts.available;
            if (opt.id === 'ACTIVE') count = counts.active;
            if (opt.id === 'PAYMENT_PENDING') count = counts.payPending;
            if (opt.id === 'PAID') count = counts.paid;

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-brand-50 text-brand-800 border border-brand-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onSelect={onOpenTable}
              onQuickOrder={onOpenStaffOrder}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-bold text-slate-700">No tables match your filters</p>
          <p className="text-xs text-slate-400">
            Try resetting the section or status filter to see other floor areas.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedSection('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
