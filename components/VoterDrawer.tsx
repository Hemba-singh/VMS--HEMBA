'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  UserCheck,
  Calendar,
  AlertTriangle,
  Edit3,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Phone,
  Tag,
  Check,
  BellRing,
  Send,
} from 'lucide-react';
import {
  useVoterStore,
  maskPhoneNumber,
  buildVoterNotificationTemplate,
} from '@/lib/store-context';
import {
  IssueType,
  VoterStatus,
  NotificationChannel,
  NotificationTemplateType,
} from '@/lib/types';
import dynamic from 'next/dynamic';
import { VOTER_CATEGORIES, getVoterCategoryStyles, normalizeVoterCategory } from '@/lib/utils';

const VoterPinPickerMap = dynamic(() => import('./VoterPinPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
      Loading map...
    </div>
  ),
});

interface VoterDrawerProps {
  filteredVoterIds: string[];
}

export default function VoterDrawer({ filteredVoterIds }: VoterDrawerProps) {
  const {
    selectedVoterId,
    setSelectedVoterId,
    voters,
    villages,
    villageParts,
    pollingStations,
    families,
    users,
    notes,
    tasks,
    visits,
    voterNotifications,
    auditLogs,
    availableTags,
    issueTypes,
    revealFullPhone,
    canEditVoter,
    canDeleteVoter,
    sendVoterNotification,
    updateVoter,
    softDeleteVoter,
    addNote,
    addTask,
    updateTaskStatus,
    addVisit,
  } = useVoterStore();

  const voter = useMemo(() => voters.find((v) => v.id === selectedVoterId) || null, [voters, selectedVoterId]);

  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'notify' | 'family' | 'notes' | 'tasks' | 'history'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [syncFamilyGps, setSyncFamilyGps] = useState(true);

  const [prevVoterId, setPrevVoterId] = useState<string | null>(voter?.id || null);

  // Editable form state
  const [formState, setFormState] = useState(() => ({
    name: voter?.name || '',
    nameLocal: voter?.nameLocal || '',
    fatherName: voter?.fatherName || '',
    motherName: voter?.motherName || '',
    spouseName: voter?.spouseName || '',
    age: voter && Number.isFinite(voter.age) ? voter.age : 18,
    gender: (voter?.gender || 'M') as 'M' | 'F' | 'O',
    phone: voter?.phone || '',
    alternatePhone: voter?.alternatePhone || '',
    occupation: voter?.occupation || '',
    education: voter?.education || '',
    rationCardNo: voter?.rationCardNo || '',
    specialNeeds: (voter?.specialNeeds || 'None') as 'None' | 'Elderly (80+)' | 'PwD' | 'Bedridden',
    addressId: voter?.addressId || '',
    lat: voter && Number.isFinite(voter.lat) ? voter.lat : 24.6382,
    lng: voter && Number.isFinite(voter.lng) ? voter.lng : 94.0012,
    status: (voter?.status || 'Pending') as VoterStatus,
    assignedWorkerId: voter?.assignedWorkerId || '',
  }));

  // Modals / Inline action panels inside drawer
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType>(voter?.issueType || 'Missing data');
  const [issueResolutionText, setIssueResolutionText] = useState(voter?.issueResolutionNote || '');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const [newNoteText, setNewNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'Verification' | 'Issue Resolution' | 'Meeting' | 'Follow-up'>('Verification');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-10-30');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newVisitOutcome, setNewVisitOutcome] = useState('');

  // Individual Notification Composer State inside Drawer
  const [drawerNotifChannel, setDrawerNotifChannel] = useState<NotificationChannel>('WhatsApp');
  const [drawerNotifTemplate, setDrawerNotifTemplate] = useState<NotificationTemplateType>('Polling Slip');
  const initialTpl = useMemo(() => {
    if (!voter) return { subject: '', message: '' };
    const ps = pollingStations.find((p) => p.id === voter.pollingStationId);
    return buildVoterNotificationTemplate(voter, 'Polling Slip', ps?.name);
  }, [voter, pollingStations]);
  const [drawerNotifSubject, setDrawerNotifSubject] = useState(initialTpl.subject);
  const [drawerNotifMessage, setDrawerNotifMessage] = useState(initialTpl.message);

  if (voter && voter.id !== prevVoterId) {
    setPrevVoterId(voter.id);
    setFormState({
      name: voter.name,
      nameLocal: voter.nameLocal || '',
      fatherName: voter.fatherName,
      motherName: voter.motherName,
      spouseName: voter.spouseName || '',
      age: Number.isFinite(voter.age) ? voter.age : 18,
      gender: voter.gender,
      phone: voter.phone,
      alternatePhone: voter.alternatePhone || '',
      occupation: voter.occupation || '',
      education: voter.education || '',
      rationCardNo: voter.rationCardNo || '',
      specialNeeds: voter.specialNeeds || 'None',
      addressId: voter.addressId,
      lat: Number.isFinite(voter.lat) ? voter.lat : 24.6382,
      lng: Number.isFinite(voter.lng) ? voter.lng : 94.0012,
      status: voter.status,
      assignedWorkerId: voter.assignedWorkerId,
    });
    setSelectedIssueType(voter.issueType || 'Missing data');
    setIssueResolutionText(voter.issueResolutionNote || '');
    const ps = pollingStations.find((p) => p.id === voter.pollingStationId);
    const tpl = buildVoterNotificationTemplate(voter, 'Polling Slip', ps?.name);
    setDrawerNotifTemplate('Polling Slip');
    setDrawerNotifSubject(tpl.subject);
    setDrawerNotifMessage(tpl.message);
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    setShowIssueModal(false);
    setShowDeleteModal(false);
  }

  if (!voter) return null;

  const currentIdx = filteredVoterIds.indexOf(voter.id);
  const prevId = currentIdx > 0 ? filteredVoterIds[currentIdx - 1] : null;
  const nextId = currentIdx >= 0 && currentIdx < filteredVoterIds.length - 1 ? filteredVoterIds[currentIdx + 1] : null;

  const village = villages.find((v) => v.id === voter.villageId);
  const villagePart = villageParts.find((vp) => vp.id === voter.villagePartId);
  const pollingStation = pollingStations.find((ps) => ps.id === voter.pollingStationId);
  const family = families.find((f) => f.id === voter.familyId);
  const familyMembers = voters.filter((v) => v.familyId === voter.familyId);
  const assignedWorker = users.find((u) => u.id === voter.assignedWorkerId);
  const voterNotes = notes.filter((n) => n.voterId === voter.id);
  const voterTasks = tasks.filter((t) => t.voterId === voter.id);
  const voterVisits = visits.filter((v) => v.voterId === voter.id);
  const voterNotifs = voterNotifications.filter((n) => n.voterId === voter.id);
  const voterAuditLogs = auditLogs.filter((a) => a.entityId === voter.id);

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    setSelectedVoterId(null);
  };

  const handleFieldChange = <K extends keyof typeof formState>(key: K, value: (typeof formState)[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    const parsedLat = Number(formState.lat);
    const parsedLng = Number(formState.lng);
    const parsedAge = Number(formState.age);
    const nextLat = Number.isFinite(parsedLat) ? parsedLat : (Number.isFinite(voter.lat) ? voter.lat! : 24.6382);
    const nextLng = Number.isFinite(parsedLng) ? parsedLng : (Number.isFinite(voter.lng) ? voter.lng! : 94.0012);
    const nextAge = Math.max(18, Math.round(Number.isFinite(parsedAge) ? parsedAge : (Number.isFinite(voter.age) ? voter.age : 18)));
    updateVoter(
      voter.id,
      {
        name: formState.name,
        nameLocal: formState.nameLocal,
        fatherName: formState.fatherName,
        motherName: formState.motherName,
        spouseName: formState.spouseName || undefined,
        age: nextAge,
        gender: formState.gender,
        phone: formState.phone,
        alternatePhone: formState.alternatePhone || undefined,
        occupation: formState.occupation,
        education: formState.education,
        rationCardNo: formState.rationCardNo,
        specialNeeds: formState.specialNeeds,
        addressId: formState.addressId,
        lat: nextLat,
        lng: nextLng,
        status: formState.status,
        assignedWorkerId: formState.assignedWorkerId,
      },
      'Manual update from Voter Details Drawer'
    );
    if (syncFamilyGps && familyMembers.length > 1) {
      const siblingIds = familyMembers.filter((m) => m.id !== voter.id).map((m) => m.id);
      siblingIds.forEach((memberId) => {
        updateVoter(
          memberId,
          { lat: nextLat, lng: nextLng },
          `Synced household GPS pin from ${voter.name} (${voter.houseNo || voter.addressId})`
        );
      });
    }
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleMarkIssue = () => {
    updateVoter(
      voter.id,
      {
        status: 'Issues',
        issueType: selectedIssueType,
        issueResolutionNote: issueResolutionText,
      },
      `Flagged Issue: ${selectedIssueType}`
    );
    setShowIssueModal(false);
  };

  const handleResolveIssue = () => {
    if (!issueResolutionText.trim()) return;
    updateVoter(
      voter.id,
      {
        status: 'Pending',
        issueResolutionNote: issueResolutionText.trim(),
      },
      `Resolved Issue (${voter.issueType}): ${issueResolutionText.trim()}`
    );
    setShowIssueModal(false);
  };

  const handleToggleTag = (tag: string) => {
    if (!canEditVoter) return;
    const exists = voter.tags.includes(tag);
    const nextTags = exists ? voter.tags.filter((t) => t !== tag) : [...voter.tags, tag].slice(0, 10);
    updateVoter(voter.id, { tags: nextTags }, exists ? `Removed tag ${tag}` : `Added tag ${tag}`);
  };

  const statusTextClass: Record<VoterStatus, string> = {
    Verified: 'text-emerald-700 dark:text-emerald-400',
    Pending: 'text-amber-700 dark:text-amber-400',
    Issues: 'text-red-700 dark:text-red-400',
    New: 'text-blue-700 dark:text-blue-400',
    Removed: 'text-slate-500 dark:text-zinc-500',
  };

  const currentCategory = normalizeVoterCategory(voter.category || voter.colorState);

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-zinc-900 disabled:text-slate-500 dark:disabled:text-zinc-400';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 dark:bg-black/60 backdrop-blur-[1px]">
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white dark:bg-zinc-900 shadow-2xl border-l border-slate-200 dark:border-zinc-800">
        {/* Drawer Header */}
        <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 px-6 pt-4 pb-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className={`font-semibold ${statusTextClass[voter.status]}`}>
                {voter.status}
              </span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              {/* Pure Color Dots Switcher */}
              <div className="inline-flex items-center gap-1.5">
                {VOTER_CATEGORIES.map((cat) => {
                  const st = getVoterCategoryStyles(cat);
                  const isActive = currentCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={!canEditVoter}
                      onClick={() => {
                        if (!isActive) {
                          updateVoter(voter.id, { category: cat }, 'Color updated');
                        }
                      }}
                      className={`h-3.5 w-3.5 rounded-full transition-all disabled:opacity-50 ${st.dot} ${
                        isActive ? `ring-2 ring-offset-1 dark:ring-offset-zinc-900 ${st.ring} scale-110` : 'opacity-40 hover:opacity-100'
                      }`}
                      aria-label="Set color"
                    />
                  );
                })}
              </div>
              {voter.status === 'Issues' && voter.issueType && (
                <>
                  <span className="text-slate-300 dark:text-zinc-700">·</span>
                  <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {voter.issueType}
                  </span>
                </>
              )}
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                {voter.epicNo}
              </span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span className="text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                Part {Number.isFinite(voter.partNo) ? voter.partNo : '-'} · Sl. {Number.isFinite(voter.serialNo) ? voter.serialNo : '-'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!prevId}
                onClick={() => prevId && setSelectedVoterId(prevId)}
                title="Previous voter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!nextId}
                onClick={() => nextId && setSelectedVoterId(nextId)}
                title="Next voter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{voter.name}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Family <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">{family?.familyCode || voter.familyId}</span>
                {' · '}Age <span className="font-medium text-slate-700 dark:text-zinc-300 tabular-nums">{Number.isFinite(voter.age) ? voter.age : '-'}</span>
                {' · '}<span className="font-medium text-slate-700 dark:text-zinc-300">{voter.gender}</span>
                {' · '}<span className="font-medium text-blue-600 dark:text-blue-400">PS-{pollingStation?.psNo ?? '-'} ({villagePart?.name})</span>
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
              Updated {new Date(voter.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'notify', label: `Notify (${voterNotifs.length})` },
              { id: 'family', label: `Family (${familyMembers.length})` },
              { id: 'notes', label: `Notes (${voterNotes.length})` },
              { id: 'tasks', label: `Tasks (${voterTasks.length})` },
              { id: 'history', label: `History (${voterAuditLogs.length + voterVisits.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDrawerTab(tab.id as typeof activeDrawerTab)}
                className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeDrawerTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unsaved Changes Warning Banner */}
        {showUnsavedWarning && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>You have unsaved edits on this voter record. Discard changes?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowUnsavedWarning(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg whitespace-nowrap"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setShowUnsavedWarning(false);
                  setSelectedVoterId(null);
                }}
                className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg whitespace-nowrap"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeDrawerTab === 'overview' && (
            <>
              {/* Quick Actions Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Quick actions</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">New, Pending, Verified or Issues</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('notify')}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <BellRing className="h-4 w-4" />
                    <span className="whitespace-nowrap">Notify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('notes')}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="whitespace-nowrap">Add note</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canEditVoter}
                    onClick={() => setIsEditing(true)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="whitespace-nowrap">Assign</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTaskType('Meeting');
                      setActiveDrawerTab('tasks');
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="whitespace-nowrap">Schedule</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canEditVoter}
                    onClick={() => setShowIssueModal((v) => !v)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 p-2.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-950/50 transition-colors disabled:opacity-40"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="whitespace-nowrap">Flag issue</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canEditVoter}
                    onClick={() => {
                      updateVoter(voter.id, { status: 'Verified' }, 'Confirmed in field verification');
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="whitespace-nowrap">Verify now</span>
                  </button>
                </div>
              </div>

              {/* Mark Issue / Resolve Issue Panel */}
              {(showIssueModal || voter.status === 'Issues') && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/25 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <h4 className="text-xs font-semibold text-red-900 dark:text-red-300">
                        {voter.status === 'Issues' ? `Active issue (${voter.issueType || 'Flagged'})` : 'Flag electoral roll issue'}
                      </h4>
                    </div>
                    {showIssueModal && (
                      <button type="button" onClick={() => setShowIssueModal(false)} className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200">
                        Close
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Issue classification</label>
                      <select
                        disabled={!canEditVoter}
                        value={selectedIssueType}
                        onChange={(e) => setSelectedIssueType(e.target.value as IssueType)}
                        className={inputClass}
                      >
                        {issueTypes.map((it) => (
                          <option key={it} value={it}>
                            {it}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Resolution note</label>
                      <input
                        type="text"
                        disabled={!canEditVoter}
                        value={issueResolutionText}
                        onChange={(e) => setIssueResolutionText(e.target.value)}
                        placeholder="Enter reason or resolution note..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {canEditVoter && (
                    <div className="flex items-center justify-end gap-2">
                      {voter.status === 'Issues' && (
                        <button
                          type="button"
                          onClick={handleResolveIssue}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 whitespace-nowrap"
                        >
                          Resolve and move to pending
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleMarkIssue}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 whitespace-nowrap"
                      >
                        Save issue flag
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Info Section */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Personal information</h3>
                  {canEditVoter && (
                    <button
                      type="button"
                      onClick={() => setIsEditing((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {isEditing ? 'Editing active' : 'Edit fields'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Full name (Electoral roll)</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={`${inputClass} font-medium`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Local or clan reference</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.nameLocal}
                      onChange={(e) => handleFieldChange('nameLocal', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 dark:text-zinc-400 mb-1">Age</label>
                      <input
                        type="number"
                        min={18}
                        max={120}
                        disabled={!canEditVoter}
                        value={Number.isFinite(formState.age) ? formState.age : 18}
                        onChange={(e) => {
                          const nextAge = Number(e.target.value);
                          handleFieldChange('age', Number.isFinite(nextAge) ? nextAge : 18);
                        }}
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-zinc-400 mb-1">Gender</label>
                      <select
                        disabled={!canEditVoter}
                        value={formState.gender}
                        onChange={(e) => handleFieldChange('gender', e.target.value as 'M' | 'F' | 'O')}
                        className={inputClass}
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                        <option value="O">Other (O)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Phone number</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        disabled={!canEditVoter || !revealFullPhone}
                        value={revealFullPhone ? formState.phone : maskPhoneNumber(formState.phone, false)}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                      <a
                        href={`tel:${voter.phone}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        title="Call voter"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Occupation</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.occupation}
                      onChange={(e) => handleFieldChange('occupation', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Special assistance</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.specialNeeds}
                      onChange={(e) => handleFieldChange('specialNeeds', e.target.value as typeof formState.specialNeeds)}
                      className={inputClass}
                    >
                      <option value="None">None</option>
                      <option value="Elderly (80+)">Elderly (80+ home voting)</option>
                      <option value="PwD">Person with disability</option>
                      <option value="Bedridden">Bedridden / medical assistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Assigned field worker</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.assignedWorkerId}
                      onChange={(e) => handleFieldChange('assignedWorkerId', e.target.value)}
                      className={inputClass}
                    >
                      {users
                        .filter((u) => u.role === 'Field Worker' || u.role === 'Polling Station Incharge')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Verification status</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.status}
                      onChange={(e) => handleFieldChange('status', e.target.value as VoterStatus)}
                      className={`${inputClass} font-medium`}
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                      <option value="Issues">Issues</option>
                      <option value="New">Newly imported</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Family Info Section */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Family and relations</h3>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('family')}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    View all {familyMembers.length} members
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Father&apos;s name</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.fatherName}
                      onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Mother&apos;s name</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.motherName}
                      onChange={(e) => handleFieldChange('motherName', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-zinc-400 mb-1">Spouse or close member</label>
                    {voter.spouseVoterId ? (
                      <button
                        type="button"
                        onClick={() => setSelectedVoterId(voter.spouseVoterId!)}
                        className="w-full text-left rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-2 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100/60 dark:hover:bg-blue-950/50 truncate"
                      >
                        {voter.spouseName || 'Linked spouse'}
                      </button>
                    ) : (
                      <input
                        type="text"
                        disabled={!canEditVoter}
                        value={formState.spouseName}
                        onChange={(e) => handleFieldChange('spouseName', e.target.value)}
                        placeholder="None recorded"
                        className={inputClass}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Address & Location Section */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Address and GPS location</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    GPS ±{Number.isFinite(voter.gpsAccuracyMeters) ? voter.gpsAccuracyMeters : 5}m
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">Village</span>
                    <span className="font-medium text-slate-900 dark:text-zinc-100">{village?.name} ({village?.code})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">Leikai / part</span>
                    <span className="font-medium text-slate-900 dark:text-zinc-100">{villagePart?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">Polling station</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">PS-{pollingStation?.psNo} {pollingStation?.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400 mb-1">Household street address</label>
                  <input
                    type="text"
                    disabled={!canEditVoter}
                    value={formState.addressId}
                    onChange={(e) => handleFieldChange('addressId', e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Interactive OpenStreetMap & Leaflet Pin Picker */}
                <VoterPinPickerMap
                  lat={Number.isFinite(Number(formState.lat)) ? Number(formState.lat) : 24.6382}
                  lng={Number.isFinite(Number(formState.lng)) ? Number(formState.lng) : 94.0012}
                  category={currentCategory}
                  voterName={voter.name}
                  houseNo={voter.houseNo}
                  epicNo={voter.epicNo}
                  pollingStation={
                    pollingStation
                      ? {
                          psNo: pollingStation.psNo,
                          name: pollingStation.name,
                          location: pollingStation.location,
                          lat: pollingStation.lat,
                          lng: pollingStation.lng,
                        }
                      : undefined
                  }
                  canEdit={canEditVoter}
                  onChangeCoordinates={(nextLat, nextLng) => {
                    handleFieldChange('lat', nextLat);
                    handleFieldChange('lng', nextLng);
                  }}
                />

                {canEditVoter && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-zinc-950 px-3 py-2.5 text-xs">
                    <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncFamilyGps}
                        onChange={(e) => setSyncFamilyGps(e.target.checked)}
                        className="rounded border-slate-300 dark:border-zinc-700 text-blue-600"
                      />
                      <span>
                        Apply pin to all <strong className="tabular-nums">{familyMembers.length}</strong> household members (
                        <span className="font-mono">{family?.familyCode || voter.familyId}</span>)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Save pin</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Voter tags</h3>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">Max 10 tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const active = voter.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={!canEditVoter}
                        onClick={() => handleToggleTag(tag)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap disabled:opacity-50 ${
                          active
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Tasks Preview in Overview */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Open tasks <span className="text-slate-400 dark:text-zinc-500 font-normal tabular-nums">({voterTasks.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('tasks')}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    Manage tasks
                  </button>
                </div>
                {voterTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    No open tasks for this voter. Assigned worker {assignedWorker?.name || 'Unassigned'}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {voterTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-zinc-100">{t.title}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">Due {t.dueDate} · {t.priority}</p>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            t.status === 'Overdue'
                              ? 'text-red-700 dark:text-red-400'
                              : t.status === 'Scheduled'
                              ? 'text-blue-700 dark:text-blue-400'
                              : t.status === 'Completed'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: FAMILY MEMBERS */}
          {activeDrawerTab === 'family' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Household {family?.familyCode || voter.familyId}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Head <span className="font-medium text-slate-800 dark:text-zinc-200">{family?.headName || 'Pending'}</span> · {family?.address}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                  {family?.statusRollup}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3.5 transition-colors ${
                      member.id === voter.id ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">{member.name}</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">{member.relationToHead || 'Member'}</span>
                        {member.id === voter.id && (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            · Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate tabular-nums">
                        {member.epicNo} · {Number.isFinite(member.age) ? member.age : '-'} · {member.gender} · {member.fatherName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium ${statusTextClass[member.status]}`}>
                        {member.status}
                      </span>
                      {member.id !== voter.id && (
                        <button
                          type="button"
                          onClick={() => setSelectedVoterId(member.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INDIVIDUAL VOTER NOTIFICATION */}
          {activeDrawerTab === 'notify' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Send notification to {voter.name}</span>
                  </h4>
                  <span className="font-mono text-slate-500 dark:text-zinc-400">
                    {maskPhoneNumber(voter.phone, revealFullPhone)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Delivery channel</label>
                    <select
                      value={drawerNotifChannel}
                      onChange={(e) => setDrawerNotifChannel(e.target.value as NotificationChannel)}
                      className={inputClass}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS text</option>
                      <option value="Voice Call">Voice call alert</option>
                      <option value="Field Slip">Doorstep field slip</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Template preset</label>
                    <select
                      value={drawerNotifTemplate}
                      onChange={(e) => {
                        const nextTpl = e.target.value as NotificationTemplateType;
                        setDrawerNotifTemplate(nextTpl);
                        const generated = buildVoterNotificationTemplate(voter, nextTpl, pollingStation?.name);
                        setDrawerNotifSubject(generated.subject);
                        setDrawerNotifMessage(generated.message);
                      }}
                      className={inputClass}
                    >
                      <option value="Polling Slip">Polling slip (EPIC, booth and serial no)</option>
                      <option value="Verification Reminder">Verification reminder</option>
                      <option value="Booth Update">Booth location update</option>
                      <option value="Custom Message">Custom message</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={drawerNotifSubject}
                    onChange={(e) => setDrawerNotifSubject(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={drawerNotifMessage}
                    onChange={(e) => setDrawerNotifMessage(e.target.value)}
                    className={`${inputClass} leading-relaxed`}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!canEditVoter || !drawerNotifMessage.trim()}
                    onClick={() => {
                      sendVoterNotification({
                        voterId: voter.id,
                        channel: drawerNotifChannel,
                        templateType: drawerNotifTemplate,
                        subject: drawerNotifSubject,
                        message: drawerNotifMessage,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send notification</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Sent notifications <span className="text-slate-400 dark:text-zinc-500 font-normal tabular-nums">({voterNotifs.length})</span>
                </h4>
                {voterNotifs.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500 dark:text-zinc-400">
                    No notifications sent to {voter.name} yet.
                  </p>
                ) : (
                  voterNotifs.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-zinc-100">{n.subject}</span>
                          <span className="text-slate-500 dark:text-zinc-400">· {n.channel}</span>
                        </div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {n.status}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 pt-1">
                        <span>Sent by {n.sentByName}</span>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums">
                            {new Date(n.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {canEditVoter && (
                            <button
                              type="button"
                              onClick={() =>
                                sendVoterNotification({
                                  voterId: voter.id,
                                  channel: n.channel,
                                  templateType: n.templateType,
                                  subject: n.subject,
                                  message: n.message,
                                })
                              }
                              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                              Resend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeDrawerTab === 'notes' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3 bg-slate-50/70 dark:bg-zinc-950/50">
                <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Add field verification note
                </label>
                <textarea
                  rows={3}
                  disabled={!canEditVoter}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Write verification findings, document reference, or @mention..."
                  className={`${inputClass} p-3`}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!canEditVoter || !newNoteText.trim()}
                    onClick={() => {
                      if (!newNoteText.trim()) return;
                      addNote(voter.id, newNoteText);
                      setNewNoteText('');
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    Post note
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {voterNotes.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 dark:text-zinc-400">No field notes recorded for this voter yet.</p>
                ) : (
                  voterNotes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">{n.authorName}</span>
                        <span className="text-slate-400 dark:text-zinc-500 tabular-nums">
                          {new Date(n.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeDrawerTab === 'tasks' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Create task or schedule household visit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-zinc-400 mb-1">Task description</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Verify EPIC card and collect Form-8 supporting proof"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 mb-1">Task type</label>
                    <select
                      disabled={!canEditVoter}
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as typeof newTaskType)}
                      className={inputClass}
                    >
                      <option value="Verification">Verification</option>
                      <option value="Issue Resolution">Issue resolution</option>
                      <option value="Meeting">Schedule meeting</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 mb-1">Due date</label>
                    <input
                      type="date"
                      disabled={!canEditVoter}
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 mb-1">Priority</label>
                    <select
                      disabled={!canEditVoter}
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as typeof newTaskPriority)}
                      className={inputClass}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={!canEditVoter || !newTaskTitle.trim()}
                      onClick={() => {
                        if (!newTaskTitle.trim()) return;
                        addTask({
                          voterId: voter.id,
                          familyId: voter.familyId,
                          pollingStationId: voter.pollingStationId,
                          title: newTaskTitle.trim(),
                          type: newTaskType,
                          assigneeId: voter.assignedWorkerId,
                          dueDate: newTaskDueDate,
                          priority: newTaskPriority,
                          status: 'Scheduled',
                        });
                        setNewTaskTitle('');
                      }}
                      className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                    >
                      Assign task
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {voterTasks.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 dark:text-zinc-400">No tasks assigned for this voter.</p>
                ) : (
                  voterTasks.map((t) => (
                    <div key={t.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">{t.title}</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">· {t.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                          Due <span className="font-mono">{t.dueDate}</span> · {t.priority}
                        </p>
                      </div>
                      <select
                        disabled={!canEditVoter}
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as typeof t.status)}
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-zinc-200"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY & VISITS */}
          {activeDrawerTab === 'history' && (
            <div className="space-y-5">
              {/* Log Visit Box */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Log on-location field visit</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={!canEditVoter}
                    value={newVisitOutcome}
                    onChange={(e) => setNewVisitOutcome(e.target.value)}
                    placeholder="Met family head at residence, confirmed all members..."
                    className={inputClass}
                  />
                  <button
                    type="button"
                    disabled={!canEditVoter || !newVisitOutcome.trim()}
                    onClick={() => {
                      if (!newVisitOutcome.trim()) return;
                      addVisit(voter.id, newVisitOutcome.trim());
                      setNewVisitOutcome('');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    Log visit
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Change and visit timeline
                </h4>
                {voterAuditLogs.length === 0 && voterVisits.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 py-4">No field edits recorded since initial electoral roll import.</p>
                ) : (
                  <div className="space-y-2.5">
                    {voterAuditLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900 dark:text-zinc-100">
                            {log.userName} <span className="font-normal text-slate-500 dark:text-zinc-400">· {log.action}</span>
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-zinc-300">
                          Field <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">{log.field}</span> changed from{' '}
                          <span className="line-through text-slate-400 dark:text-zinc-500">{log.oldValue || 'empty'}</span> to{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">{log.newValue}</span>
                        </p>
                        {log.gps && <p className="text-xs font-mono text-slate-400 dark:text-zinc-500">GPS {log.gps}</p>}
                      </div>
                    ))}
                    {voterVisits.map((v) => (
                      <div key={v.id} className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-blue-900 dark:text-blue-300">Field visit logged</span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
                            {new Date(v.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-zinc-300">{v.outcome}</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                          GPS {Number.isFinite(v.lat) ? v.lat : '-'}, {Number.isFinite(v.lng) ? v.lng : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Soft Delete Confirmation Modal inside Drawer */}
          {showDeleteModal && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Soft-delete voter record
                </h4>
                <button type="button" onClick={() => setShowDeleteModal(false)} className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200">
                  Cancel
                </button>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300/90">
                Records are archived rather than permanently destroyed. An audit entry will be recorded.
              </p>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter deletion reason (Duplicate EPIC, Form-7 deletion)..."
                className={inputClass}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={!deleteReason.trim()}
                  onClick={() => {
                    softDeleteVoter(voter.id, deleteReason.trim());
                    setShowDeleteModal(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-40 whitespace-nowrap"
                >
                  Confirm soft delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-6 py-3.5 flex items-center justify-between gap-3">
          <div>
            {canDeleteVoter && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete record
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
            >
              Close
            </button>
            {canEditVoter && (
              <button
                type="button"
                onClick={handleSaveChanges}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                Save changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
