import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  X,
  Check,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { StaffMember, StaffRole } from '../../../types';
import { useCustomer } from '../../../context/CustomerContext';
import { Button } from '../../common/Button';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const StaffWorkspace: React.FC = () => {
  const {
    staffMembers,
    addStaffMember,
    toggleStaffStatus,
    removeStaffMember,
  } = useCustomer();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTargetStaff, setDeleteTargetStaff] = useState<StaffMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('WAITER');
  const [pin, setPin] = useState('1234');

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addStaffMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98000 00000',
      role,
      status: 'ACTIVE',
      pin: pin.trim() || '1234',
    });

    setToastMessage(`Added ${name.trim()} as ${role.replace('_', ' ')}.`);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setPin('1234');
  };

  const getRoleBadge = (r: StaffRole) => {
    switch (r) {
      case 'OWNER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Owner / Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Floor Manager
          </span>
        );
      case 'WAITER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Service Waiter
          </span>
        );
      case 'CASHIER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Cashier
          </span>
        );
      case 'KITCHEN':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
            Kitchen Staff
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Staff Directory & Role-Based Access
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {staffMembers.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage restaurant personnel, role assignments, audit PINs, and station permissions
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          + Add Staff Member
        </Button>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{member.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          PIN: •••• (Audit #{member.pin})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">{getRoleBadge(member.role)}</td>

                  {/* Contact */}
                  <td className="py-3 px-4 text-slate-600">
                    <span className="block text-slate-800">{member.email}</span>
                    <span className="text-[11px] text-slate-400">{member.phone}</span>
                  </td>

                  {/* Joined Date */}
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {member.joinedDate}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleStaffStatus(member.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title="Click to toggle status"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {member.status}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetStaff(member)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role & Permissions Matrix Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Role Permissions Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Granular capabilities enforced across Customer, Reception, Kitchen, and Admin interfaces
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-100 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">System Capability</th>
                <th className="py-2.5 px-3 text-center">Owner/Admin</th>
                <th className="py-2.5 px-3 text-center">Floor Manager</th>
                <th className="py-2.5 px-3 text-center">Service Waiter</th>
                <th className="py-2.5 px-3 text-center">Cashier</th>
                <th className="py-2.5 px-3 text-center">Kitchen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Manage Menu & Item Pricing
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Real-time 86’ing / Stock Outages
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Staff-Assisted Order Entry
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Cash Settlement & Billing Authorization
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Reset / Clear Table Guardrail
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Override</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Override</td>
                <td className="py-2.5 px-3 text-center text-slate-300">Paid Only</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Paid Only</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  System Settings & Financial Ledgers
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Full</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-overlay overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-base text-slate-900">Add Staff Account</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@restaurant.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 font-semibold"
                  >
                    <option value="OWNER_ADMIN">Owner / Admin</option>
                    <option value="MANAGER">Floor Manager</option>
                    <option value="WAITER">Service Waiter</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    4-Digit Audit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                  Create Staff Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetStaff)}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${deleteTargetStaff?.name}? Their access and staff PIN will be revoked immediately.`}
        confirmText="Remove Staff"
        onConfirm={() => {
          if (deleteTargetStaff) {
            removeStaffMember(deleteTargetStaff.id);
            setToastMessage(`Removed ${deleteTargetStaff.name}.`);
            setDeleteTargetStaff(null);
          }
        }}
        onCancel={() => setDeleteTargetStaff(null)}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-overlay border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
