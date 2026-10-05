import React, { useState, useMemo } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Droplets,
  Utensils,
  Receipt,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { ServiceRequestStatus, ServiceRequestType } from '../../types';
import { Button } from '../common/Button';

interface RequestsWorkspaceProps {
  onOpenTable: (tableId: string) => void;
}

export const RequestsWorkspace: React.FC<RequestsWorkspaceProps> = ({ onOpenTable }) => {
  const { tables, acknowledgeRequest, resolveRequest } = useCustomer();
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE'); // 'ACTIVE' = REQUESTED + ACKNOWLEDGED

  // Flatten all requests across tables
  const allRequests = useMemo(() => {
    const list: Array<{
      tableId: string;
      tableNumber: string;
      section: string;
      serverName: string;
      id: string;
      type: ServiceRequestType;
      status: ServiceRequestStatus;
      requestedAt: string;
      acknowledgedAt?: string;
      resolvedAt?: string;
      note?: string;
    }> = [];

    tables.forEach((table) => {
      if (table.session && table.session.serviceRequests) {
        table.session.serviceRequests.forEach((req) => {
          list.push({
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            serverName: table.serverName,
            ...req,
          });
        });
      }
    });

    return list;
  }, [tables]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: allRequests.length,
      active: allRequests.filter(
        (r) => r.status === 'REQUESTED' || r.status === 'ACKNOWLEDGED'
      ).length,
      requested: allRequests.filter((r) => r.status === 'REQUESTED').length,
      acknowledged: allRequests.filter((r) => r.status === 'ACKNOWLEDGED').length,
      resolved: allRequests.filter((r) => r.status === 'RESOLVED').length,
    };
  }, [allRequests]);

  // Filtered
  const filteredRequests = useMemo(() => {
    return allRequests.filter((req) => {
      if (selectedStatus === 'ACTIVE') {
        return req.status === 'REQUESTED' || req.status === 'ACKNOWLEDGED';
      }
      if (selectedStatus === 'REQUESTED') return req.status === 'REQUESTED';
      if (selectedStatus === 'ACKNOWLEDGED') return req.status === 'ACKNOWLEDGED';
      if (selectedStatus === 'RESOLVED') return req.status === 'RESOLVED';
      return true;
    });
  }, [allRequests, selectedStatus]);

  const getRequestIcon = (type: ServiceRequestType) => {
    switch (type) {
      case 'WATER':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'BILL':
        return <Receipt className="w-4 h-4 text-purple-600" />;
      case 'CUTLERY':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'OTHER':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'WAITER':
      default:
        return <Bell className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-600" />
              <span>Guest Assistance & Service Calls</span>
              {counts.requested > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                  {counts.requested} unacknowledged
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Live guest requests routed directly from table QR sessions
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'ACTIVE'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Active Queue ({counts.active})
            </button>
            <button
              onClick={() => setSelectedStatus('REQUESTED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'REQUESTED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Pending ({counts.requested})
            </button>
            <button
              onClick={() => setSelectedStatus('ACKNOWLEDGED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'ACKNOWLEDGED'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              In Progress ({counts.acknowledged})
            </button>
            <button
              onClick={() => setSelectedStatus('RESOLVED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedStatus === 'RESOLVED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Resolved ({counts.resolved})
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const isRequested = req.status === 'REQUESTED';
            const isAck = req.status === 'ACKNOWLEDGED';
            const isResolved = req.status === 'RESOLVED';

            return (
              <div
                key={req.id}
                className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  isRequested
                    ? 'border-rose-300 ring-2 ring-rose-200/70 bg-rose-50/20'
                    : isAck
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 opacity-75'
                }`}
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {getRequestIcon(req.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-base text-slate-900">
                            {req.tableNumber}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            ({req.section})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {req.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isRequested
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : isAck
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {req.requestedAt}
                      </div>
                    </div>
                  </div>

                  {/* Note or message */}
                  <div className="py-3 text-xs">
                    {req.note ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic font-medium">"{req.note}"</span>
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        Guest requested staff assistance for {req.type.toLowerCase().replace('_', ' ')}.
                      </p>
                    )}

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Server: {req.serverName}</span>
                      {req.resolvedAt && (
                        <span>Resolved at {req.resolvedAt}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenTable(req.tableId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Open Table Drawer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {isRequested && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => acknowledgeRequest(req.tableId, req.id)}
                        className="text-xs py-1.5 px-3 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      >
                        Acknowledge
                      </Button>
                    )}

                    {!isResolved && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => resolveRequest(req.tableId, req.id)}
                        className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Mark Resolved
                      </Button>
                    )}

                    {isResolved && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No requests in this queue</p>
          <p className="text-xs text-slate-400">
            Guest calls for water, cutlery, or waiter will show up here instantly.
          </p>
        </div>
      )}
    </div>
  );
};
