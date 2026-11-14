'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Lock,
  Edit3,
  Check,
  X,
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
    stationScope: 'All 41 stations',
    editVoters: 'Full write',
    unmaskPhone: 'Allowed (logged)',
    importRollback: 'Allowed',
    exportData: 'Auto-approved',
    deleteRestore: 'Soft-delete and restore',
    manageUsers: 'All roles',
  },
  {
    role: 'Admin/Coordinator',
    stationScope: 'All 41 stations',
    editVoters: 'Full write',
    unmaskPhone: 'Allowed (logged)',
    importRollback: 'Allowed',
    exportData: 'Approve and export',
    deleteRestore: 'Soft-delete only',
    manageUsers: 'Incharge, Worker, Viewer',
  },
  {
    role: 'Polling Station Incharge',
    stationScope: 'Assigned stations',
    editVoters: 'Scoped stations',
    unmaskPhone: 'Scoped stations',
    importRollback: 'Restricted',
    exportData: 'Requires approval',
    deleteRestore: 'Restricted',
    manageUsers: 'Restricted',
  },
  {
    role: 'Field Worker',
    stationScope: 'Assigned stations',
    editVoters: 'Assigned stations',
    unmaskPhone: 'Masked only',
    importRollback: 'Restricted',
    exportData: 'Restricted',
    deleteRestore: 'Restricted',
    manageUsers: 'Restricted',
  },
  {
    role: 'Viewer',
    stationScope: 'Scoped read-only',
    editVoters: 'Read-only',
    unmaskPhone: 'Masked only',
    importRollback: 'Restricted',
    exportData: 'Restricted',
    deleteRestore: 'Restricted',
    manageUsers: 'Restricted',
  },
];

