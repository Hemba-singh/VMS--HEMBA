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
import { Check, X } from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';

const COLORS = ['#16a34a', '#d97706', '#dc2626', '#2563eb', '#64748b', '#0d9488', '#e11d48'];

export default function ReportsView() {
  const {
    voters,
    villages,
    scopedPollingStations,
    users,
    tasks,
    auditLogs,
    exportRequests,
    canApproveExport,
    approveOrRejectExport,
  } = useVoterStore();

  const [reportSection, setReportSection] = useState<'charts' | 'workers' | 'exports' | 'audit'>('charts');

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

  const ageGenderData = useMemo(() => {
    const brackets = [
      { label: '18 to 25', min: 18, max: 25 },
      { label: '26 to 35', min: 26, max: 35 },
      { label: '36 to 50', min: 36, max: 50 },
      { label: '51 to 65', min: 51, max: 65 },
      { label: '66+', min: 66, max: 130 },
    ];
    return brackets.map((b) => {
      const inBracket = voters.filter((v) => Number.isFinite(v.age) && v.age >= b.min && v.age <= b.max);
      return {
        ageGroup: b.label,
        Male: inBracket.filter((v) => v.gender === 'M').length,
        Female: inBracket.filter((v) => v.gender === 'F').length,
      };
    });
  }, [voters]);

  const workerProductivity = useMemo(() => {
    return users
      .filter((u) => u.role === 'Field Worker' || u.role === 'Polling Station Incharge')
      .map((u) => {
        const assigned = voters.filter((v) => v.assignedWorkerId === u.id);
        const verified = assigned.filter((v) => v.status === 'Verified').length;
        const pending = assigned.filter((v) => v.status === 'Pending').length;
        const issues = assigned.filter((v) => v.status === 'Issues').length;
        const userTasks = tasks.filter((t) => t.assigneeId === u.id);
        const rawPct = assigned.length > 0 ? Math.round((verified / assigned.length) * 100) : 0;
        const pct = Number.isFinite(rawPct) ? rawPct : 0;
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

  const getExportStatusColor = (status: string) => {
    if (status === 'Approved') return 'text-emerald-700 dark:text-emerald-400';
    if (status === 'Rejected') return 'text-red-600 dark:text-red-400';
    return 'text-amber-700 dark:text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Header & Segmented Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Reports and audit trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
            Analytics across {scopedPollingStations.length} polling stations · {villages.length} villages · {auditLogs.length} audit events
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-1">
          {[
            { id: 'charts', label: 'Analytics' },
            { id: 'workers', label: 'Worker throughput' },
            {
              id: 'exports',
              label: `Export approvals (${exportRequests.filter((e) => e.status === 'Pending Approval').length})`,
            },
            { id: 'audit', label: `Audit log (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportSection(tab.id as typeof reportSection)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                reportSection === tab.id
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: CHARTS */}
      {reportSection === 'charts' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Verification status by polling station ({scopedPollingStations.length} stations)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Breakdown of verified, pending, issue, and newly imported voters per station.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={stationChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Verified" stackId="a" fill="#16a34a" />
                  <Bar dataKey="Pending" stackId="a" fill="#d97706" />
                  <Bar dataKey="Issues" stackId="a" fill="#dc2626" />
                  <Bar dataKey="New" stackId="a" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Verification status by village ({villages.length} villages)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={villageChartData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Verified" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Issues" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Age and gender distribution
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={ageGenderData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Male" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Female" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Flagged issues breakdown
              </h2>
              <div className="h-64 w-full">
                {issueChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
                    No flagged issues in current scope.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKER PRODUCTIVITY */}
      {reportSection === 'workers' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Field worker and incharge throughput
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Verification completion, pending workload, and open field tasks by official.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">Team member</th>
                  <th className="py-3 px-3 font-medium">Role</th>
                  <th className="py-3 px-3 font-medium">Stations</th>
                  <th className="py-3 px-2.5 text-right font-medium">Assigned</th>
                  <th className="py-3 px-2.5 text-right font-medium">Verified</th>
                  <th className="py-3 px-2.5 text-right font-medium">Pending</th>
                  <th className="py-3 px-2.5 text-right font-medium">Issues</th>
                  <th className="py-3 px-2.5 text-right font-medium">Open tasks</th>
                  <th className="py-3 px-4 text-right font-medium">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {workerProductivity.map((wp) => (
                  <tr key={wp.user.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">{wp.user.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">{wp.user.role}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-400">
                      {wp.user.pollingStationIds.join(', ').toUpperCase()}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-slate-800 dark:text-zinc-200 tabular-nums">
                      {wp.totalAssigned}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                      {wp.verified}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                      {wp.pending}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">
                      {wp.issues}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-slate-700 dark:text-zinc-300 tabular-nums">
                      {wp.openTasks}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
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
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Data export approval queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Voter data exports require administrator approval and are logged to the audit trail.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-medium">Request ID</th>
                  <th className="py-3 px-3 font-medium">Requester</th>
                  <th className="py-3 px-3 font-medium">Scope</th>
                  <th className="py-3 px-2.5 text-right font-medium">Records</th>
                  <th className="py-3 px-3 font-medium">Reason</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {exportRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-zinc-400">
                      No export requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  exportRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-zinc-200">{req.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-zinc-100">{req.requesterName}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-zinc-300">{req.scopeDescription}</td>
                      <td className="py-3 px-2.5 text-right font-mono text-slate-800 dark:text-zinc-200 tabular-nums">
                        {req.recordCount}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">{req.reason}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-medium ${getExportStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {req.status === 'Pending Approval' && canApproveExport ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => approveOrRejectExport(req.id, 'Approved')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => approveOrRejectExport(req.id, 'Rejected')}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                            {req.approvedBy ? `Reviewed by ${req.approvedBy}` : 'Awaiting review'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: AUDIT LOG */}
      {reportSection === 'audit' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              Security and operational audit log ({auditLogs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Permanent log of voter edits, station moves, imports, rollbacks, exports, and account changes.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                  <th className="py-2.5 px-4 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3 font-medium">Official</th>
                  <th className="py-2.5 px-3 font-medium">Action</th>
                  <th className="py-2.5 px-3 font-medium">Entity</th>
                  <th className="py-2.5 px-3 font-medium">Field</th>
                  <th className="py-2.5 px-3 font-medium">Change</th>
                  <th className="py-2.5 px-4 font-medium">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">{log.userName}</div>
                      {log.userRole && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{log.userRole}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">
                      {log.entity}: {log.entityId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">{log.field}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">
                      <span className="text-slate-400 dark:text-zinc-500 line-through mr-1.5">{log.oldValue}</span>
                      <span className="font-medium text-slate-900 dark:text-zinc-100">to {log.newValue}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      {log.gps || 'None'}
                    </td>
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
