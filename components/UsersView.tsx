'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  KeyRound,
  Lock,
  Edit3,
  Check,
  X,
  EyeOff,
  Database,
} from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';
import { AppUser, UserRole } from '@/lib/types';

const RBAC_MATRIX: {
  role: UserRole;
  stationScope: string;
  editVoters: string;
  unmaskPhone: string;
  importRollback: string;
  exportData: string;
  deleteRestore: string;
  manageUsers: string;
}[] = [
  {
    role: 'Super Admin',
    stationScope: 'All 41 Stations (PS 1–41)',
    editVoters: 'Full Write',
    unmaskPhone: 'Allowed (Audit Logged)',
    importRollback: 'Allowed',
    exportData: 'Auto-Approved',
    deleteRestore: 'Soft-Delete & Restore',
    manageUsers: 'All Roles (Incl. Admins)',
  },
  {
    role: 'Admin/Coordinator',
    stationScope: 'All 41 Stations (PS 1–41)',
    editVoters: 'Full Write',
    unmaskPhone: 'Allowed (Audit Logged)',
    importRollback: 'Allowed',
    exportData: 'Approve & Export',
    deleteRestore: 'Soft-Delete Only',
    manageUsers: 'Incharge, Worker & Viewer Only',
  },
  {
    role: 'Polling Station Incharge',
    stationScope: 'Assigned Booths Only',
    editVoters: 'Scoped Booths Only',
    unmaskPhone: 'Scoped Booths Only',
    importRollback: 'Hidden / Blocked',
    exportData: 'Requires Admin Approval',
    deleteRestore: 'Blocked',
    manageUsers: 'Hidden / Blocked',
  },
  {
    role: 'Field Worker',
    stationScope: 'Assigned Booths / Households',
    editVoters: 'Assigned Booths Only',
    unmaskPhone: 'Masked Only (98XXXXXX21)',
    importRollback: 'Hidden / Blocked',
    exportData: 'Blocked',
    deleteRestore: 'Blocked',
    manageUsers: 'Hidden / Blocked',
  },
  {
    role: 'Viewer',
    stationScope: 'Scoped / Read-Only',
    editVoters: 'Read-Only',
    unmaskPhone: 'Masked Only (98XXXXXX21)',
    importRollback: 'Hidden / Blocked',
    exportData: 'Blocked',
    deleteRestore: 'Blocked',
    manageUsers: 'Hidden / Blocked',
  },
];

const ALL_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Super Admin', label: 'Super Admin (All 41 Booths)' },
  { value: 'Admin/Coordinator', label: 'Admin/Coordinator (All 41 Booths)' },
  { value: 'Polling Station Incharge', label: 'Polling Station Incharge (Scoped Booths)' },
  { value: 'Field Worker', label: 'Field Worker (Scoped Booths)' },
  { value: 'Viewer', label: 'Viewer (Read-Only)' },
];

