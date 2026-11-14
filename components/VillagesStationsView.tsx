'use client';

import React, { useState, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
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

  const [editingVpId, setEditingVpId] = useState<string | null>(null);
  const [targetPsIdForVp, setTargetPsIdForVp] = useState<string>('');
  const [rebalanceReason, setRebalanceReason] = useState<string>('');

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const villageMap = useMemo(() => new Map(villages.map((v) => [v.id, v])), [villages]);

  const stationMetrics = useMemo(() => {
    return scopedPollingStations.map((ps) => {
      const stationVoters = voters.filter((v) => v.pollingStationId === ps.id);
      const total = stationVoters.length;
      const verified = stationVoters.filter((v) => v.status === 'Verified').length;
      const pending = stationVoters.filter((v) => v.status === 'Pending').length;
      const issues = stationVoters.filter((v) => v.status === 'Issues').length;
      const newlyImported = stationVoters.filter((v) => v.status === 'New').length;
      const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

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
    <div className="space-y-6">
      {/* Page Header & Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Villages and polling stations
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
            {villages.length} villages · {villageParts.length} leikai parts · {scopedPollingStations.length} scoped polling stations
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-1">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'comparison', label: `All ${scopedPollingStations.length} stations` },
            { id: 'mapping', label: 'Coverage mapping' },
            { id: 'master', label: 'Master directory' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                subTab === t.id
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PER-VILLAGE & PER-STATION DASHBOARD */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Village ({villages.length})
                </label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => {
                    setSelectedVillageId(e.target.value);
                    setSelectedPsId('ALL');
                  }}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
                >
                  <option value="ALL">All {villages.length} villages in AC-31 Thoubal</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Polling station ({scopedPollingStations.length})
                </label>
                <select
                  value={selectedPsId}
                  onChange={(e) => setSelectedPsId(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
                >
                  <option value="ALL">All scoped polling stations ({scopedPollingStations.length})</option>
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                <span>Open station roster</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 6-Column KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total voters</span>
              <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100 mt-1 tabular-nums">
                {dashboardStats.total.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">Station allocated</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Verified</span>
              <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                {dashboardStats.verified.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                {dashboardStats.verifiedPct}% verified rate
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Pending</span>
              <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
                {dashboardStats.pending.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">Awaiting field visit</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Flagged issues</span>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                {dashboardStats.issues.toLocaleString()}
              </div>
              <span className="text-[11px] text-red-600 dark:text-red-400">Needs BLO review</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Newly imported</span>
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                {dashboardStats.newlyImported.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">Recent additions</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Completion</span>
              <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100 mt-1 tabular-nums">
                {dashboardStats.verifiedPct}%
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${dashboardStats.verifiedPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Issues Breakdown + Village Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Issues breakdown by type
              </h2>
              <div className="space-y-2.5">
                {dashboardStats.issueBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-zinc-300 font-medium">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${dashboardStats.issues ? Math.round((item.count / dashboardStats.issues) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 w-6 text-right tabular-nums">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Constituency villages summary ({villages.length} villages)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                      <th className="py-2.5 pl-5 pr-3 font-medium">Village</th>
                      <th className="py-2.5 px-2 font-medium">Leikai parts</th>
                      <th className="py-2.5 px-2 text-right font-medium">Total</th>
                      <th className="py-2.5 px-2 text-right font-medium">Verified</th>
                      <th className="py-2.5 px-2 text-right font-medium">Pending</th>
                      <th className="py-2.5 px-2 text-right font-medium">Issues</th>
                      <th className="py-2.5 pl-2 pr-5 text-right font-medium">Verified %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {villageMetrics.map((vm) => (
                      <tr
                        key={vm.vil.id}
                        onClick={() => setSelectedVillageId(vm.vil.id === selectedVillageId ? 'ALL' : vm.vil.id)}
                        className={`hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                          vm.vil.id === selectedVillageId ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 pl-5 pr-3 font-medium text-slate-900 dark:text-zinc-100">
                          {vm.vil.name}{' '}
                          <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                            ({vm.vil.code})
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-zinc-400 tabular-nums">
                          {vm.parts.length} leikais
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800 dark:text-zinc-200 tabular-nums">
                          {vm.total}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                          {vm.verified}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                          {vm.pending}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">
                          {vm.issues}
                        </td>
                        <td className="py-2.5 pl-2 pr-5 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
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

      {/* SUB-TAB 2: COMPARISON TABLE OF SCOPED POLLING STATIONS */}
      {subTab === 'comparison' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Polling stations comparison ({scopedPollingStations.length} stations)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Compare pending workload and flagged issues across stations to plan field visits.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSortBy('pending');
                  setSortDesc(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  sortBy === 'pending'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                Highest pending
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('issues');
                  setSortDesc(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  sortBy === 'issues'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                Highest issues
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('psNo');
                  setSortDesc(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  sortBy === 'psNo'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                PS number
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">PS no.</th>
                  <th className="py-3 px-3 font-medium">Polling station name</th>
                  <th className="py-3 px-3 font-medium">Village and leikai</th>
                  <th className="py-3 px-3 font-medium">Assigned worker</th>
                  <th className="py-3 px-2.5 text-right font-medium">Total</th>
                  <th className="py-3 px-2.5 text-right font-medium">Verified</th>
                  <th className="py-3 px-2.5 text-right font-medium">Pending</th>
                  <th className="py-3 px-2.5 text-right font-medium">Issues</th>
                  <th className="py-3 px-2.5 text-right font-medium">New</th>
                  <th className="py-3 px-3 text-right font-medium">Verified %</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {sortedComparison.map((row) => {
                  const worker = userMap.get(row.ps.workerIds[0] || '');
                  return (
                    <tr key={row.ps.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                        PS-{row.ps.psNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">
                        {row.ps.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                        {row.vil?.name} · {row.vp?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                        {worker?.name || 'Assigned team'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800 dark:text-zinc-200 tabular-nums">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                        {row.verified}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-amber-700 dark:text-amber-400 font-semibold tabular-nums">
                        {row.pending}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-red-600 dark:text-red-400 font-semibold tabular-nums">
                        {row.issues}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                        {row.newlyImported}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                        {row.verifiedPct}%
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPollingStationFilter([row.ps.id]);
                            setActiveTab('voter-list');
                          }}
                          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          View voters
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

      {/* SUB-TAB 3: COVERAGE MAPPING TABLE */}
      {subTab === 'mapping' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Village part to polling station mapping
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Each village part maps to one polling station. Remapping rebalances households and writes an audit entry.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">Part no.</th>
                  <th className="py-3 px-3 font-medium">Part code</th>
                  <th className="py-3 px-3 font-medium">Village part (leikai)</th>
                  <th className="py-3 px-3 font-medium">Parent village</th>
                  <th className="py-3 px-3 font-medium">Polling station</th>
                  <th className="py-3 px-3 font-medium">Location</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {villageParts.map((vp) => {
                  const vil = villageMap.get(vp.villageId);
                  const ps = pollingStations.find((p) => p.id === vp.pollingStationId);
                  const isEditing = editingVpId === vp.id;

                  return (
                    <tr key={vp.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                        Part {Number.isFinite(vp.partNo) ? vp.partNo : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-zinc-400">{vp.code}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">{vp.name}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{vil?.name}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                        PS-{Number.isFinite(ps?.psNo) ? ps?.psNo : '-'}: {ps?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                        {ps?.location}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={targetPsIdForVp}
                              onChange={(e) => setTargetPsIdForVp(e.target.value)}
                              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-slate-900 dark:text-zinc-100"
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
                              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs w-28 text-slate-900 dark:text-zinc-100"
                            />
                            <button
                              type="button"
                              disabled={!rebalanceReason.trim()}
                              onClick={() => {
                                updatePartStationMapping(vp.id, targetPsIdForVp, rebalanceReason.trim());
                                setEditingVpId(null);
                                setRebalanceReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVpId(null)}
                              className="px-2 py-1 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
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
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Remap station
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

      {/* SUB-TAB 4: POLLING STATION MASTER DIRECTORY */}
      {subTab === 'master' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Polling station master directory ({pollingStations.length} stations)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Building locations, coordinates, roll parts, and assigned station personnel.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-2.5 px-4 font-medium">PS #</th>
                  <th className="py-2.5 px-3 font-medium">Station name</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Coordinates</th>
                  <th className="py-2.5 px-3 font-medium">Roll parts</th>
                  <th className="py-2.5 px-3 font-medium">Station incharge</th>
                  <th className="py-2.5 px-4 font-medium">Field worker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {pollingStations.map((ps) => {
                  const incharge = userMap.get(ps.inchargeId);
                  const worker = userMap.get(ps.workerIds[0] || '');
                  return (
                    <tr key={ps.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums whitespace-nowrap">
                        PS-{ps.psNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">{ps.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{ps.location}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                        {(Number.isFinite(ps.lat) ? ps.lat : 24.6382).toFixed(4)}°N, {(Number.isFinite(ps.lng) ? ps.lng : 94.0012).toFixed(4)}°E
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                        Part {ps.partNos.join(', ')}
                      </td>
                      <td className="py-2.5 px-3">
                        {canManageUsers ? (
                          <select
                            value={ps.inchargeId}
                            onChange={(e) => updatePollingStationWorkers(ps.id, e.target.value, ps.workerIds)}
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-slate-800 dark:text-zinc-200"
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
                          <span className="text-slate-700 dark:text-zinc-300">{incharge?.name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {canManageUsers ? (
                          <select
                            value={ps.workerIds[0] || ''}
                            onChange={(e) => updatePollingStationWorkers(ps.id, ps.inchargeId, [e.target.value])}
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-slate-800 dark:text-zinc-200"
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
                          <span className="text-slate-700 dark:text-zinc-300">{worker?.name}</span>
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
    </div>
  );
}
