'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
  FileText,
  UserCheck,
  Calendar,
  AlertTriangle,
  Edit3,
  PlusCircle,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldAlert,
  Phone,
  Users,
  History,
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
    <div className="h-64 w-full rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-500">
      Loading OpenStreetMap canvas...
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
    bulkUpdateVoters,
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
    age: voter?.age || 18,
    gender: (voter?.gender || 'M') as 'M' | 'F' | 'O',
    phone: voter?.phone || '',
    alternatePhone: voter?.alternatePhone || '',
    occupation: voter?.occupation || '',
    education: voter?.education || '',
    rationCardNo: voter?.rationCardNo || '',
    specialNeeds: (voter?.specialNeeds || 'None') as 'None' | 'Elderly (80+)' | 'PwD' | 'Bedridden',
    addressId: voter?.addressId || '',
    lat: voter?.lat || 24.6382,
    lng: voter?.lng || 94.0012,
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
      age: voter.age,
      gender: voter.gender,
      phone: voter.phone,
      alternatePhone: voter.alternatePhone || '',
      occupation: voter.occupation || '',
      education: voter.education || '',
      rationCardNo: voter.rationCardNo || '',
      specialNeeds: voter.specialNeeds || 'None',
      addressId: voter.addressId,
      lat: voter.lat || 24.6382,
      lng: voter.lng || 94.0012,
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
    const nextLat = Number(formState.lat);
    const nextLng = Number(formState.lng);
    updateVoter(
      voter.id,
      {
        name: formState.name,
        nameLocal: formState.nameLocal,
        fatherName: formState.fatherName,
        motherName: formState.motherName,
        spouseName: formState.spouseName || undefined,
        age: Number(formState.age),
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

  const statusColorMap: Record<VoterStatus, string> = {
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Issues: 'bg-red-50 text-red-700 border-red-200',
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Removed: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  const currentCategory = normalizeVoterCategory(voter.category || voter.colorState);
  const currentCategoryStyles = getVoterCategoryStyles(currentCategory);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]">
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className={`border-b border-slate-200 bg-slate-50/80 px-6 py-4 ${currentCategoryStyles.rowBorder}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColorMap[voter.status]}`}>
                {voter.status}
              </span>
              {/* Pure Color Dots Switcher */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
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
                        isActive ? `ring-2 ring-offset-1 ${st.ring} scale-110` : 'opacity-40 hover:opacity-100'
                      }`}
                      aria-label="Set color"
                    />
                  );
                })}
              </div>
              {voter.status === 'Issues' && voter.issueType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  <AlertTriangle className="h-3 w-3" />
                  {voter.issueType}
                </span>
              )}
              <span className="font-mono text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {voter.epicNo}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Part {voter.partNo} · Sl. {voter.serialNo}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!prevId}
                onClick={() => prevId && setSelectedVoterId(prevId)}
                title="Previous Voter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!nextId}
                onClick={() => nextId && setSelectedVoterId(nextId)}
                title="Next Voter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{voter.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Family ID: <span className="font-mono font-medium text-slate-700">{family?.familyCode || voter.familyId}</span>
                {' · '}Age: <span className="font-semibold text-slate-700 tabular-nums">{voter.age}</span>
                {' · '}Gender: <span className="font-semibold text-slate-700">{voter.gender}</span>
                {' · '}PS: <span className="font-semibold text-blue-700">PS-{pollingStation?.psNo} ({villagePart?.name})</span>
              </p>
            </div>
            <span className="text-[11px] text-slate-400 tabular-nums">
              Updated {new Date(voter.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="mt-4 flex items-center gap-1 border-b border-slate-200 -mb-4 overflow-x-auto">
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
                className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeDrawerTab === tab.id
                    ? 'border-[#0071e3] text-[#0071e3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unsaved Changes Warning Banner */}
        {showUnsavedWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>You have unsaved edits on this voter record. Discard changes?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnsavedWarning(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setShowUnsavedWarning(false);
                  setSelectedVoterId(null);
                }}
                className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md"
              >
                Discard & Close
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeDrawerTab === 'overview' && (
            <>
              {/* Quick Actions Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-700">Quick Field Actions</span>
                  <span className="text-[11px] text-slate-500">Status Workflow: New → Pending → Verified / Issues</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('notify')}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 p-2.5 text-xs font-semibold text-[#0071e3] hover:bg-blue-100/70 transition-colors"
                  >
                    <BellRing className="h-4 w-4 text-[#0071e3]" />
                    <span className="whitespace-nowrap">Notify Voter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('notes')}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="whitespace-nowrap">Add Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span className="whitespace-nowrap">Assign Worker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTaskType('Meeting');
                      setActiveDrawerTab('tasks');
                    }}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span className="whitespace-nowrap">Schedule Meet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIssueModal((v) => !v)}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50/50 p-2.5 text-xs font-medium text-red-700 hover:bg-red-100/60 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="whitespace-nowrap">Mark Issue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateVoter(voter.id, { status: 'Verified' }, 'Confirmed in field verification');
                    }}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100/60 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="whitespace-nowrap">Verify Now</span>
                  </button>
                </div>
              </div>

              {/* Mark Issue / Resolve Issue Panel */}
              {(showIssueModal || voter.status === 'Issues') && (
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      <h4 className="text-xs font-bold text-red-900">
                        {voter.status === 'Issues' ? `Active Issue: ${voter.issueType || 'Flagged'}` : 'Flag Electoral Roll Issue'}
                      </h4>
                    </div>
                    {showIssueModal && (
                      <button type="button" onClick={() => setShowIssueModal(false)} className="text-xs text-slate-500 hover:text-slate-700">
                        Close
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Issue Classification (Required)</label>
                      <select
                        value={selectedIssueType}
                        onChange={(e) => setSelectedIssueType(e.target.value as IssueType)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                      >
                        {issueTypes.map((it) => (
                          <option key={it} value={it}>
                            {it}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Field Note / Resolution Details</label>
                      <input
                        type="text"
                        value={issueResolutionText}
                        onChange={(e) => setIssueResolutionText(e.target.value)}
                        placeholder="Enter reason or resolution note to close..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {voter.status === 'Issues' && (
                      <button
                        type="button"
                        onClick={handleResolveIssue}
                        className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                      >
                        Resolve Issue → Move to Pending
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleMarkIssue}
                      className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                    >
                      Save Issue Flag
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Info Section */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">1. Personal Information</h3>
                  {canEditVoter && (
                    <button
                      type="button"
                      onClick={() => setIsEditing((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {isEditing ? 'Editing Active' : 'Edit Fields'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Full Name (Electoral Roll)</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 font-medium focus:border-[#0071e3] focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Local / Clan Reference</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.nameLocal}
                      onChange={(e) => handleFieldChange('nameLocal', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1">Age (Years)</label>
                      <input
                        type="number"
                        min={18}
                        max={120}
                        disabled={!canEditVoter}
                        value={formState.age}
                        onChange={(e) => handleFieldChange('age', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 tabular-nums focus:border-[#0071e3] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Gender</label>
                      <select
                        disabled={!canEditVoter}
                        value={formState.gender}
                        onChange={(e) => handleFieldChange('gender', e.target.value as 'M' | 'F' | 'O')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none"
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                        <option value="O">Other (O)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Phone Number (Privacy Masked)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        disabled={!canEditVoter || !revealFullPhone}
                        value={revealFullPhone ? formState.phone : maskPhoneNumber(formState.phone, false)}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-slate-900 focus:border-[#0071e3] focus:outline-none disabled:bg-slate-50"
                      />
                      <a
                        href={`tel:${voter.phone}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        title="Call Voter"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Occupation & Livelihood</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.occupation}
                      onChange={(e) => handleFieldChange('occupation', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Special Assistance Flag</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.specialNeeds}
                      onChange={(e) => handleFieldChange('specialNeeds', e.target.value as typeof formState.specialNeeds)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Elderly (80+)">Elderly (80+ Home Voting Eligible)</option>
                      <option value="PwD">Person with Disability (Wheelchair)</option>
                      <option value="Bedridden">Bedridden / Medical Assistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Assigned Field Worker</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.assignedWorkerId}
                      onChange={(e) => handleFieldChange('assignedWorkerId', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none"
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
                    <label className="block text-slate-500 mb-1">Verification Status</label>
                    <select
                      disabled={!canEditVoter}
                      value={formState.status}
                      onChange={(e) => handleFieldChange('status', e.target.value as VoterStatus)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-900 focus:border-[#0071e3] focus:outline-none"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                      <option value="Issues">Issues</option>
                      <option value="New">Newly Imported</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Family Info Section */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">2. Family & Relations</h3>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('family')}
                    className="text-xs font-medium text-[#0071e3] hover:underline"
                  >
                    View All {familyMembers.length} Family Members →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Father&apos;s Name</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.fatherName}
                      onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Mother&apos;s Name</label>
                    <input
                      type="text"
                      disabled={!canEditVoter}
                      value={formState.motherName}
                      onChange={(e) => handleFieldChange('motherName', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Spouse / Close Member</label>
                    {voter.spouseVoterId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVoterId(voter.spouseVoterId!)}
                          className="w-full text-left rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-[#0071e3] font-medium hover:bg-blue-100/60 truncate"
                        >
                          {voter.spouseName || 'Linked Spouse'} ↗
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled={!canEditVoter}
                        value={formState.spouseName}
                        onChange={(e) => handleFieldChange('spouseName', e.target.value)}
                        placeholder="None recorded"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Address & Location Section */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0071e3]" />
                    <h3 className="text-sm font-semibold text-slate-900">3. Address, Hierarchy & GPS Location</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    GPS Accuracy ±{voter.gpsAccuracyMeters || 5}m
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Village</span>
                    <span className="font-semibold text-slate-800">{village?.name} ({village?.code})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Village Part (Leikai)</span>
                    <span className="font-semibold text-slate-800">{villagePart?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Polling Station</span>
                    <span className="font-semibold text-[#0071e3]">PS-{pollingStation?.psNo}: {pollingStation?.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Household Street Address</label>
                  <input
                    type="text"
                    disabled={!canEditVoter}
                    value={formState.addressId}
                    onChange={(e) => handleFieldChange('addressId', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                {/* Interactive OpenStreetMap & Leaflet Pin Picker */}
                <VoterPinPickerMap
                  lat={Number(formState.lat)}
                  lng={Number(formState.lng)}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50/70 dark:bg-slate-800/70 border border-blue-200/80 dark:border-slate-700 px-3 py-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncFamilyGps}
                        onChange={(e) => setSyncFamilyGps(e.target.checked)}
                        className="rounded border-slate-300 text-[#0071e3]"
                      />
                      <span>
                        Apply exact house pin to all <strong>{familyMembers.length}</strong> household members (
                        <span className="font-mono">{family?.familyCode || voter.familyId}</span>)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0071e3] px-3.5 py-1 text-xs font-semibold text-white hover:bg-blue-600 shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Pin Location</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-slate-600" />
                    <h3 className="text-sm font-semibold text-slate-900">4. Household & Voter Tags</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Click to toggle (Max 10)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const active = voter.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          active
                            ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">5. Open Tasks & Notifications ({voterTasks.length})</h3>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('tasks')}
                    className="text-xs font-medium text-[#0071e3] hover:underline"
                  >
                    Manage Tasks →
                  </button>
                </div>
                {voterTasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No open field tasks for this voter. Assigned Worker: {assignedWorker?.name || 'Unassigned'}.</p>
                ) : (
                  <div className="space-y-2">
                    {voterTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-800">{t.title}</p>
                          <p className="text-[11px] text-slate-500">Due: {t.dueDate} · Priority: {t.priority}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === 'Overdue'
                              ? 'bg-red-100 text-red-700'
                              : t.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : t.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Household {family?.familyCode || voter.familyId}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Head of Family: <span className="font-semibold text-slate-800">{family?.headName}</span> · {family?.address}
                  </p>
                </div>
                <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                  {family?.statusRollup}
                </span>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors ${
                      member.id === voter.id ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                        <span className="text-xs text-slate-500">({member.relationToHead || 'Member'})</span>
                        {member.id === voter.id && (
                          <span className="text-[10px] font-semibold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {member.epicNo} · Age {member.age} · {member.gender} · Father: {member.fatherName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColorMap[member.status]}`}>
                        {member.status}
                      </span>
                      {member.id !== voter.id && (
                        <button
                          type="button"
                          onClick={() => setSelectedVoterId(member.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-[#0071e3] hover:bg-slate-100"
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
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BellRing className="h-4 w-4 text-[#0071e3]" />
                    <span>Send Individual Notification to {voter.name}</span>
                  </h4>
                  <span className="font-mono text-slate-500">
                    {maskPhoneNumber(voter.phone, revealFullPhone)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Delivery Channel</label>
                    <select
                      value={drawerNotifChannel}
                      onChange={(e) => setDrawerNotifChannel(e.target.value as NotificationChannel)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS Text</option>
                      <option value="Voice Call">Voice Call Alert</option>
                      <option value="Field Slip">Doorstep Field Slip</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Template Preset</label>
                    <select
                      value={drawerNotifTemplate}
                      onChange={(e) => {
                        const nextTpl = e.target.value as NotificationTemplateType;
                        setDrawerNotifTemplate(nextTpl);
                        const generated = buildVoterNotificationTemplate(voter, nextTpl, pollingStation?.name);
                        setDrawerNotifSubject(generated.subject);
                        setDrawerNotifMessage(generated.message);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    >
                      <option value="Polling Slip">Polling Slip (EPIC + Booth + Serial No)</option>
                      <option value="Verification Reminder">Verification Reminder</option>
                      <option value="Booth Update">Booth Location Update</option>
                      <option value="Custom Message">Custom Message</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={drawerNotifSubject}
                    onChange={(e) => setDrawerNotifSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Personalized Message</label>
                  <textarea
                    rows={3}
                    value={drawerNotifMessage}
                    onChange={(e) => setDrawerNotifMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 leading-relaxed"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Notification</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sent Notifications ({voterNotifs.length})
                </h4>
                {voterNotifs.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">
                    No individual notifications have been sent to {voter.name} yet.
                  </p>
                ) : (
                  voterNotifs.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{n.subject}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {n.channel}
                          </span>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {n.status}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
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
                              className="text-[#0071e3] font-semibold hover:underline"
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
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                <label className="block text-xs font-semibold text-slate-800">
                  Add Field Verification Note (Supports @Coordinator mentions)
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Write verification findings, document reference, or @mention..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-[#0071e3] focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newNoteText.trim()) return;
                      addNote(voter.id, newNoteText);
                      setNewNoteText('');
                    }}
                    className="px-4 py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    Post Note
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {voterNotes.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500">No field notes recorded for this voter yet.</p>
                ) : (
                  voterNotes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{n.authorName}</span>
                        <span className="text-slate-400 tabular-nums">
                          {new Date(n.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeDrawerTab === 'tasks' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Create Task / Schedule Household Visit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">Task Description</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g., Verify EPIC card & collect Form-8 supporting proof"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Task Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as typeof newTaskType)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    >
                      <option value="Verification">Verification</option>
                      <option value="Issue Resolution">Issue Resolution</option>
                      <option value="Meeting">Schedule Meeting</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as typeof newTaskPriority)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
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
                      className="w-full py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      Assign Task
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {voterTasks.map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                        <span className="text-[11px] text-slate-500">({t.type})</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Due: <span className="font-mono">{t.dueDate}</span> · Priority: {t.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as typeof t.status)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY & VISITS */}
          {activeDrawerTab === 'history' && (
            <div className="space-y-5">
              {/* Log Visit Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900">Log On-Location Field Visit (Captures GPS)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVisitOutcome}
                    onChange={(e) => setNewVisitOutcome(e.target.value)}
                    placeholder="e.g., Met family head at residence, confirmed all members..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newVisitOutcome.trim()) return;
                      addVisit(voter.id, newVisitOutcome.trim());
                      setNewVisitOutcome('');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-blue-700 whitespace-nowrap"
                  >
                    Log Visit
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Immutable Change & Visit Timeline
                </h4>
                {voterAuditLogs.length === 0 && voterVisits.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No field edits recorded since initial electoral roll import.</p>
                ) : (
                  <div className="space-y-2.5">
                    {voterAuditLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {log.userName} <span className="font-normal text-slate-500">({log.action})</span>
                          </span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Field <span className="font-mono font-medium text-slate-800">{log.field}</span>:{' '}
                          <span className="line-through text-slate-400">{log.oldValue || 'empty'}</span> →{' '}
                          <span className="font-semibold text-emerald-700">{log.newValue}</span>
                        </p>
                        {log.gps && <p className="text-[11px] font-mono text-slate-400">GPS: {log.gps}</p>}
                      </div>
                    ))}
                    {voterVisits.map((v) => (
                      <div key={v.id} className="rounded-xl border border-blue-200 bg-blue-50/30 p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-900">Field Visit Logged</span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {new Date(v.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-700">{v.outcome}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          GPS Pin: {v.lat}, {v.lng}
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
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  Soft-Delete Voter Record (Requires Audit Reason)
                </h4>
                <button type="button" onClick={() => setShowDeleteModal(false)} className="text-xs text-slate-500">
                  Cancel
                </button>
              </div>
              <p className="text-xs text-red-800">
                Records are never permanently destroyed. Soft-deleting archives this voter and logs an immutable audit event.
              </p>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter mandatory deletion reason (e.g. Duplicate EPIC entry, Form-7 deletion)..."
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={!deleteReason.trim()}
                  onClick={() => {
                    softDeleteVoter(voter.id, deleteReason.trim());
                    setShowDeleteModal(false);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#ff3b30] text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40"
                >
                  Confirm Soft Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between gap-3">
          <div>
            {canDeleteVoter && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Record
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            {canEditVoter && (
              <button
                type="button"
                onClick={handleSaveChanges}
                className="rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
