'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  ExternalLink,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';
import { IssueType } from '@/lib/types';

export default function VillagesStationsView() {
  const {
    villages,
    villageParts,
    pollingStations,
    scopedPollingStations,
    voters,
    users,
    setSelectedPollingStationFilter,
    setActiveTab,
    canManageUsers,
    updatePartStationMapping,
    updatePollingStationWorkers,
  } = useVoterStore();

  const [subTab, setSubTab] = useState<'dashboard' | 'comparison' | 'mapping' | 'master'>('dashboard');
  const [selectedPsId, setSelectedPsId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'psNo' | 'pending' | 'issues' | 'verifiedPct' | 'total'>('pending');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Mapping edit state
  const [editingVpId, setEditingVpId] = useState<string | null>(null);
  const [targetPsIdForVp, setTargetPsIdForVp] = useState<string>('');
  const [rebalanceReason, setRebalanceReason] = useState<string>('');

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const villageMap = useMemo(() => new Map(villages.map((v) => [v.id, v])), [villages]);

  // Compute per-station metrics for all 31 polling stations
  const stationMetrics = useMemo(() => {
    return scopedPollingStations.map((ps) => {
      const stationVoters = voters.filter((v) => v.pollingStationId === ps.id);
      const total = stationVoters.length;
      const verified = stationVoters.filter((v) => v.status === 'Verified').length;
      const pending = stationVoters.filter((v) => v.status === 'Pending').length;
      const issues = stationVoters.filter((v) => v.status === 'Issues').length;
      const newlyImported = stationVoters.filter((v) => v.status === 'New').length;
      const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

      // Data quality completeness (phone + father + address)
      const withPhone = stationVoters.filter((v) => v.phone && v.phone.length >= 10).length;
      const qualityPct = total > 0 ? Math.round((withPhone / total) * 100) : 100;

      const vp = villageParts.find((p) => p.pollingStationId === ps.id);
      const vil = vp ? villageMap.get(vp.villageId) : undefined;

      const issuesByType: Record<string, number> = {};
      stationVoters
        .filter((v) => v.status === 'Issues' && v.issueType)
        .forEach((v) => {
          const t = v.issueType!;
          issuesByType[t] = (issuesByType[t] || 0) + 1;
        });

      return {
        ps,
        vp,
        vil,
        total,
        verified,
        pending,
        issues,
        newlyImported,
        verifiedPct,
        qualityPct,
        issuesByType,
      };
    });
  }, [scopedPollingStations, voters, villageParts, villageMap]);

  // Compute per-village metrics for all 12 villages
  const villageMetrics = useMemo(() => {
    return villages.map((vil) => {
      const vilVoters = voters.filter((v) => v.villageId === vil.id);
      const parts = villageParts.filter((vp) => vp.villageId === vil.id);
      const total = vilVoters.length;
      const verified = vilVoters.filter((v) => v.status === 'Verified').length;
      const pending = vilVoters.filter((v) => v.status === 'Pending').length;
      const issues = vilVoters.filter((v) => v.status === 'Issues').length;
      const newlyImported = vilVoters.filter((v) => v.status === 'New').length;
      const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
      return { vil, parts, total, verified, pending, issues, newlyImported, verifiedPct };
    });
  }, [villages, voters, villageParts]);

  // Filtered dashboard summary for selected station / village
  const dashboardVoters = useMemo(() => {
    return voters.filter((v) => {
      if (selectedPsId !== 'ALL' && v.pollingStationId !== selectedPsId) return false;
      if (selectedVillageId !== 'ALL' && v.villageId !== selectedVillageId) return false;
      return true;
    });
  }, [voters, selectedPsId, selectedVillageId]);

  const dashboardStats = useMemo(() => {
    const total = dashboardVoters.length;
    const verified = dashboardVoters.filter((v) => v.status === 'Verified').length;
    const pending = dashboardVoters.filter((v) => v.status === 'Pending').length;
    const issues = dashboardVoters.filter((v) => v.status === 'Issues').length;
    const newlyImported = dashboardVoters.filter((v) => v.status === 'New').length;
    const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

    const issueBreakdown: { type: IssueType; count: number }[] = [
      'Duplicate',
      'Deceased',
      'Shifted/Migrated',
      'Wrong address',
      'Missing data',
      'Name mismatch',
      'Other',
    ].map((type) => ({
      type: type as IssueType,
      count: dashboardVoters.filter((v) => v.status === 'Issues' && v.issueType === type).length,
    }));

    return { total, verified, pending, issues, newlyImported, verifiedPct, issueBreakdown };
  }, [dashboardVoters]);

  const sortedComparison = useMemo(() => {
    return [...stationMetrics].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'psNo') diff = a.ps.psNo - b.ps.psNo;
      else if (sortBy === 'pending') diff = a.pending - b.pending;
      else if (sortBy === 'issues') diff = a.issues - b.issues;
      else if (sortBy === 'verifiedPct') diff = a.verifiedPct - b.verifiedPct;
      else if (sortBy === 'total') diff = a.total - b.total;
      return sortDesc ? -diff : diff;
    });
  }, [stationMetrics, sortBy, sortDesc]);

  return (
    <div className="space-y-5">
      {/* Top Hierarchy Banner & Sub-navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0071e3]">
            <span>AC-31 THOUBAL HIERARCHY</span>
            <span>·</span>
            <span>{villages.length} Villages → {villageParts.length} Village Parts (Leikai) → {pollingStations.length} Polling Stations (PS 1–41)</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 mt-1">
            Villages, Leikai Parts & Polling Station Allocation
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: 'dashboard', label: 'Station & Village Dashboard' },
            { id: 'comparison', label: 'All 41 Stations Comparison' },
            { id: 'mapping', label: 'Coverage Mapping (Leikai → PS)' },
            { id: 'master', label: 'Village & PS Master' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === t.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PER-VILLAGE & PER-STATION DASHBOARD */}
      {subTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Selector Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter by Village ({villages.length})</label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => {
                    setSelectedVillageId(e.target.value);
                    setSelectedPsId('ALL');
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All {villages.length} Villages in AC-31 Thoubal</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter by Polling Station (PS 1–41)</label>
                <select
                  value={selectedPsId}
                  onChange={(e) => setSelectedPsId(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Scoped Polling Stations ({scopedPollingStations.length})</option>
                  {scopedPollingStations
                    .filter((ps) => {
                      if (selectedVillageId === 'ALL') return true;
                      const vp = villageParts.find((p) => p.pollingStationId === ps.id);
                      return vp?.villageId === selectedVillageId;
                    })
                    .map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        PS-{ps.psNo}: {ps.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedPsId !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPollingStationFilter([selectedPsId]);
                  setActiveTab('voter-list');
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <span>Open Station Roster in Voter List</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Total Voters</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{dashboardStats.total}</div>
              <span className="text-[11px] text-slate-400">100% Station Allocated</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Verified</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{dashboardStats.verified}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{dashboardStats.verifiedPct}% Verification Rate</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Pending</span>
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{dashboardStats.pending}</div>
              <span className="text-[11px] text-slate-400">Assigned for field visit</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Flagged Issues</span>
              <div className="text-2xl font-bold text-red-700 mt-1 tabular-nums">{dashboardStats.issues}</div>
              <span className="text-[11px] text-red-600">Needs BLO resolution</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Newly Imported</span>
              <div className="text-2xl font-bold text-[#0071e3] mt-1 tabular-nums">{dashboardStats.newlyImported}</div>
              <span className="text-[11px] text-slate-400">Recent batch additions</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-medium text-slate-500">Verification Progress</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{dashboardStats.verifiedPct}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${dashboardStats.verifiedPct}%` }} />
              </div>
            </div>
          </div>

          {/* Issues Breakdown by Type + Per-Village Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Issues Breakdown by Type</h3>
              <div className="space-y-2.5">
                {dashboardStats.issueBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${dashboardStats.issues ? Math.round((item.count / dashboardStats.issues) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-slate-900 w-6 text-right tabular-nums">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">12 Constituency Villages Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2 pr-3">Village</th>
                      <th className="py-2 px-2">Leikai Parts</th>
                      <th className="py-2 px-2 text-right">Total</th>
                      <th className="py-2 px-2 text-right">Verified</th>
                      <th className="py-2 px-2 text-right">Pending</th>
                      <th className="py-2 px-2 text-right">Issues</th>
                      <th className="py-2 pl-2 text-right">Verification %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {villageMetrics.map((vm) => (
                      <tr
                        key={vm.vil.id}
                        onClick={() => setSelectedVillageId(vm.vil.id === selectedVillageId ? 'ALL' : vm.vil.id)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-2 pr-3 font-semibold text-slate-900">
                          {vm.vil.name} <span className="font-mono text-[10px] text-slate-400">({vm.vil.code})</span>
                        </td>
                        <td className="py-2 px-2 text-slate-600">{vm.parts.length} Leikais</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">{vm.total}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                          {vm.verified}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-amber-700 tabular-nums">{vm.pending}</td>
                        <td className="py-2 px-2 text-right font-mono text-red-700 tabular-nums">{vm.issues}</td>
                        <td className="py-2 pl-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {vm.verifiedPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COMPARISON TABLE OF ALL 31 POLLING STATIONS */}
      {subTab === 'comparison' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                All {pollingStations.length} Polling Stations Comparison Table (Sorted by {sortBy.toUpperCase()})
              </h3>
              <p className="text-xs text-slate-500">
                Click column headers to sort by Pending or Issues so coordinators can deploy more field workers where needed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSortBy('pending');
                  setSortDesc(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  sortBy === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Sort by Highest Pending
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('issues');
                  setSortDesc(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  sortBy === 'issues' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Sort by Highest Issues
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('psNo');
                  setSortDesc(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  sortBy === 'psNo' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Sort by PS 1–{pollingStations.length}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">PS No.</th>
                  <th className="py-3 px-3">Polling Station Name</th>
                  <th className="py-3 px-3">Village & Leikai</th>
                  <th className="py-3 px-3">Assigned Incharge / Worker</th>
                  <th className="py-3 px-2.5 text-right">Total</th>
                  <th className="py-3 px-2.5 text-right">Verified</th>
                  <th className="py-3 px-2.5 text-right">Pending</th>
                  <th className="py-3 px-2.5 text-right">Issues</th>
                  <th className="py-3 px-2.5 text-right">New</th>
                  <th className="py-3 px-3 text-right">Verification %</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedComparison.map((row) => {
                  const worker = userMap.get(row.ps.workerIds[0] || '');
                  return (
                    <tr key={row.ps.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">PS-{row.ps.psNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.ps.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.vil?.name} · {row.vp?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{worker?.name || 'Assigned Team'}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-semibold tabular-nums">{row.total}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                        {row.verified}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-amber-700 font-bold tabular-nums">
                        {row.pending}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-red-600 font-bold tabular-nums">
                        {row.issues}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-[#0071e3] tabular-nums">
                        {row.newlyImported}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                        {row.verifiedPct}%
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPollingStationFilter([row.ps.id]);
                            setActiveTab('voter-list');
                          }}
                          className="text-[#0071e3] font-semibold hover:underline"
                        >
                          View Voters →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COVERAGE MAPPING TABLE (VILLAGE PART -> POLLING STATION) */}
      {subTab === 'mapping' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Coverage Mapping Table: Village Part (Leikai) → Polling Station (PS 1–{pollingStations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Invariant enforced: Each village part is covered by exactly one polling station. Re-mapping rebalances households and writes an audit entry.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Part No.</th>
                  <th className="py-3 px-3">Village Part Code</th>
                  <th className="py-3 px-3">Village Part (Leikai / Ward)</th>
                  <th className="py-3 px-3">Parent Village</th>
                  <th className="py-3 px-3">Allocated Polling Station</th>
                  <th className="py-3 px-3">Building Location</th>
                  <th className="py-3 px-4 text-right">Boundary Rebalance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {villageParts.map((vp) => {
                  const vil = villageMap.get(vp.villageId);
                  const ps = pollingStations.find((p) => p.id === vp.pollingStationId);
                  const isEditing = editingVpId === vp.id;

                  return (
                    <tr key={vp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">Part {vp.partNo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{vp.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{vp.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{vil?.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono font-semibold text-[#0071e3]">
                          PS-{ps?.psNo}: {ps?.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{ps?.location}</td>
                      <td className="py-2.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={targetPsIdForVp}
                              onChange={(e) => setTargetPsIdForVp(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            >
                              {pollingStations.map((s) => (
                                <option key={s.id} value={s.id}>
                                  PS-{s.psNo}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Reason..."
                              value={rebalanceReason}
                              onChange={(e) => setRebalanceReason(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs w-28"
                            />
                            <button
                              type="button"
                              disabled={!rebalanceReason.trim()}
                              onClick={() => {
                                updatePartStationMapping(vp.id, targetPsIdForVp, rebalanceReason.trim());
                                setEditingVpId(null);
                                setRebalanceReason('');
                              }}
                              className="px-2.5 py-1 rounded bg-[#0071e3] text-white text-xs font-semibold disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVpId(null)}
                              className="px-2 py-1 text-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          canManageUsers && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVpId(vp.id);
                                setTargetPsIdForVp(vp.pollingStationId);
                              }}
                              className="text-xs font-medium text-[#0071e3] hover:underline"
                            >
                              Re-map Station
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VILLAGE & POLLING STATION MASTER */}
      {subTab === 'master' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Polling Station Master Directory (PS 1–41) — GPS Coordinates, Incharge & Field Workers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-3">PS #</th>
                    <th className="py-2.5 px-3">Station Name</th>
                    <th className="py-2.5 px-3">Building & Location</th>
                    <th className="py-2.5 px-3">GPS Coordinates</th>
                    <th className="py-2.5 px-3">Roll Parts</th>
                    <th className="py-2.5 px-3">Station Incharge</th>
                    <th className="py-2.5 px-3">Assigned Field Worker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pollingStations.map((ps) => {
                    const incharge = userMap.get(ps.inchargeId);
                    const worker = userMap.get(ps.workerIds[0] || '');
                    return (
                      <tr key={ps.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">PS-{ps.psNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ps.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ps.location}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {ps.lat.toFixed(4)}°N, {ps.lng.toFixed(4)}°E
                        </td>
                        <td className="py-2.5 px-3 font-mono">Part {ps.partNos.join(', ')}</td>
                        <td className="py-2.5 px-3">
                          {canManageUsers ? (
                            <select
                              value={ps.inchargeId}
                              onChange={(e) => updatePollingStationWorkers(ps.id, e.target.value, ps.workerIds)}
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                            >
                              {users
                                .filter((u) => u.role === 'Polling Station Incharge' || u.role === 'Admin/Coordinator')
                                .map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span>{incharge?.name}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {canManageUsers ? (
                            <select
                              value={ps.workerIds[0] || ''}
                              onChange={(e) => updatePollingStationWorkers(ps.id, ps.inchargeId, [e.target.value])}
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                            >
                              {users
                                .filter((u) => u.role === 'Field Worker')
                                .map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span>{worker?.name}</span>
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
      )}
    </div>
  );
}
