'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ShieldCheck, FileCheck2, Users, History, Download, Check, X } from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';

const COLORS = ['#16a34a', '#d97706', '#dc2626', '#0071e3', '#64748b', '#0d9488', '#e11d48'];

export default function ReportsView() {
  const {
    voters,
    villages,
    scopedPollingStations,
    users,
    tasks,
    importBatches,
    auditLogs,
    exportRequests,
    canApproveExport,
    approveOrRejectExport,
  } = useVoterStore();

  const [reportSection, setReportSection] = useState<'charts' | 'workers' | 'exports' | 'audit'>('charts');

  // 1. Status by Polling Station (All 31 stations)
  const stationChartData = useMemo(() => {
    return scopedPollingStations.map((ps) => {
      const list = voters.filter((v) => v.pollingStationId === ps.id);
      return {
        name: `PS-${ps.psNo}`,
        Verified: list.filter((v) => v.status === 'Verified').length,
        Pending: list.filter((v) => v.status === 'Pending').length,
        Issues: list.filter((v) => v.status === 'Issues').length,
        New: list.filter((v) => v.status === 'New').length,
      };
    });
  }, [scopedPollingStations, voters]);

  // 2. Status by Village (12 Villages)
  const villageChartData = useMemo(() => {
    return villages.map((vil) => {
      const list = voters.filter((v) => v.villageId === vil.id);
      return {
        name: vil.name,
        Verified: list.filter((v) => v.status === 'Verified').length,
        Pending: list.filter((v) => v.status === 'Pending').length,
        Issues: list.filter((v) => v.status === 'Issues').length,
        New: list.filter((v) => v.status === 'New').length,
      };
    });
  }, [villages, voters]);

  // 3. Issue Breakdown
  const issueChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    voters
      .filter((v) => v.status === 'Issues')
      .forEach((v) => {
        const key = v.issueType || 'Other';
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [voters]);

  // 4. Age & Gender Distribution
  const ageGenderData = useMemo(() => {
    const brackets = [
      { label: '18–25', min: 18, max: 25 },
      { label: '26–35', min: 26, max: 35 },
      { label: '36–50', min: 36, max: 50 },
      { label: '51–65', min: 51, max: 65 },
      { label: '66–80+', min: 66, max: 130 },
    ];
    return brackets.map((b) => {
      const inBracket = voters.filter((v) => v.age >= b.min && v.age <= b.max);
      return {
        ageGroup: b.label,
        Male: inBracket.filter((v) => v.gender === 'M').length,
        Female: inBracket.filter((v) => v.gender === 'F').length,
      };
    });
  }, [voters]);

  // 5. Worker Productivity
  const workerProductivity = useMemo(() => {
    return users
      .filter((u) => u.role === 'Field Worker' || u.role === 'Polling Station Incharge')
      .map((u) => {
        const assigned = voters.filter((v) => v.assignedWorkerId === u.id);
        const verified = assigned.filter((v) => v.status === 'Verified').length;
        const pending = assigned.filter((v) => v.status === 'Pending').length;
        const issues = assigned.filter((v) => v.status === 'Issues').length;
        const userTasks = tasks.filter((t) => t.assigneeId === u.id);
        const pct = assigned.length > 0 ? Math.round((verified / assigned.length) * 100) : 0;
        return {
          user: u,
          totalAssigned: assigned.length,
          verified,
          pending,
          issues,
          openTasks: userTasks.filter((t) => t.status !== 'Completed').length,
          pct,
        };
      });
  }, [users, voters, tasks]);

  return (
    <div className="space-y-5">
      {/* Sub-navigation Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Constituency Analytics, Worker Productivity & Compliance Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Recharts analytics across all {scopedPollingStations.length} polling stations, {villages.length} villages, export approval queue, and immutable audit trail.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: 'charts', label: 'Analytics & Recharts' },
            { id: 'workers', label: 'Worker Productivity' },
            { id: 'exports', label: `Export Approvals (${exportRequests.filter((e) => e.status === 'Pending Approval').length})` },
            { id: 'audit', label: `Audit Log (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportSection(tab.id as typeof reportSection)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                reportSection === tab.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: RECHARTS ANALYTICS */}
      {reportSection === 'charts' && (
        <div className="space-y-5">
          {/* Chart 1: Status by Polling Station (All 41) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verification Status Across All {scopedPollingStations.length} Polling Stations (PS 1–{scopedPollingStations.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Stacked breakdown of Verified, Pending, Flagged Issues, and Newly Imported voters per booth
                </p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stationChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Verified" stackId="a" fill="#16a34a" />
                  <Bar dataKey="Pending" stackId="a" fill="#d97706" />
                  <Bar dataKey="Issues" stackId="a" fill="#dc2626" />
                  <Bar dataKey="New" stackId="a" fill="#0071e3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Status by Village */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Verification Status by Village ({villages.length} Villages in AC-31 Thoubal)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={villageChartData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Verified" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Issues" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3 & 4: Age/Gender Distribution & Issue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Age & Gender Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGenderData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Male" fill="#0071e3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Female" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Flagged Electoral Roll Issues Breakdown</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {issueChartData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKER PRODUCTIVITY */}
      {reportSection === 'workers' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Field Worker & Station Incharge Productivity</h3>
            <p className="text-xs text-slate-500">
              Tracks verification throughput, pending workload, and open field tasks by assigned booth scope.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Scoped Stations</th>
                  <th className="py-3 px-2.5 text-right">Assigned Voters</th>
                  <th className="py-3 px-2.5 text-right">Verified</th>
                  <th className="py-3 px-2.5 text-right">Pending</th>
                  <th className="py-3 px-2.5 text-right">Issues Logged</th>
                  <th className="py-3 px-2.5 text-right">Open Tasks</th>
                  <th className="py-3 px-4 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workerProductivity.map((wp) => (
                  <tr key={wp.user.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{wp.user.name}</td>
                    <td className="py-3 px-3 text-slate-600">{wp.user.role}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {wp.user.pollingStationIds.join(', ').toUpperCase()}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums">{wp.totalAssigned}</td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                      {wp.verified}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-amber-700 tabular-nums">{wp.pending}</td>
                    <td className="py-3 px-2.5 text-right font-mono text-red-600 tabular-nums">{wp.issues}</td>
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums">{wp.openTasks}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {wp.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: EXPORT APPROVAL WORKFLOW */}
      {reportSection === 'exports' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Personal Data Export Approval Queue</h3>
            <p className="text-xs text-slate-500">
              All exports of voter records require Admin/Coordinator approval, are watermarked, and write to the audit log.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-3">Requester</th>
                  <th className="py-3 px-3">Scope Description</th>
                  <th className="py-3 px-2.5 text-right">Records</th>
                  <th className="py-3 px-3">Official Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Admin Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{req.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{req.requesterName}</td>
                    <td className="py-3 px-3 text-slate-700">{req.scopeDescription}</td>
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums">{req.recordCount}</td>
                    <td className="py-3 px-3 text-slate-600">{req.reason}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'Pending Approval' && canApproveExport ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => approveOrRejectExport(req.id, 'Approved')}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => approveOrRejectExport(req.id, 'Rejected')}
                            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {req.approvedBy ? `By ${req.approvedBy}` : 'Awaiting Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: IMMUTABLE AUDIT LOG VIEWER */}
      {reportSection === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Immutable Security & Operational Audit Trail ({auditLogs.length} Events)
              </h3>
              <p className="text-xs text-slate-500">
                Every edit, status transition, soft-delete, station move, import, rollback, export, and role switch is permanently logged.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">User & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity / ID</th>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Old Value → New Value</th>
                  <th className="py-2.5 px-4">GPS Pin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      {log.userRole && <div className="text-[10px] text-slate-400">{log.userRole}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {log.entity}: {log.entityId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{log.field}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="text-slate-400 line-through mr-1">{log.oldValue}</span>
                      <span>→</span>{' '}
                      <span className="font-semibold text-slate-900">{log.newValue}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{log.gps || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
