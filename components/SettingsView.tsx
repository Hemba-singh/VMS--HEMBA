'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Tag,
  Database,
  RotateCcw,
  Lock,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';

export default function SettingsView() {
  const {
    villageParts,
    pollingStations,
    availableTags,
    issueTypes,
    allVotersIncludingDeleted,
    revealFullPhone,
    setRevealFullPhone,
    currentUser,
    isConnectedToFirestore,
    isSyncingFirestore,
    syncSeedDataToFirestore,
    lockSession,
    addCustomTag,
    restoreVoter,
  } = useVoterStore();

  const [newTagInput, setNewTagInput] = useState('');
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);

  const softDeletedVoters = allVotersIncludingDeleted.filter((v) => v.isDeleted);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
          System settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Configure privacy defaults, database synchronization, voter tags, archived records, and part-number mapping.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Privacy & Compliance */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Privacy and session controls
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-slate-900 dark:text-zinc-100">Unmask phone numbers</div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Phone numbers remain masked unless explicitly toggled by an authorized role.
                </p>
              </div>
              <button
                type="button"
                disabled={currentUser.role === 'Viewer'}
                onClick={() => setRevealFullPhone(!revealFullPhone)}
                aria-label="Toggle phone visibility"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  revealFullPhone ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    revealFullPhone ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-slate-900 dark:text-zinc-100">Idle session timeout</div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Lock session automatically after periods of inactivity.
                </p>
              </div>
              <select
                value={sessionTimeoutMins}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next) && next > 0) setSessionTimeoutMins(next);
                }}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 font-medium text-slate-800 dark:text-zinc-200"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div className="pt-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-medium text-slate-900 dark:text-zinc-100">Data minimization active</div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Following Election Commission and DPDP Act 2023 rules, caste, religion, and political affiliation fields are excluded.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Session & Firestore Sync */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Authentication and database sync
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isConnectedToFirestore ? 'Firestore connected' : 'Local storage active'}</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Signed in as <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">{currentUser.email}</span> ({currentUser.role}) across 41 polling stations.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={isSyncingFirestore}
              onClick={syncSeedDataToFirestore}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSyncingFirestore ? 'Syncing data...' : 'Sync hierarchy to Firestore'}
            </button>
            <button
              type="button"
              onClick={lockSession}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Card 3: Voter Tags & Issue Taxonomy */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Voter tags and issue types
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-medium text-slate-700 dark:text-zinc-300 mb-2">Available tags</div>
              <div className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-3">
                {availableTags.join(' · ')}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="New tag (e.g., Postal Ballot Eligible)..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTagInput.trim()) return;
                    addCustomTag(newTagInput.trim());
                    setNewTagInput('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-2 font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add tag</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Issue classifications</div>
              <p className="text-slate-600 dark:text-zinc-400">{issueTypes.join(' · ')}</p>
            </div>
          </div>
        </div>

        {/* Card 4: Soft-Deleted Archive */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                Deleted voter archive ({softDeletedVoters.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">Super Admin restorable</span>
          </div>

          {softDeletedVoters.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-400 py-4">
              No soft-deleted records. Archived voters appear here with their deletion audit reason.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {softDeletedVoters.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">{v.name}</span>{' '}
                    <span className="font-mono text-slate-500 dark:text-zinc-400">({v.epicNo})</span>
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">Reason: {v.deleteReason}</p>
                  </div>
                  {currentUser.role === 'Super Admin' && (
                    <button
                      type="button"
                      onClick={() => restoreVoter(v.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 whitespace-nowrap"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Part Number Quick Reference Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Part number to polling station reference ({villageParts.length} parts)
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Used during CSV imports to map incoming voters to their village part and polling station.
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {villageParts.map((vp) => {
            const ps = pollingStations.find((p) => p.id === vp.pollingStationId);
            return (
              <div
                key={vp.id}
                className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-2.5"
              >
                <div className="flex items-center justify-between font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                  <span>Part {Number.isFinite(vp.partNo) ? vp.partNo : '-'}</span>
                  <span className="text-blue-600 dark:text-blue-400">PS-{Number.isFinite(ps?.psNo) ? ps?.psNo : '-'}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-zinc-400 truncate mt-1" title={vp.name}>
                  {vp.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
