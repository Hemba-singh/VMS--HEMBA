'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MapPin,
  ArrowRightLeft,
  GitBranch,
  GitMerge,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  UserCheck,
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

  // Modals for Move, Split, Merge, Print Sheet
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

  return (
    <div className="space-y-5">
      {/* Header & Search Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Household & Family Verification View ({filteredFamilies.length} Families)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Voters grouped by Family ID with Head of Family, member relations, status roll-up, and audited Move / Split / Merge tools.
            </p>
          </div>
          {selectedFamilyFilter && (
            <button
              type="button"
              onClick={() => setSelectedFamilyFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-[#0071e3]"
            >
              <span>Showing Selected Family Only</span>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Family Code (THB-FAM-0001), Head of Family, Member Name, EPIC, or Leikai..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0071e3] focus:outline-none"
            />
          </div>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All 12 Villages</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={psFilter}
            onChange={(e) => setPsFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Polling Stations</option>
            {scopedPollingStations.map((ps) => (
              <option key={ps.id} value={ps.id}>
                PS-{ps.psNo}: {ps.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Family Household Cards */}
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
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md"
            >
              <div>
                {/* Family Header */}
                <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0071e3] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {fam.familyCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900">Head: {fam.headName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>
                        {fam.address} · <strong className="text-slate-700">PS-{ps?.psNo}</strong> ({vp?.name}, {village?.name})
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                        allVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : issueCount > 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {allVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {verifiedCount}/{members.length} Verified
                    </span>
                  </div>
                </div>

                {/* Members Table inside Family Card */}
                <div className="divide-y divide-slate-100 px-5 py-2">
                  {members.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoterId(m.id);
                              setActiveTab('voter-list');
                            }}
                            className="font-semibold text-slate-900 hover:text-[#0071e3] hover:underline truncate"
                          >
                            {m.name}
                          </button>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {m.relationToHead || 'Member'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {m.epicNo} · Age {m.age} ({m.gender}) · Father: {m.fatherName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            m.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'Issues'
                              ? 'bg-red-50 text-red-700'
                              : m.status === 'New'
                              ? 'bg-blue-50 text-[#0071e3]'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
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
                            title="Move Member to Another Family"
                            className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Card Footer Actions */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFamilyFilter(fam.id);
                    setActiveTab('voter-list');
                  }}
                  className="inline-flex items-center gap-1 font-medium text-[#0071e3] hover:underline"
                >
                  <span>Open in Voter List</span>
                  <ExternalLink className="h-3 w-3" />
                </button>

                <div className="flex items-center gap-2">
                  {canEditVoter && members.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSplitModalFamily(fam);
                        setSelectedSplitVoterIds([members[members.length - 1].id]);
                        setNewHeadVoterId(members[members.length - 1].id);
                        setAuditReason('');
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <GitBranch className="h-3 w-3" />
                      Split Family
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
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <GitMerge className="h-3 w-3" />
                      Merge
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPrintSheetFamily(fam)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3 w-3" />
                    Field Sheet
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Move Member Between Families */}
      {moveModalVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Move Member to Another Family</h3>
              <button type="button" onClick={() => setMoveModalVoter(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Moving <strong>{moveModalVoter.name}</strong> ({moveModalVoter.epicNo}) will update both households&apos; verification roll-ups and write an audit log entry.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Household / Family</label>
                <select
                  value={targetFamilyId}
                  onChange={(e) => setTargetFamilyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="">Select target family...</option>
                  {scopedFamilies
                    .filter((f) => f.id !== moveModalVoter.familyId)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.familyCode} — Head: {f.headName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Reason (Required)</label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Marriage / household correction"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveModalVoter(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Move Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Split Family */}
      {splitModalFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Split Household {splitModalFamily.familyCode}</h3>
              <button type="button" onClick={() => setSplitModalFamily(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select members to split into a new independent Family ID in the same village part & polling station.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 text-xs">
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
                        className="rounded border-slate-300"
                      />
                      <span className="font-medium text-slate-900">{m.name}</span>
                    </span>
                    <span className="font-mono text-slate-500">{m.epicNo}</span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Head of Family</label>
                <select
                  value={newHeadVoterId}
                  onChange={(e) => setNewHeadVoterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
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
                <label className="block font-medium text-slate-700 mb-1">Audit Reason (Required)</label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Separate ration card / new house number"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSplitModalFamily(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Confirm Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Merge Families */}
      {mergeModalFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Merge {mergeModalFamily.familyCode} Into Another Household</h3>
              <button type="button" onClick={() => setMergeModalFamily(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Destination Family</label>
                <select
                  value={targetFamilyId}
                  onChange={(e) => setTargetFamilyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="">Select destination household...</option>
                  {scopedFamilies
                    .filter((f) => f.id !== mergeModalFamily.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.familyCode} — Head: {f.headName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Reason (Required)</label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g., Duplicate household entry for same residence"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMergeModalFamily(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Printable Family Verification Sheet */}
      {printSheetFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AC-31 THOUBAL — Field Household Verification Sheet ({printSheetFamily.familyCode})
                </h3>
                <p className="text-xs text-slate-500">
                  Address: {printSheetFamily.address} · Head: {printSheetFamily.headName}
                </p>
              </div>
              <button type="button" onClick={() => setPrintSheetFamily(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <table className="w-full text-left border border-slate-200 text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2">Sl.</th>
                  <th className="p-2">EPIC No.</th>
                  <th className="p-2">Voter Name</th>
                  <th className="p-2">Relation</th>
                  <th className="p-2">Age/Sex</th>
                  <th className="p-2">Current Status</th>
                  <th className="p-2">Field Signature / Tick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(membersByFamily.get(printSheetFamily.id) || []).map((m) => (
                  <tr key={m.id}>
                    <td className="p-2 font-mono">{m.serialNo}</td>
                    <td className="p-2 font-mono font-semibold">{m.epicNo}</td>
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2">{m.relationToHead}</td>
                    <td className="p-2 font-mono">{m.age}/{m.gender}</td>
                    <td className="p-2">{m.status}</td>
                    <td className="p-2 text-slate-300">[ &nbsp; ] Present &nbsp; [ &nbsp; ] Issue</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintSheetFamily(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
