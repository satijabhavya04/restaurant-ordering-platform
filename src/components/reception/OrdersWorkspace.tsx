import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  ChefHat,
  Flame,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { OrderBatchStatus, OrderItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DietaryBadge } from '../common/DietaryBadge';
import { Button } from '../common/Button';

interface OrdersWorkspaceProps {
  onOpenTable: (tableId: string) => void;
}

export const OrdersWorkspace: React.FC<OrdersWorkspaceProps> = ({ onOpenTable }) => {
  const { tables, updateOrderStatus } = useCustomer();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all batches across all tables
  const allBatches = useMemo(() => {
    const list: Array<{
      tableId: string;
      tableNumber: string;
      section: string;
      serverName: string;
      batchId: string;
      batchSequence: number;
      status: OrderBatchStatus;
      placedAt: string;
      items: OrderItem[];
      batchSubtotal: number;
      estimatedMinutes?: number;
    }> = [];

    tables.forEach((table) => {
      if (table.session && table.session.orderBatches) {
        table.session.orderBatches.forEach((batch) => {
          list.push({
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            serverName: table.serverName,
            ...batch,
          });
        });
      }
    });

    // Sort newest first
    return list.sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
  }, [tables]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: allBatches.length,
      newOrders: allBatches.filter((b) => b.status === 'NEW' || b.status === 'SUBMITTED').length,
      preparing: allBatches.filter((b) => b.status === 'PREPARING').length,
      ready: allBatches.filter((b) => b.status === 'READY').length,
      served: allBatches.filter((b) => b.status === 'SERVED').length,
    };
  }, [allBatches]);

  // Filtered
  const filteredBatches = useMemo(() => {
    return allBatches.filter((batch) => {
      if (selectedStatus === 'NEW' && batch.status !== 'NEW' && batch.status !== 'SUBMITTED') {
        return false;
      }
      if (selectedStatus !== 'ALL' && selectedStatus !== 'NEW' && batch.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTable = batch.tableNumber.toLowerCase().includes(q);
        const matchesBatch = batch.batchId.toLowerCase().includes(q);
        const matchesItem = batch.items.some((i) =>
          i.name.toLowerCase().includes(q)
        );
        if (!matchesTable && !matchesBatch && !matchesItem) return false;
      }
      return true;
    });
  }, [allBatches, selectedStatus, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Filters & Metrics Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Orders ({counts.all})
            </button>
            <button
              onClick={() => setSelectedStatus('NEW')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'NEW'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              New Orders ({counts.newOrders})
            </button>
            <button
              onClick={() => setSelectedStatus('PREPARING')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'PREPARING'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              In Kitchen ({counts.preparing})
            </button>
            <button
              onClick={() => setSelectedStatus('READY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'READY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Ready to Serve ({counts.ready})
            </button>
            <button
              onClick={() => setSelectedStatus('SERVED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'SERVED'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Served ({counts.served})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search table, item, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const isNew = batch.status === 'NEW' || batch.status === 'SUBMITTED';
            const isPreparing = batch.status === 'PREPARING';
            const isReady = batch.status === 'READY';
            const isServed = batch.status === 'SERVED';

            return (
              <div
                key={batch.batchId}
                className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  isReady
                    ? 'border-emerald-500 ring-2 ring-emerald-200/60 shadow-xs'
                    : isPreparing
                    ? 'border-amber-300'
                    : isNew
                    ? 'border-blue-300 ring-1 ring-blue-200'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-slate-900">
                          {batch.tableNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {batch.section}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        #{batch.batchId.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <StatusBadge
                        status={
                          isNew
                            ? 'new'
                            : isPreparing
                            ? 'preparing'
                            : isReady
                            ? 'ready'
                            : 'served'
                        }
                        size="sm"
                      />
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(batch.placedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Item List */}
                  <div className="py-3 space-y-2.5">
                    {batch.items.map((item) => (
                      <div key={item.orderItemId} className="text-xs space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5">
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              {item.quantity}x
                            </span>
                            <div>
                              <div className="flex items-center gap-1 font-medium text-slate-800">
                                <DietaryBadge diet={item.diet} />
                                <span>{item.name}</span>
                              </div>
                              {item.selectedModifiers.length > 0 && (
                                <div className="text-[11px] text-slate-500 pl-4">
                                  +{' '}
                                  {item.selectedModifiers
                                    .map((m) => m.optionName)
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-slate-700 tabular-nums shrink-0">
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                        </div>

                        {item.specialInstructions && (
                          <div className="ml-5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>"{item.specialInstructions}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenTable(batch.tableId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Open Table Drawer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {isNew && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          updateOrderStatus(batch.tableId, batch.batchId, 'PREPARING')
                        }
                        className="text-xs py-1.5 px-3 bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                        leftIcon={<ChefHat className="w-3.5 h-3.5" />}
                      >
                        Start Prep
                      </Button>
                    )}

                    {isPreparing && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          updateOrderStatus(batch.tableId, batch.batchId, 'READY')
                        }
                        className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700"
                        leftIcon={<Flame className="w-3.5 h-3.5" />}
                      >
                        Pass Ready
                      </Button>
                    )}

                    {isReady && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          updateOrderStatus(batch.tableId, batch.batchId, 'SERVED')
                        }
                        className="text-xs py-1.5 px-3 bg-slate-900 hover:bg-black text-white"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Mark Served
                      </Button>
                    )}

                    {isServed && (
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Delivered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-bold text-slate-700">No orders in this status</p>
          <p className="text-xs text-slate-400">
            Orders placed via QR codes or staff waiters appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
};