const ALL_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Super Admin', label: 'Super Admin (all stations)' },
  { value: 'Admin/Coordinator', label: 'Admin/Coordinator (all stations)' },
  { value: 'Polling Station Incharge', label: 'Polling Station Incharge (scoped stations)' },
  { value: 'Field Worker', label: 'Field Worker (scoped stations)' },
  { value: 'Viewer', label: 'Viewer (read-only)' },
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            User access control
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Signed in as {currentUser.name} · {currentUser.role} · {scopedPollingStations.length} of{' '}
            {pollingStations.length} polling stations
          </p>
        </div>

        <button
          type="button"
          onClick={lockSession}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock session</span>
        </button>
      </div>

      {/* Flat 4-Column Session Scope Strip (Single-level elevation) */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800">
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Active role</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1">{currentUser.role}</div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
            {currentUser.email}
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Station scope</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1 tabular-nums">
            {scopedPollingStations.length} of {pollingStations.length} stations
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
            {currentUser.pollingStationIds.includes('ALL')
              ? 'ALL stations'
              : currentUser.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Scoped voters</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1 tabular-nums">
            {voters.length.toLocaleString()} records
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Out-of-scope records hidden
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Phone privacy</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1">
            {currentUser.role === 'Field Worker' || currentUser.role === 'Viewer'
              ? 'Masked only'
              : 'Unmask authorized'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Unmasking writes an audit entry
          </div>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Role permissions matrix
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                <th className="py-2.5 px-4 font-medium">Role</th>
                <th className="py-2.5 px-3 font-medium">Station scope</th>
                <th className="py-2.5 px-3 font-medium">Voter edits</th>
                <th className="py-2.5 px-3 font-medium">Phone numbers</th>
                <th className="py-2.5 px-3 font-medium">Import and rollback</th>
                <th className="py-2.5 px-3 font-medium">CSV export</th>
                <th className="py-2.5 px-3 font-medium">Delete and restore</th>
                <th className="py-2.5 px-4 font-medium">User admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {RBAC_MATRIX.map((row) => {
                const isActiveRole = row.role === currentUser.role;
                return (
                  <tr
                    key={row.role}
                    className={
                      isActiveRole
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      <span>{row.role}</span>
                      {isActiveRole && (
                        <span className="ml-2 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.stationScope}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.editVoters}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.unmaskPhone}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.importRollback}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.exportData}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{row.deleteRestore}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-zinc-300">{row.manageUsers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User + Directory Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form
          onSubmit={handleCreateUser}
          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Create official account
            </h2>
          </div>

          {!canManageUsers && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
              Your current role ({currentUser.role}) cannot create or edit user accounts.
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Full name</label>
              <input
                type="text"
                disabled={!canManageUsers}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oinam Bikramjit Singh"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Official email address
              </label>
              <input
                type="email"
                disabled={!canManageUsers}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@example.com"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Phone number</label>
              <input
                type="text"
                disabled={!canManageUsers}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9862000000"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  disabled={!canManageUsers}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Security PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  disabled={!canManageUsers}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">System role</label>
              <select
                disabled={!canManageUsers}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-medium text-slate-900 dark:text-zinc-100 disabled:opacity-50 focus:border-blue-600 focus:outline-none"
              >
                {ALL_ROLE_OPTIONS.filter((opt) => canManageRole(opt.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {currentUser.role === 'Admin/Coordinator' && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Only Super Admin can create Super Admin or Admin/Coordinator accounts.
                </p>
              )}
            </div>

            {(role === 'Polling Station Incharge' || role === 'Field Worker' || role === 'Viewer') && (
              <>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Filter stations by village
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
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="ALL">All {villages.length} villages</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-slate-700 dark:text-zinc-300">
                      Assigned polling stations
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPsIds((prev) => (prev.includes('ALL') ? ['ps-1'] : ['ALL']))
                      }
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedPsIds.includes('ALL') ? 'Select specific booths' : 'Select all 41 booths'}
                    </button>
                  </div>
                  {selectedPsIds.includes('ALL') ? (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 text-[11px] font-medium text-blue-800 dark:text-blue-300">
                      Assigned across all 41 polling stations
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/50 p-2 space-y-1">
                      {pollingStations.map((ps) => {
                        const checked = selectedPsIds.includes(ps.id);
                        return (
                          <label
                            key={ps.id}
                            className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedPsIds((prev) =>
                                  checked ? prev.filter((id) => id !== ps.id) : [...prev, ps.id]
                                );
                              }}
                              className="rounded border-slate-300 dark:border-zinc-700 text-blue-600"
                            />
                            <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                              PS-{ps.psNo}
                            </span>
                            <span className="text-slate-600 dark:text-zinc-400 truncate">{ps.name}</span>
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
              className="w-full rounded-lg bg-blue-600 py-2.5 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Create account
            </button>
          </div>
        </form>

        {/* Users Directory Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              Constituency officials ({users.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Edit booth assignments, reset credentials, or toggle account status.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">Official</th>
                  <th className="py-3 px-3 font-medium">Role</th>
                  <th className="py-3 px-3 font-medium">Station scope</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">{u.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-zinc-300 font-medium">{u.role}</td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-400">
                        {u.pollingStationIds.includes('ALL')
                          ? 'ALL'
                          : u.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        {isCurrent ? (
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            Active session
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={lockSession}
                            disabled={!u.active}
                            title="Sign out to log in with this account"
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                          >
                            Switch
                          </button>
                        )}
                        {canManageUsers && canEditUserAccount(u) && (
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                            title="Edit role and station scope"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canManageUsers && canEditUserAccount(u) && u.id !== 'usr-super-admin' && (
                          <button
                            type="button"
                            onClick={() => toggleUserActive(u.id)}
                            className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 underline"
                          >
                            {u.active ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                        {canManageUsers && !canEditUserAccount(u) && (
                          <span
                            title="Only Super Admin can edit Super Admin and Admin/Coordinator accounts"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500"
                          >
                            <Lock className="h-3 w-3" />
                            <span>Protected</span>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <form
            onSubmit={handleSaveRoleScope}
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Edit role and station scope
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {editingUser.name} · {editingUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Assigned role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-medium text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
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
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Reset password
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Reset PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {editRole !== 'Super Admin' && editRole !== 'Admin/Coordinator' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700 dark:text-zinc-300">
                    Authorized polling stations
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPsIds((prev) => (prev.includes('ALL') ? ['ps-1'] : ['ALL']))}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {editPsIds.includes('ALL') ? 'Restrict booths' : 'Select all 41 booths'}
                  </button>
                </div>
                {editPsIds.includes('ALL') ? (
                  <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 text-[11px] font-medium text-blue-800 dark:text-blue-300">
                    Authorized across all 41 polling stations
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/50 p-2 space-y-1">
                    {pollingStations.map((ps) => {
                      const checked = editPsIds.includes(ps.id);
                      return (
                        <label
                          key={ps.id}
                          className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setEditPsIds((prev) =>
                                checked ? prev.filter((id) => id !== ps.id) : [...prev, ps.id]
                              )
                            }
                            className="rounded border-slate-300 dark:border-zinc-700 text-blue-600"
                          />
                          <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                            PS-{ps.psNo}
                          </span>
                          <span className="text-slate-600 dark:text-zinc-400 truncate">{ps.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save scope</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
