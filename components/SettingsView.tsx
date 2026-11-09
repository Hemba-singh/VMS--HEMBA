'use client';

import React, { useState } from 'react';
import {
  Settings,
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
    firebaseUser,
    isConnectedToFirestore,
    isSyncingFirestore,
    syncSeedDataToFirestore,
    loginWithGoogle,
    logoutFirebase,
    addCustomTag,
    restoreVoter,
  } = useVoterStore();

  const [newTagInput, setNewTagInput] = useState('');
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);

  const softDeletedVoters = allVotersIncludingDeleted.filter((v) => v.isDeleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            System Settings, Part-Number Mapping & Privacy Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure roll part mappings, tags, status/issue taxonomy, DPDP 2023 privacy rules, and Firestore cloud synchronization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Security, Privacy & DPDP 2023 Compliance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#0071e3]" />
            <h3 className="text-sm font-bold text-slate-900">Security, Privacy & Electoral Compliance</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div>
                <div className="font-semibold text-slate-900">Unmask Voter Phone Numbers</div>
                <p className="text-[11px] text-slate-500">
                  Default masks phone numbers as 98XXXXXX21 unless permitted by Admin/Coordinator role.
                </p>
              </div>
              <button
                type="button"
                disabled={currentUser.role === 'Viewer'}
                onClick={() => setRevealFullPhone(!revealFullPhone)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  revealFullPhone ? 'bg-[#0071e3]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    revealFullPhone ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div>
                <div className="font-semibold text-slate-900">Idle Session Auto-Timeout</div>
                <p className="text-[11px] text-slate-500">Automatically locks field and coordinator sessions after inactivity.</p>
              </div>
              <select
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Strict Data Minimization Policy Active
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Per Election Commission guidelines and DPDP Act 2023, this system strictly prohibits collecting or storing caste, religion, or political leaning fields.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Firebase Auth & Firestore Cloud Database */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0071e3]" />
              <h3 className="text-sm font-bold text-slate-900">Firebase Auth & Firestore Database Sync</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {isConnectedToFirestore ? 'Firestore Connected' : 'Local Seed Fallback Active'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The system includes a deterministic 300-voter, 82-family, 41-polling-station seed dataset that runs immediately, plus live Firebase Authentication and Firestore sync.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {!firebaseUser ? (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Sign In with Google (Firebase Auth)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSyncingFirestore}
                  onClick={syncSeedDataToFirestore}
                  className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSyncingFirestore ? 'Syncing Master Data...' : 'Sync Master Hierarchy to Firestore'}
                </button>
                <button
                  type="button"
                  onClick={logoutFirebase}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign Out ({firebaseUser.email})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Tags, Status Workflow & Issue Types */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#0071e3]" />
            <h3 className="text-sm font-bold text-slate-900">Voter Tags, Status Workflow & Issue Taxonomy</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Available Household & Voter Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {availableTags.map((t) => (
                  <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add new tag (e.g., Postal Ballot Eligible)..."
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTagInput.trim()) return;
                    addCustomTag(newTagInput.trim());
                    setNewTagInput('');
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0071e3] px-4 py-1.5 font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Tag
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Mandatory Issue Classifications</label>
              <p className="text-slate-600">{issueTypes.join(' · ')}</p>
            </div>
          </div>
        </div>

        {/* Card 4: Soft-Deleted Records Archive (Super Admin Restore) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#0071e3]" />
              <h3 className="text-sm font-bold text-slate-900">
                Soft-Deleted Voter Archive ({softDeletedVoters.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Super Admin Restorable</span>
          </div>

          {softDeletedVoters.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No voter records have been soft-deleted. Deleting a voter from the Voter Details Drawer moves it here with an audit reason.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {softDeletedVoters.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{v.name}</span>{' '}
                    <span className="font-mono text-slate-500">({v.epicNo})</span>
                    <p className="text-[11px] text-red-600">Reason: {v.deleteReason}</p>
                  </div>
                  {currentUser.role === 'Super Admin' && (
                    <button
                      type="button"
                      onClick={() => restoreVoter(v.id)}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                    >
                      Restore Record
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Part-Number to Polling Station Quick Reference Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Electoral Roll Part Number (1–41) → Polling Station Mapping Table
          </h3>
          <p className="text-xs text-slate-500">
            Used by the Import Pipeline to automatically allocate imported voters to their Village Part and Polling Station.
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {villageParts.map((vp) => {
            const ps = pollingStations.find((p) => p.id === vp.pollingStationId);
            return (
              <div key={vp.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                  <span>Part {vp.partNo}</span>
                  <span className="text-[#0071e3]">→ PS-{ps?.psNo}</span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-1" title={vp.name}>
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
