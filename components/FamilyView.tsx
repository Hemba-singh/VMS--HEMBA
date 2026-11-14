'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  ArrowRightLeft,
  GitBranch,
  GitMerge,
  Printer,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';
import { Family, Voter } from '@/lib/types';

export default function FamilyView() {
  const {
    scopedFamilies,
    voters,
    villages,
    villageParts,
    scopedPollingStations,
    selectedFamilyFilter,
    setSelectedFamilyFilter,
    setSelectedVoterId,
    setActiveTab,
    canEditVoter,
    moveVoterToFamily,
    splitFamily,
    mergeFamilies,
  } = useVoterStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [psFilter, setPsFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');

  const [moveModalVoter, setMoveModalVoter] = useState<Voter | null>(null);
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [auditReason, setAuditReason] = useState('');

  const [splitModalFamily, setSplitModalFamily] = useState<Family | null>(null);
  const [selectedSplitVoterIds, setSelectedSplitVoterIds] = useState<string[]>([]);
  const [newHeadVoterId, setNewHeadVoterId] = useState('');

  const [mergeModalFamily, setMergeModalFamily] = useState<Family | null>(null);
  const [printSheetFamily, setPrintSheetFamily] = useState<Family | null>(null);

  const villageMap = useMemo(() => new Map(villages.map((v) => [v.id, v])), [villages]);
  const vpMap = useMemo(() => new Map(villageParts.map((vp) => [vp.id, vp])), [villageParts]);
  const psMap = useMemo(() => new Map(scopedPollingStations.map((ps) => [ps.id, ps])), [scopedPollingStations]);

  const membersByFamily = useMemo(() => {
    const map = new Map<string, Voter[]>();
    for (const v of voters) {
      const arr = map.get(v.familyId) || [];
      arr.push(v);
      map.set(v.familyId, arr);
    }
    return map;
  }, [voters]);

  const filteredFamilies = useMemo(() => {
    return scopedFamilies.filter((fam) => {
      if (selectedFamilyFilter && fam.id !== selectedFamilyFilter) return false;
      if (psFilter !== 'ALL' && fam.pollingStationId !== psFilter) return false;
      if (villageFilter !== 'ALL' && fam.villageId !== villageFilter) return false;

      const members = membersByFamily.get(fam.id) || [];
      if (members.length === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFam =
          fam.familyCode.toLowerCase().includes(q) ||
          fam.headName.toLowerCase().includes(q) ||
          fam.address.toLowerCase().includes(q) ||
          members.some((m) => m.name.toLowerCase().includes(q) || m.epicNo.toLowerCase().includes(q));
        if (!matchFam) return false;
      }
      return true;
    });
  }, [scopedFamilies, selectedFamilyFilter, psFilter, villageFilter, membersByFamily, searchQuery]);

  const getStatusTextClass = (status: Voter['status']) => {
    if (status === 'Verified') return 'text-emerald-700 dark:text-emerald-400';
    if (status === 'Issues') return 'text-red-600 dark:text-red-400';
    if (status === 'New') return 'text-blue-600 dark:text-blue-400';
    return 'text-amber-700 dark:text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Household verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-zinc-300">
              {filteredFamilies.length}
            </span>{' '}
            households grouped by Family ID with member relations and verification progress.
          </p>
        </div>

        {selectedFamilyFilter && (
          <button
            type="button"
            onClick={() => setSelectedFamilyFilter(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0"
          >
            <span>Showing selected household</span>
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by family code, head of family, member name, EPIC, or leikai..."
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
        >
          <option value="ALL">All {villages.length} villages</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <select
          value={psFilter}
          onChange={(e) => setPsFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
        >
          <option value="ALL">All polling stations ({scopedPollingStations.length})</option>
          {scopedPollingStations.map((ps) => (
            <option key={ps.id} value={ps.id}>
              PS-{ps.psNo}: {ps.name}
            </option>
          ))}
        </select>
      </div>

      {/* Empty State */}
      {filteredFamilies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
            No matching households found
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Adjust your search query, village filter, or polling station filter to view records.
          </p>
        </div>
      ) : (
        /* Grid of Household Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredFamilies.map((fam) => {
            const members = membersByFamily.get(fam.id) || [];
            const village = villageMap.get(fam.villageId);
            const vp = vpMap.get(fam.villagePartId);
            const ps = psMap.get(fam.pollingStationId);

            const verifiedCount = members.filter((m) => m.status === 'Verified').length;
            const issueCount = members.filter((m) => m.status === 'Issues').length;
            const allVerified = verifiedCount === members.length && members.length > 0;

            return (
              <div
                key={fam.id}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Household Header */}
                  <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 px-5 py-3.5 flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {fam.familyCode}
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700" aria-hidden="true">·</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                          {fam.headName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate">
                          {fam.address} · <span className="font-medium text-slate-700 dark:text-zinc-300">PS-{ps?.psNo}</span> ({vp?.name}, {village?.name})
                        </span>
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums shrink-0 ${
                        allVerified
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : issueCount > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {allVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      <span>
                        {verifiedCount}/{members.length} verified
                      </span>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 px-5 py-1">
                    {members.map((m) => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVoterId(m.id);
                                setActiveTab('voter-list');
                              }}
                              className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
                            >
                              {m.name}
                            </button>
                            <span className="text-slate-300 dark:text-zinc-700" aria-hidden="true">·</span>
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {m.relationToHead || 'Member'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono tabular-nums mt-0.5 truncate">
                            {m.epicNo} · Age {Number.isFinite(m.age) ? m.age : '-'} ({m.gender}) · Father: {m.fatherName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-medium ${getStatusTextClass(m.status)}`}>
                            {m.status}
                          </span>
                          {canEditVoter && (
                            <button
                              type="button"
                              onClick={() => {
                                setMoveModalVoter(m);
                                setTargetFamilyId('');
                                setAuditReason('');
                              }}
                              title="Move member to another household"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFamilyFilter(fam.id);
                      setActiveTab('voter-list');
                    }}
                    className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Open in voter list</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEditVoter && members.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSplitModalFamily(fam);
                          setSelectedSplitVoterIds([members[members.length - 1].id]);
                          setNewHeadVoterId(members[members.length - 1].id);
                          setAuditReason('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                      >
                        <GitBranch className="h-3 w-3" />
                        <span>Split family</span>
                      </button>
                    )}

                    {canEditVoter && (
                      <button
                        type="button"
                        onClick={() => {
                          setMergeModalFamily(fam);
                          setTargetFamilyId('');
                          setAuditReason('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                      >
                        <GitMerge className="h-3 w-3" />
                        <span>Merge</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPrintSheetFamily(fam)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Field sheet</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Move Member Between Families */}
      {moveModalVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Move member to another household
              </h3>
              <button
                type="button"
                onClick={() => setMoveModalVoter(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Moving <strong className="text-slate-900 dark:text-zinc-100">{moveModalVoter.name}</strong> ({moveModalVoter.epicNo}) updates both household roll-ups and records an audit log entry.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Target household
                </label>
                <select
                  value={targetFamilyId}
                  onChange={(e) => setTargetFamilyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select target household...</option>
                  {scopedFamilies
                    .filter((f) => f.id !== moveModalVoter.familyId)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.familyCode} · Head: {f.headName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Audit reason
                </label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Marriage or household correction"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMoveModalVoter(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetFamilyId || !auditReason.trim()}
                onClick={() => {
                  moveVoterToFamily(moveModalVoter.id, targetFamilyId, auditReason.trim());
                  setMoveModalVoter(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Move member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Split Family */}
      {splitModalFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Split household {splitModalFamily.familyCode}
              </h3>
              <button
                type="button"
                onClick={() => setSplitModalFamily(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Select members to move into a new Family ID in the same village part and polling station.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs bg-slate-50/50 dark:bg-zinc-950/50">
              {(membersByFamily.get(splitModalFamily.id) || []).map((m) => {
                const checked = selectedSplitVoterIds.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selectedSplitVoterIds.filter((id) => id !== m.id)
                            : [...selectedSplitVoterIds, m.id];
                          setSelectedSplitVoterIds(next);
                          if (next.length > 0 && !next.includes(newHeadVoterId)) {
                            setNewHeadVoterId(next[0]);
                          }
                        }}
                        className="rounded border-slate-300 dark:border-zinc-700 text-blue-600"
                      />
                      <span className="font-medium text-slate-900 dark:text-zinc-100">{m.name}</span>
                    </span>
                    <span className="font-mono text-slate-500 dark:text-zinc-400">{m.epicNo}</span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  New head of household
                </label>
                <select
                  value={newHeadVoterId}
                  onChange={(e) => setNewHeadVoterId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                >
                  {selectedSplitVoterIds.map((id) => {
                    const v = voters.find((x) => x.id === id);
                    return (
                      <option key={id} value={id}>
                        {v?.name} ({v?.epicNo})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Audit reason
                </label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Separate ration card or new house number"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSplitModalFamily(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedSplitVoterIds.length === 0 || !auditReason.trim()}
                onClick={() => {
                  splitFamily(splitModalFamily.id, selectedSplitVoterIds, newHeadVoterId, auditReason.trim());
                  setSplitModalFamily(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Confirm split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Merge Families */}
      {mergeModalFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Merge {mergeModalFamily.familyCode} into another household
              </h3>
              <button
                type="button"
                onClick={() => setMergeModalFamily(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Destination household
                </label>
                <select
                  value={targetFamilyId}
                  onChange={(e) => setTargetFamilyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select destination household...</option>
                  {scopedFamilies
                    .filter((f) => f.id !== mergeModalFamily.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.familyCode} · Head: {f.headName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Audit reason
                </label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Duplicate household entry for same residence"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMergeModalFamily(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetFamilyId || !auditReason.trim()}
                onClick={() => {
                  mergeFamilies(mergeModalFamily.id, targetFamilyId, auditReason.trim());
                  setMergeModalFamily(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Confirm merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Printable Family Verification Sheet */}
      {printSheetFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  AC-31 Thoubal field household verification sheet ({printSheetFamily.familyCode})
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Address: {printSheetFamily.address} · Head: {printSheetFamily.headName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrintSheetFamily(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                  <tr>
                    <th className="p-2.5 font-medium">Sl.</th>
                    <th className="p-2.5 font-medium">EPIC No.</th>
                    <th className="p-2.5 font-medium">Voter name</th>
                    <th className="p-2.5 font-medium">Relation</th>
                    <th className="p-2.5 font-medium">Age / Sex</th>
                    <th className="p-2.5 font-medium">Status</th>
                    <th className="p-2.5 font-medium">Field verification tick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                  {(membersByFamily.get(printSheetFamily.id) || []).map((m) => (
                    <tr key={m.id}>
                      <td className="p-2.5 font-mono tabular-nums">{Number.isFinite(m.serialNo) ? m.serialNo : '-'}</td>
                      <td className="p-2.5 font-mono font-semibold">{m.epicNo}</td>
                      <td className="p-2.5 font-medium">{m.name}</td>
                      <td className="p-2.5">{m.relationToHead}</td>
                      <td className="p-2.5 font-mono tabular-nums">
                        {Number.isFinite(m.age) ? m.age : '-'}/{m.gender}
                      </td>
                      <td className="p-2.5">{m.status}</td>
                      <td className="p-2.5 text-slate-400 dark:text-zinc-500 font-mono">
                        [ &nbsp; ] Present &nbsp; [ &nbsp; ] Issue
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintSheetFamily(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