export default function UsersView() {
  const {
    users,
    allVillages: villages,
    allVillageParts: villageParts,
    pollingStations,
    currentUser,
    voters,
    scopedPollingStations,
    lockSession,
    canManageUsers,
    canManageRole,
    canEditUserAccount,
    createUser,
    toggleUserActive,
    updateUserRoleScope,
  } = useVoterStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('Field Worker');
  const [selectedPsIds, setSelectedPsIds] = useState<string[]>(['ps-1']);
  const [selectedVillageIds, setSelectedVillageIds] = useState<string[]>(['vil-1']);

  // Inline Edit Role & Scope Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Field Worker');
  const [editPsIds, setEditPsIds] = useState<string[]>(['ps-1']);
  const [editVillageIds, setEditVillageIds] = useState<string[]>(['vil-1']);
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !pin.trim()) return;
    if (!canManageRole(role)) return;
    const isGlobalRole = role === 'Super Admin' || role === 'Admin/Coordinator';
    const resolvedPsIds = isGlobalRole ? ['ALL'] : selectedPsIds.length > 0 ? selectedPsIds : ['ps-1'];
    const derivedVillageIds =
      isGlobalRole || resolvedPsIds.includes('ALL')
        ? ['ALL']
        : Array.from(
            new Set(
              villageParts
                .filter((vp) => resolvedPsIds.includes(vp.pollingStationId))
                .map((vp) => vp.villageId)
            )
          );
    createUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '9862000000',
      password: password.trim(),
      pin: pin.trim(),
      role,
      pollingStationIds: resolvedPsIds,
      villageIds: derivedVillageIds.length > 0 ? derivedVillageIds : selectedVillageIds,
      active: true,
    });
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setPin('');
  };

  const openEditModal = (u: AppUser) => {
    if (!canEditUserAccount(u)) return;
    setEditingUser(u);
    setEditRole(u.role);
    setEditPsIds(u.pollingStationIds.includes('ALL') ? ['ps-1', 'ps-2'] : u.pollingStationIds);
    setEditVillageIds(u.villageIds.includes('ALL') ? ['vil-1'] : u.villageIds);
    setEditPassword(u.password || '');
    setEditPin(u.pin || '');
  };

  const handleSaveRoleScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!canEditUserAccount(editingUser) || !canManageRole(editRole)) return;
    const isGlobal = editRole === 'Super Admin' || editRole === 'Admin/Coordinator';
    const resolvedPsIds = isGlobal ? ['ALL'] : editPsIds.length > 0 ? editPsIds : ['ps-1'];
    const derivedVillageIds =
      isGlobal || resolvedPsIds.includes('ALL')
        ? ['ALL']
        : Array.from(
            new Set(
              villageParts
                .filter((vp) => resolvedPsIds.includes(vp.pollingStationId))
                .map((vp) => vp.villageId)
            )
          );
    updateUserRoleScope(editingUser.id, {
      role: editRole,
      pollingStationIds: resolvedPsIds,
      villageIds: derivedVillageIds.length > 0 ? derivedVillageIds : editVillageIds,
      password: editPassword.trim() || undefined,
      pin: editPin.trim() || undefined,
    });
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Active Data Isolation Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Role-Based Authentication & Data Isolation (RBAC)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every query, mutation, phone number reveal, and CSV export is strictly isolated by the authenticated official&apos;s Role and Polling Station scope (PS 1–41).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 text-xs font-semibold text-[#0071e3] dark:text-blue-300">
              <Shield className="h-3.5 w-3.5" />
              Active: {currentUser.name} ({currentUser.role})
            </span>
            <button
              type="button"
              onClick={lockSession}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <Lock className="h-3.5 w-3.5" />
              Authenticate / Lock Session
            </button>
          </div>
        </div>

        {/* Live Data Isolation Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Authenticated Role</span>
              <KeyRound className="h-3.5 w-3.5 text-[#0071e3]" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{currentUser.role}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
              {currentUser.email}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Isolated Station Scope</span>
              <Database className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {scopedPollingStations.length} of {pollingStations.length} Polling Stations
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
              {currentUser.pollingStationIds.includes('ALL')
                ? 'ALL (PS 1–41)'
                : currentUser.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Accessible Voter Records</span>
              <Shield className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {voters.length} Scoped Voters
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Out-of-scope booths automatically hidden
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>PII & Phone Protection</span>
              <EyeOff className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {currentUser.role === 'Field Worker' || currentUser.role === 'Viewer'
                ? 'Enforced Masking'
                : 'Unmask Authorized'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Every unmask event logged to Audit Trail
            </div>
          </div>
        </div>

        {/* 5-Tier RBAC Data Protection Matrix */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Role Tier</th>
                <th className="py-2.5 px-3">Station Scope</th>
                <th className="py-2.5 px-3">Voter Edits</th>
                <th className="py-2.5 px-3">Phone PII</th>
                <th className="py-2.5 px-3">Import / Rollback</th>
                <th className="py-2.5 px-3">CSV Export</th>
                <th className="py-2.5 px-3">Delete / Restore</th>
                <th className="py-2.5 px-3">User Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {RBAC_MATRIX.map((row) => {
                const isActiveRole = row.role === currentUser.role;
                return (
                  <tr
                    key={row.role}
                    className={
                      isActiveRole
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 font-medium'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/40'
                    }
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex items-center gap-1.5">
                        {row.role}
                        {isActiveRole && (
                          <span className="rounded-full bg-[#0071e3] px-1.5 py-0.2 text-[10px] text-white">
                            Active
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.stationScope}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.editVoters}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.unmaskPhone}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.importRollback}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.exportData}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.deleteRestore}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{row.manageUsers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create New User Form */}
        <form
          onSubmit={handleCreateUser}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#0071e3]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Create Official & Assign Station Scope
            </h3>
          </div>

          {!canManageUsers && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
              Your current active role ({currentUser.role}) is read-only for User Management. Switch to Super Admin or Admin/Coordinator to provision accounts.
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                disabled={!canManageUsers}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oinam Bikramjit Singh"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Official Email (Used for Email &amp; Security PIN Login)
              </label>
              <input
                type="email"
                disabled={!canManageUsers}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bikramjit.fw@thoubal31.org"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                disabled={!canManageUsers}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9862XXXXXX"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  disabled={!canManageUsers}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Account password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Security PIN *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  disabled={!canManageUsers}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">System Role</label>
              <select
                disabled={!canManageUsers}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 disabled:bg-slate-50"
              >
                {ALL_ROLE_OPTIONS.filter((opt) => canManageRole(opt.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {currentUser.role === 'Admin/Coordinator' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Note: Only Super Admin can create Super Admin or Admin/Coordinator accounts.
                </p>
              )}
            </div>

            {(role === 'Polling Station Incharge' || role === 'Field Worker' || role === 'Viewer') && (
              <>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Filter Booths by Village
                  </label>
                  <select
                    value={selectedVillageIds[0] || 'ALL'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedVillageIds([val]);
                      if (val !== 'ALL') {
                        const vilBooths = villageParts
                          .filter((vp) => vp.villageId === val)
                          .map((vp) => vp.pollingStationId);
                        if (vilBooths.length > 0) {
                          setSelectedPsIds(vilBooths);
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">All {villages.length} Villages</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-slate-700 dark:text-slate-300">
                      Assigned Polling Stations (PS 1–41)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPsIds((prev) =>
                          prev.includes('ALL') ? ['ps-1'] : ['ALL']
                        )
                      }
                      className="text-[11px] font-semibold text-[#0071e3] hover:underline"
                    >
                      {selectedPsIds.includes('ALL') ? 'Select Specific Booths' : 'Grant All 41 Booths'}
                    </button>
                  </div>
                  {selectedPsIds.includes('ALL') ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 text-[11px] font-medium text-blue-900">
                      Scoped to ALL 41 Polling Stations (PS 1–41)
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1">
                      {pollingStations.map((ps) => {
                        const checked = selectedPsIds.includes(ps.id);
                        return (
                          <label
                            key={ps.id}
                            className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedPsIds((prev) =>
                                  checked ? prev.filter((id) => id !== ps.id) : [...prev, ps.id]
                                );
                              }}
                              className="rounded border-slate-300 text-[#0071e3]"
                            />
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                              PS-{ps.psNo}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 truncate">{ps.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={!canManageUsers || !name.trim() || !email.trim() || !password.trim() || !pin.trim()}
              className="w-full rounded-full bg-[#0071e3] py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Create Scoped User Account
            </button>
          </div>
        </form>

        {/* Users Directory Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Constituency Officials & Scoped Accounts ({users.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between roles to verify station-scoped data isolation, or edit any user&apos;s assigned booths.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Official</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Polling Station Scope</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
                        isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {u.pollingStationIds.includes('ALL')
                          ? 'ALL (PS 1–41)'
                          : u.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <XCircle className="h-3.5 w-3.5" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isCurrent ? (
                          <span className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">
                            Active Session
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={lockSession}
                            disabled={!u.active}
                            title="Sign out to log in with this official's Email, Password, and Security PIN"
                            className="rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                          >
                            Sign Out to Switch
                          </button>
                        )}
                        {canManageUsers && canEditUserAccount(u) && (
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Role & Polling Station Scope"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Scope</span>
                          </button>
                        )}
                        {canManageUsers && canEditUserAccount(u) && u.id !== 'usr-super-admin' && (
                          <button
                            type="button"
                            onClick={() => toggleUserActive(u.id)}
                            className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline pl-1"
                          >
                            {u.active ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                        {canManageUsers && !canEditUserAccount(u) && (
                          <span
                            title="Only Super Admin can edit or suspend Super Admin and Admin/Coordinator accounts"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                          >
                            <Lock className="h-3 w-3" />
                            Protected Role
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Role & Polling Station Scope Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveRoleScope}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Edit Role & Station Scope
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingUser.name} ({editingUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned RBAC Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-semibold text-slate-900 dark:text-slate-100"
              >
                {ALL_ROLE_OPTIONS.filter((opt) => canManageRole(opt.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reset 4-Digit PIN (Optional)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="New 4-digit PIN"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {editRole !== 'Super Admin' && editRole !== 'Admin/Coordinator' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Authorized Polling Stations (PS 1–41)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditPsIds((prev) => (prev.includes('ALL') ? ['ps-1'] : ['ALL']))
                    }
                    className="text-[11px] font-semibold text-[#0071e3] hover:underline"
                  >
                    {editPsIds.includes('ALL') ? 'Restrict to Specific Booths' : 'Select All 41 Booths'}
                  </button>
                </div>
                {editPsIds.includes('ALL') ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-[11px] font-medium text-blue-900">
                    Authorized across all 41 Polling Stations (PS 1–41)
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1">
                    {pollingStations.map((ps) => {
                      const checked = editPsIds.includes(ps.id);
                      return (
                        <label
                          key={ps.id}
                          className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setEditPsIds((prev) =>
                                checked ? prev.filter((id) => id !== ps.id) : [...prev, ps.id]
                              )
                            }
                            className="rounded border-slate-300 text-[#0071e3]"
                          />
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            PS-{ps.psNo}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">{ps.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-1.5 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
              >
                <Check className="h-3.5 w-3.5" />
                Save Scope & Permissions
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

