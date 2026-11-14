'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Columns,
  Plus,
  Upload,
  Download,
  ArrowUpDown,
  FileText,
  CheckSquare,
  Edit3,
  MoreHorizontal,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Bookmark,
  RotateCcw,
  MapPin,
  BellRing,
  Send,
  MessageSquare,
  PhoneCall,
  Printer,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Calendar,
  Check,
  MoreVertical,
} from 'lucide-react';
import {
  useVoterStore,
  matchesFuzzyQuery,
  maskPhoneNumber,
  buildVoterNotificationTemplate,
} from '@/lib/store-context';
import {
  Voter,
  VoterStatus,
  VoterCategory,
  IssueType,
  Gender,
  NotificationChannel,
  NotificationTemplateType,
} from '@/lib/types';
import {
  getVoterCategoryStyles,
  normalizeVoterCategory,
  VOTER_CATEGORIES,
} from '@/lib/utils';
import VoterDrawer from './VoterDrawer';

type SortField = 'serialNo' | 'name' | 'epicNo' | 'age' | 'pollingStationId' | 'status';

export default function VoterListView() {
  const {
    voters,
    villages,
    villageParts,
    scopedPollingStations,
    families,
    users,
    notes,
    tasks,
    voterNotifications,
    availableTags,
    issueTypes,
    savedFilters,
    globalSearch,
    setGlobalSearch,
    searchScope,
    setSearchScope,
    statusCardFilter,
    setStatusCardFilter,
    selectedPollingStationFilter,
    setSelectedPollingStationFilter,
    selectedFamilyFilter,
    setSelectedFamilyFilter,
    selectedVoterId,
    setSelectedVoterId,
    activeNotifyVoterId,
    setActiveNotifyVoterId,
    setActiveTab,
    revealFullPhone,
    canEditVoter,
    canImportData,
    canRequestExport,
    currentUser,
    sendVoterNotification,
    sendBulkVoterNotifications,
    updateVoter,
    bulkUpdateVoters,
    createVoter,
    requestDataExport,
    saveCustomFilter,
  } = useVoterStore();

  // Filter states
  const [categoryColorFilter, setCategoryColorFilter] = useState<VoterCategory | 'ALL'>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [villagePartFilter, setVillagePartFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<Gender | 'ALL'>('ALL');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | 'ALL'>('ALL');
  const [newlyImportedOnly, setNewlyImportedOnly] = useState<boolean>(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [showPsMultiSelect, setShowPsMultiSelect] = useState<boolean>(false);

  // Column visibility state
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);
  const [visibleCols, setVisibleCols] = useState({
    status: true,
    name: true,
    epicNo: true,
    houseNo: true,
    village: true,
    villagePart: true,
    pollingStation: true,
    familyId: true,
    fatherName: true,
    motherName: true,
    spouseName: true,
    age: true,
    gender: true,
    phone: false,
    activity: true,
  });

  // Sorting & Pagination
  const [viewMode, setViewMode] = useState<'expanded' | 'list'>('expanded');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [activityLegendFilter, setActivityLegendFilter] = useState<'ALL' | 'meeting' | 'notes' | 'followup' | 'completed'>('ALL');
  const [sortField, setSortField] = useState<SortField>('serialNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(70);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Row selection & Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkMovePsId, setBulkMovePsId] = useState<string>('');
  const [bulkMoveReason, setBulkMoveReason] = useState<string>('');
  const [showBulkMoveModal, setShowBulkMoveModal] = useState<boolean>(false);

  // Modals: Add Voter, Export Request, Save Filter, Individual & Bulk Notification
  const [showAddVoterModal, setShowAddVoterModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportReason, setExportReason] = useState<string>('');
  const [newFilterName, setNewFilterName] = useState<string>('');

  // Individual Voter Notification Modal State
  const [notifChannel, setNotifChannel] = useState<NotificationChannel>('WhatsApp');
  const [notifTemplate, setNotifTemplate] = useState<NotificationTemplateType>('Polling Slip');
  const [notifSubject, setNotifSubject] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');

  // Bulk Individual Notification Modal State
  const [showBulkNotifyModal, setShowBulkNotifyModal] = useState<boolean>(false);
  const [bulkNotifChannel, setBulkNotifChannel] = useState<NotificationChannel>('SMS');
  const [bulkNotifTemplate, setBulkNotifTemplate] = useState<NotificationTemplateType>('Polling Slip');
  const [bulkNotifNote, setBulkNotifNote] = useState<string>('');

  // Add Voter Form State
  const [newVoterForm, setNewVoterForm] = useState({
    epicNo: '',
    name: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    age: 26,
    gender: 'M' as Gender,
    phone: '',
    villagePartId: villageParts[0]?.id || 'vp-1',
    houseNo: '',
    status: 'Pending' as VoterStatus,
    category: VoterCategory.Pending,
  });

  // Lookup maps for O(1) rendering
  const villageMap = useMemo(() => new Map(villages.map((v) => [v.id, v])), [villages]);
  const villagePartMap = useMemo(() => new Map(villageParts.map((vp) => [vp.id, vp])), [villageParts]);
  const psMap = useMemo(() => new Map(scopedPollingStations.map((ps) => [ps.id, ps])), [scopedPollingStations]);
  const familyMap = useMemo(() => new Map(families.map((f) => [f.id, f])), [families]);

  const noteCountMap = useMemo(() => {
    const m = new Map<string, number>();
    notes.forEach((n) => m.set(n.voterId, (m.get(n.voterId) || 0) + 1));
    return m;
  }, [notes]);

  const taskCountMap = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status !== 'Completed') {
        m.set(t.voterId, (m.get(t.voterId) || 0) + 1);
      }
    });
    return m;
  }, [tasks]);

  const notificationCountMap = useMemo(() => {
    const m = new Map<string, number>();
    voterNotifications.forEach((n) => m.set(n.voterId, (m.get(n.voterId) || 0) + 1));
    return m;
  }, [voterNotifications]);

  const activeNotifyVoter = useMemo(
    () => voters.find((v) => v.id === activeNotifyVoterId) || null,
    [voters, activeNotifyVoterId]
  );

  const openIndividualNotifyModal = (voter: Voter, template: NotificationTemplateType = 'Polling Slip') => {
    const ps = psMap.get(voter.pollingStationId);
    const built = buildVoterNotificationTemplate(voter, template, ps?.name);
    setNotifChannel(voter.contactPreference === 'Phone' ? 'SMS' : 'WhatsApp');
    setNotifTemplate(template);
    setNotifSubject(built.subject);
    setNotifMessage(built.message);
    setActiveNotifyVoterId(voter.id);
  };

  // Base voters filtered by non-status filters so the 4 Status Cards show live counts
  const votersBeforeStatusCard = useMemo(() => {
    return voters.filter((v) => {
      if (selectedPollingStationFilter.length > 0 && !selectedPollingStationFilter.includes(v.pollingStationId)) {
        return false;
      }
      if (villageFilter !== 'ALL' && v.villageId !== villageFilter) return false;
      if (villagePartFilter !== 'ALL' && v.villagePartId !== villagePartFilter) return false;
      if (selectedFamilyFilter && v.familyId !== selectedFamilyFilter) return false;
      if (genderFilter !== 'ALL' && v.gender !== genderFilter) return false;
      const parsedMinAge = minAge ? Number(minAge) : NaN;
      const parsedMaxAge = maxAge ? Number(maxAge) : NaN;
      if (Number.isFinite(parsedMinAge) && v.age < parsedMinAge) return false;
      if (Number.isFinite(parsedMaxAge) && v.age > parsedMaxAge) return false;
      if (tagFilter !== 'ALL' && !v.tags.includes(tagFilter)) return false;
      if (workerFilter !== 'ALL' && v.assignedWorkerId !== workerFilter) return false;
      if (issueTypeFilter !== 'ALL' && v.issueType !== issueTypeFilter) return false;
      if (newlyImportedOnly && v.status !== 'New' && !v.importBatchId) return false;

      if (globalSearch.trim()) {
        const famCode = familyMap.get(v.familyId)?.familyCode;
        if (!matchesFuzzyQuery(v, globalSearch, famCode, searchScope)) return false;
      }
      return true;
    });
  }, [
    voters,
    selectedPollingStationFilter,
    villageFilter,
    villagePartFilter,
    selectedFamilyFilter,
    genderFilter,
    minAge,
    maxAge,
    tagFilter,
    workerFilter,
    issueTypeFilter,
    newlyImportedOnly,
    globalSearch,
    searchScope,
    familyMap,
  ]);

  // Live Status Card Totals
  const statusCounts = useMemo(() => {
    let verified = 0;
    let pending = 0;
    let issues = 0;
    let newlyImported = 0;
    for (const v of votersBeforeStatusCard) {
      if (v.status === 'Verified') verified++;
      else if (v.status === 'Pending') pending++;
      else if (v.status === 'Issues') issues++;
      else if (v.status === 'New') newlyImported++;
    }
    return {
      total: votersBeforeStatusCard.length,
      Verified: verified,
      Pending: pending,
      Issues: issues,
      New: newlyImported,
    };
  }, [votersBeforeStatusCard]);

  // Voters after Status Card Filter
  const votersAfterStatusFilter = useMemo(() => {
    return statusCardFilter === 'ALL'
      ? votersBeforeStatusCard
      : votersBeforeStatusCard.filter((v) => v.status === statusCardFilter);
  }, [votersBeforeStatusCard, statusCardFilter]);

  // Final filtered & sorted voters
  const filteredVoters = useMemo(() => {
    let list =
      categoryColorFilter === 'ALL'
        ? votersAfterStatusFilter
        : votersAfterStatusFilter.filter(
            (v) => normalizeVoterCategory(v.category || v.colorState) === categoryColorFilter
          );

    if (activityLegendFilter === 'meeting') {
      list = list.filter((v) => tasks.some((t) => t.voterId === v.id && t.type === 'Meeting'));
    } else if (activityLegendFilter === 'notes') {
      list = list.filter((v) => (noteCountMap.get(v.id) || 0) > 0);
    } else if (activityLegendFilter === 'followup') {
      list = list.filter((v) => (taskCountMap.get(v.id) || 0) > 0);
    } else if (activityLegendFilter === 'completed') {
      list = list.filter((v) => v.status === 'Verified');
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'serialNo') cmp = (Number.isFinite(a.serialNo) ? a.serialNo : 0) - (Number.isFinite(b.serialNo) ? b.serialNo : 0);
      else if (sortField === 'age') cmp = (Number.isFinite(a.age) ? a.age : 0) - (Number.isFinite(b.age) ? b.age : 0);
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'epicNo') cmp = a.epicNo.localeCompare(b.epicNo);
      else if (sortField === 'pollingStationId') cmp = (Number.isFinite(a.partNo) ? a.partNo : 0) - (Number.isFinite(b.partNo) ? b.partNo : 0);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
  }, [votersAfterStatusFilter, categoryColorFilter, activityLegendFilter, sortField, sortAsc, tasks, noteCountMap, taskCountMap]);

  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 25;
  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / safePageSize));
  const safePage = Math.max(1, Math.min(Number.isFinite(currentPage) ? currentPage : 1, totalPages));
  const paginatedVoters = useMemo(() => {
    const start = (safePage - 1) * safePageSize;
    return filteredVoters.slice(start, start + safePageSize);
  }, [filteredVoters, safePage, safePageSize]);

  const filteredVoterIds = useMemo(() => filteredVoters.map((v) => v.id), [filteredVoters]);
  const uniqueFamilyCount = useMemo(() => new Set(filteredVoters.map((v) => v.familyId)).size, [filteredVoters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleClearAllFilters = () => {
    setGlobalSearch('');
    setStatusCardFilter('ALL');
    setCategoryColorFilter('ALL');
    setSelectedPollingStationFilter([]);
    setVillageFilter('ALL');
    setVillagePartFilter('ALL');
    setSelectedFamilyFilter(null);
    setGenderFilter('ALL');
    setMinAge('');
    setMaxAge('');
    setTagFilter('ALL');
    setWorkerFilter('ALL');
    setIssueTypeFilter('ALL');
    setNewlyImportedOnly(false);
    setActivityLegendFilter('ALL');
    setCurrentPage(1);
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedVoters.map((v) => v.id);
    const allSelected = pageIds.every((id) => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedRowIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const statusTextClass: Record<VoterStatus, string> = {
    Verified: 'text-emerald-700 dark:text-emerald-400',
    Pending: 'text-amber-700 dark:text-amber-400',
    Issues: 'text-red-700 dark:text-red-400',
    New: 'text-blue-700 dark:text-blue-400',
    Removed: 'text-slate-500 dark:text-zinc-500',
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none';

  const stationLabel =
    selectedPollingStationFilter.length === 1
      ? `PS-${psMap.get(selectedPollingStationFilter[0])?.psNo || ''}`
      : selectedPollingStationFilter.length > 1
      ? `${selectedPollingStationFilter.length} stations`
      : `All ${scopedPollingStations.length} stations`;

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-40 bg-slate-50 dark:bg-zinc-950 p-6 overflow-y-auto space-y-6'
          : 'space-y-6'
      }
    >
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Voter list
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
            <span className="font-medium text-slate-800 dark:text-zinc-200">{filteredVoters.length}</span> voters ·{' '}
            <span className="font-medium text-slate-800 dark:text-zinc-200">{uniqueFamilyCount}</span> households ·{' '}
            {stationLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0 transition-colors"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Exit full screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Full screen</span>
              </>
            )}
          </button>

          {canImportData && (
            <button
              type="button"
              onClick={() => setActiveTab('import-data')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Import</span>
            </button>
          )}

          {canRequestExport && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Export</span>
            </button>
          )}

          {canEditVoter && (
            <button
              type="button"
              onClick={() => setShowAddVoterModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add voter</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Status KPI Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: 'Verified' as VoterStatus,
            label: 'Verified voters',
            count: statusCounts.Verified,
            pct: statusCounts.total ? Math.round((statusCounts.Verified / statusCounts.total) * 100) : 0,
            subtitle: 'Confirmed on location with GPS',
            icon: CheckCircle2,
            activeBorder: 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500',
            iconStyle: 'text-emerald-600 dark:text-emerald-400',
            countColor: 'text-slate-900 dark:text-zinc-100',
          },
          {
            key: 'Pending' as VoterStatus,
            label: 'Pending verification',
            count: statusCounts.Pending,
            pct: statusCounts.total ? Math.round((statusCounts.Pending / statusCounts.total) * 100) : 0,
            subtitle: 'Assigned to field workers',
            icon: Clock,
            activeBorder: 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500',
            iconStyle: 'text-amber-600 dark:text-amber-400',
            countColor: 'text-slate-900 dark:text-zinc-100',
          },
          {
            key: 'Issues' as VoterStatus,
            label: 'Flagged issues',
            count: statusCounts.Issues,
            pct: statusCounts.total ? Math.round((statusCounts.Issues / statusCounts.total) * 100) : 0,
            subtitle: 'Requires BLO resolution',
            icon: AlertTriangle,
            activeBorder: 'border-red-600 dark:border-red-500 ring-1 ring-red-600 dark:ring-red-500',
            iconStyle: 'text-red-600 dark:text-red-400',
            countColor: 'text-red-600 dark:text-red-400',
          },
          {
            key: 'New' as VoterStatus,
            label: 'Newly imported',
            count: statusCounts.New,
            pct: statusCounts.total ? Math.round((statusCounts.New / statusCounts.total) * 100) : 0,
            subtitle: 'Supplemental roll additions',
            icon: Sparkles,
            activeBorder: 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500',
            iconStyle: 'text-blue-600 dark:text-blue-400',
            countColor: 'text-blue-600 dark:text-blue-400',
          },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = statusCardFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setStatusCardFilter(isActive ? 'ALL' : card.key);
                setCurrentPage(1);
              }}
              className={`text-left rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-colors ${
                isActive
                  ? card.activeBorder
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.iconStyle}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-semibold tracking-tight tabular-nums ${card.countColor}`}>
                  {card.count.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">{card.pct}%</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">{card.subtitle}</span>
                {isActive && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">Active</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Saved Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 mr-1">
            <Bookmark className="h-3.5 w-3.5" />
            Views
          </span>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusCardFilter === 'ALL' &&
              categoryColorFilter === 'ALL' &&
              !minAge &&
              selectedPollingStationFilter.length === 0 &&
              !selectedFamilyFilter
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            All scoped ({voters.length})
          </button>
          {savedFilters.map((sf) => (
            <button
              key={sf.id}
              type="button"
              onClick={() => {
                handleClearAllFilters();
                if (sf.status) setStatusCardFilter(sf.status);
                if (sf.category) setCategoryColorFilter(sf.category);
                if (sf.pollingStationIds) setSelectedPollingStationFilter(sf.pollingStationIds);
                if (sf.minAge) setMinAge(String(sf.minAge));
                if (sf.maxAge) setMaxAge(String(sf.maxAge));
              }}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 whitespace-nowrap transition-colors"
            >
              {sf.name}
            </button>
          ))}
          {selectedFamilyFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400 px-2.5 py-1 text-xs font-medium">
              Family {familyMap.get(selectedFamilyFilter)?.familyCode || selectedFamilyFilter}
              <button type="button" onClick={() => setSelectedFamilyFilter(null)} aria-label="Clear family filter">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            placeholder="Save view as..."
            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 w-36 focus:border-blue-600 focus:outline-none"
          />
          <button
            type="button"
            disabled={!newFilterName.trim()}
            onClick={() => {
              saveCustomFilter({
                name: newFilterName.trim(),
                status: statusCardFilter,
                category: categoryColorFilter,
                pollingStationIds: selectedPollingStationFilter.length > 0 ? selectedPollingStationFilter : undefined,
                minAge: minAge && Number.isFinite(Number(minAge)) ? Number(minAge) : undefined,
                maxAge: maxAge && Number.isFinite(Number(maxAge)) ? Number(maxAge) : undefined,
              });
              setNewFilterName('');
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 whitespace-nowrap"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Search & Scoped Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, house no, or EPIC..."
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Polling Station Multi-Select Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPsMultiSelect((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {selectedPollingStationFilter.length === 0
                    ? `All stations (${scopedPollingStations.length})`
                    : `${selectedPollingStationFilter.length} selected`}
                </span>
              </button>
              {showPsMultiSelect && (
                <div className="absolute left-0 mt-1.5 z-30 w-72 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Polling stations ({scopedPollingStations.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPollingStationFilter([])}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      All
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {scopedPollingStations.map((ps) => {
                      const checked = selectedPollingStationFilter.includes(ps.id);
                      return (
                        <label
                          key={ps.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedPollingStationFilter(
                                checked
                                  ? selectedPollingStationFilter.filter((id) => id !== ps.id)
                                  : [...selectedPollingStationFilter, ps.id]
                              );
                              setCurrentPage(1);
                            }}
                            className="rounded border-slate-300 dark:border-zinc-600 text-blue-600"
                          />
                          <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">PS-{ps.psNo}</span>
                          <span className="text-slate-600 dark:text-zinc-400 truncate">{ps.name.replace(/^31\/\d+\s*/, '')}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPsMultiSelect(false)}
                      className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Village Quick Filter */}
            <select
              value={villageFilter}
              onChange={(e) => {
                setVillageFilter(e.target.value);
                setVillagePartFilter('ALL');
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All {villages.length} villages</option>
              {villages.map((vil) => (
                <option key={vil.id} value={vil.id}>
                  {vil.name} ({vil.code})
                </option>
              ))}
            </select>

            {/* Pure Color Dots Filter */}
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-2">
              {VOTER_CATEGORIES.map((cat) => {
                const st = getVoterCategoryStyles(cat);
                const isSelected = categoryColorFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-label="Filter by color"
                    onClick={() => {
                      setCategoryColorFilter(isSelected ? 'ALL' : cat);
                      setCurrentPage(1);
                    }}
                    className={`h-3.5 w-3.5 rounded-full transition-transform ${st.dot} ${
                      isSelected ? 'scale-125 ring-2 ring-offset-1 dark:ring-offset-zinc-950 ring-slate-900 dark:ring-zinc-100' : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
              {categoryColorFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryColorFilter('ALL');
                    setCurrentPage(1);
                  }}
                  aria-label="Reset color filter"
                  className="ml-0.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersPanel((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                showFiltersPanel
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              More filters
            </button>

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          {/* Right: Column Show/Hide Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
            >
              <Columns className="h-3.5 w-3.5" />
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 z-30 w-52 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xl space-y-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 pb-1.5 border-b border-slate-100 dark:border-zinc-800">
                  Show or hide columns
                </div>
                {(Object.keys(visibleCols) as Array<keyof typeof visibleCols>).map((colKey) => (
                  <label key={colKey} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols[colKey]}
                      onChange={() => setVisibleCols((prev) => ({ ...prev, [colKey]: !prev[colKey] }))}
                      className="rounded border-slate-300 dark:border-zinc-600 text-blue-600"
                    />
                    <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Filter Drawer Panel */}
        {showFiltersPanel && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs">
            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Leikai / part</label>
              <select
                value={villagePartFilter}
                onChange={(e) => setVillagePartFilter(e.target.value)}
                className={inputClass}
              >
                <option value="ALL">All parts</option>
                {villageParts
                  .filter((vp) => villageFilter === 'ALL' || vp.villageId === villageFilter)
                  .map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.name} (PS-{vp.partNo})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as Gender | 'ALL')}
                className={inputClass}
              >
                <option value="ALL">All</option>
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="O">Other (O)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Age range</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="18"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  className={`${inputClass} w-1/2 px-2 tabular-nums`}
                />
                <input
                  type="number"
                  placeholder="99"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className={`${inputClass} w-1/2 px-2 tabular-nums`}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Tag</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className={inputClass}
              >
                <option value="ALL">Any tag</option>
                {availableTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Assigned worker</label>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className={inputClass}
              >
                <option value="ALL">All workers</option>
                {users
                  .filter((u) => u.role === 'Field Worker')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-500 dark:text-zinc-400 mb-1">Issue type</label>
              <select
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value as IssueType | 'ALL')}
                className={inputClass}
              >
                <option value="ALL">All types</option>
                {issueTypes.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-zinc-300 font-medium">
                <input
                  type="checkbox"
                  checked={newlyImportedOnly}
                  onChange={(e) => setNewlyImportedOnly(e.target.checked)}
                  className="rounded border-slate-300 dark:border-zinc-600 text-blue-600"
                />
                <span>Newly imported</span>
              </label>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar when rows are selected */}
        {selectedRowIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 dark:bg-zinc-800 border border-slate-800 dark:border-zinc-700 px-4 py-2.5 text-white text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{selectedRowIds.length} selected</span>
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="text-slate-300 hover:text-white underline"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEditVoter && (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 dark:bg-zinc-900 border border-slate-700 px-2.5 py-1.5">
                    {VOTER_CATEGORIES.map((cat) => {
                      const st = getVoterCategoryStyles(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          aria-label="Apply color to selected"
                          onClick={() => bulkUpdateVoters(selectedRowIds, { category: cat })}
                          className={`h-3.5 w-3.5 rounded-full ${st.dot} ring-1 ring-white/40 hover:scale-125 transition-transform`}
                        />
                      );
                    })}
                  </div>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      bulkUpdateVoters(selectedRowIds, { status: e.target.value as VoterStatus });
                      e.target.value = '';
                    }}
                    className="rounded-lg bg-slate-800 dark:bg-zinc-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="" disabled>
                      Set status
                    </option>
                    <option value="Verified">Mark verified</option>
                    <option value="Pending">Mark pending</option>
                    <option value="Issues">Mark issue</option>
                  </select>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      bulkUpdateVoters(selectedRowIds, { assignedWorkerId: e.target.value });
                      e.target.value = '';
                    }}
                    className="rounded-lg bg-slate-800 dark:bg-zinc-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="" disabled>
                      Assign worker
                    </option>
                    {users
                      .filter((u) => u.role === 'Field Worker')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      bulkUpdateVoters(selectedRowIds, { addTag: e.target.value });
                      e.target.value = '';
                    }}
                    className="rounded-lg bg-slate-800 dark:bg-zinc-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="" disabled>
                      Add tag
                    </option>
                    {availableTags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowBulkMoveModal(true)}
                    className="rounded-lg bg-slate-800 dark:bg-zinc-900 border border-slate-700 px-3 py-1.5 hover:bg-slate-700 dark:hover:bg-zinc-700 whitespace-nowrap"
                  >
                    Move station
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkNotifyModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500 whitespace-nowrap"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    <span>Notify ({selectedRowIds.length})</span>
                  </button>
                </>
              )}

              {canRequestExport && (
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-500 whitespace-nowrap"
                >
                  Export selected
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Search Banner */}
      {globalSearch.trim() && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Matching{' '}
              <span className="font-medium">
                {searchScope === 'name'
                  ? 'name'
                  : searchScope === 'houseNo'
                  ? 'house number'
                  : searchScope === 'voterId'
                  ? 'EPIC / voter ID'
                  : 'all fields'}
              </span>{' '}
              for <strong className="font-semibold">&ldquo;{globalSearch.trim()}&rdquo;</strong>{' '}
              <span className="tabular-nums">({filteredVoters.length} found)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-white dark:bg-zinc-900 p-0.5 border border-blue-200 dark:border-zinc-700 text-xs">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'name', label: 'Name' },
                  { id: 'houseNo', label: 'House no' },
                  { id: 'voterId', label: 'Voter ID' },
                ] as const
              ).map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setSearchScope(scope.id)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    searchScope === scope.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-800"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* View Switcher & Activity Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => {
                setViewMode('expanded');
                setPageSize(70);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                viewMode === 'expanded'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Expanded grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setPageSize(25);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List view</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <span>Rows</span>
            <select
              value={safePageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next > 0) {
                  setPageSize(next);
                  setCurrentPage(1);
                }
              }}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 tabular-nums"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={70}>70</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Activity Filter Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'meeting' as const, label: 'Meeting', dot: 'bg-red-500', activeBg: 'bg-red-600 text-white border-red-600' },
            { id: 'notes' as const, label: 'Notes', dot: 'bg-amber-500', activeBg: 'bg-amber-600 text-white border-amber-600' },
            { id: 'followup' as const, label: 'Follow-up', dot: 'bg-blue-600', activeBg: 'bg-blue-600 text-white border-blue-600' },
            { id: 'completed' as const, label: 'Completed', dot: 'bg-emerald-500', activeBg: 'bg-emerald-600 text-white border-emerald-600' },
          ].map((item) => {
            const active = activityLegendFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivityLegendFilter((prev) => (prev === item.id ? 'ALL' : item.id))}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? item.activeBg
                    : 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : item.dot}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {activityLegendFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActivityLegendFilter('ALL')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {viewMode === 'expanded' ? (
        <div className="space-y-4">
          {/* 10-Column Grid of Voter Slip Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {paginatedVoters.map((voter) => {
              const isSelected = selectedVoterId === voter.id;
              const isRowSelected = selectedRowIds.includes(voter.id);
              const currentCategory = normalizeVoterCategory(voter.category || voter.colorState);
              const notesCount = noteCountMap.get(voter.id) || 0;
              const tasksCount = taskCountMap.get(voter.id) || 0;
              const hasMeeting = tasksCount > 0 && tasks.some((t) => t.voterId === voter.id && t.type === 'Meeting');
              const hasFollowup = tasksCount > 0 && tasks.some((t) => t.voterId === voter.id && t.type !== 'Meeting');
              const isCompleted = voter.status === 'Verified';

              const slipBgClass =
                currentCategory === VoterCategory.Opponent
                  ? 'bg-red-50/75 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/50'
                  : currentCategory === VoterCategory.Pending
                  ? 'bg-amber-50/75 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50'
                  : currentCategory === VoterCategory.Voter
                  ? 'bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50'
                  : currentCategory === VoterCategory.Worker
                  ? 'bg-blue-50/75 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800';

              return (
                <div
                  key={voter.id}
                  onClick={() => setSelectedVoterId(voter.id)}
                  className={`group relative rounded-xl border p-2.5 text-left cursor-pointer transition-all hover:border-slate-400 dark:hover:border-zinc-600 ${slipBgClass} ${
                    isSelected ? 'ring-2 ring-blue-600 border-blue-600' : ''
                  }`}
                >
                  {/* Top row: Checkbox, Serial Number, Context button */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => toggleRowSelect(voter.id)}
                        className="rounded border-slate-300 dark:border-zinc-600 text-blue-600 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300 tabular-nums">
                        {Number.isFinite(voter.serialNo) ? voter.serialNo : '-'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoterId(voter.id);
                      }}
                      aria-label="Open voter details"
                      className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-0.5 rounded"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </div>

                  {/* EPIC Number */}
                  <div className="font-mono text-[11px] font-medium tracking-tight text-slate-600 dark:text-zinc-400 truncate">
                    {voter.epicNo}
                  </div>

                  {/* Voter Name: Strictly neutral text */}
                  <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2 min-h-[32px] mt-0.5">
                    {voter.name}
                  </div>

                  {/* Age & Gender */}
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 tabular-nums">
                    {Number.isFinite(voter.age) ? voter.age : '-'} {voter.gender}
                  </div>

                  {/* 4 Bottom Activity Icons */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-black/5 dark:border-white/10 mt-1.5">
                    <span
                      title={hasMeeting ? 'Meeting scheduled' : 'No meeting'}
                      className={`h-4 w-4 rounded flex items-center justify-center ${
                        hasMeeting
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100/70 dark:bg-red-950/50 text-red-500 dark:text-red-400 opacity-35'
                      }`}
                    >
                      <Calendar className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={notesCount > 0 ? `${notesCount} notes` : 'No notes'}
                      className={`h-4 w-4 rounded flex items-center justify-center ${
                        notesCount > 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 opacity-35'
                      }`}
                    >
                      <FileText className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={hasFollowup ? 'Follow-up required' : 'No follow-up'}
                      className={`h-4 w-4 rounded flex items-center justify-center ${
                        hasFollowup
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100/70 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 opacity-35'
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={isCompleted ? 'Verified' : 'Pending verification'}
                      className={`h-4 w-4 rounded flex items-center justify-center ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 opacity-35'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state for grid */}
          {paginatedVoters.length === 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-xs text-slate-500 dark:text-zinc-400">
              No voter records match the current filters. Clear filters to view all scoped records.
            </div>
          )}

          {/* Expanded View Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                {filteredVoters.length === 0 ? 0 : (safePage - 1) * safePageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                {Math.min(safePage * safePageSize, filteredVoters.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{filteredVoters.length}</span> voters
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                      safePage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 7 && (
                <>
                  <span className="px-1 text-slate-400 dark:text-zinc-500">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                      safePage === totalPages
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* List View Table */
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 text-xs font-medium text-slate-500 dark:text-zinc-400">
                  <th className="py-3 pl-4 pr-2 w-9">
                    <input
                      type="checkbox"
                      checked={
                        paginatedVoters.length > 0 &&
                        paginatedVoters.every((v) => selectedRowIds.includes(v.id))
                      }
                      onChange={toggleSelectAllOnPage}
                      className="rounded border-slate-300 dark:border-zinc-600 text-blue-600"
                    />
                  </th>
                  <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleSort('serialNo')}>
                    <div className="inline-flex items-center gap-1">
                      <span>#</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {visibleCols.status && (
                    <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleSort('status')}>
                      <div className="inline-flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  {visibleCols.name && (
                    <th className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleSort('name')}>
                      <div className="inline-flex items-center gap-1">
                        <span>Voter name</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  {visibleCols.epicNo && (
                    <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleSort('epicNo')}>
                      <div className="inline-flex items-center gap-1">
                        <span>EPIC ID</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  {visibleCols.houseNo && <th className="py-3 px-2.5">House no</th>}
                  {visibleCols.village && <th className="py-3 px-2.5">Village</th>}
                  {visibleCols.villagePart && <th className="py-3 px-2.5">Leikai / part</th>}
                  {visibleCols.pollingStation && (
                    <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleSort('pollingStationId')}>
                      <div className="inline-flex items-center gap-1">
                        <span>Station</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  {visibleCols.familyId && <th className="py-3 px-2.5">Family</th>}
                  {visibleCols.fatherName && <th className="py-3 px-2.5">Father</th>}
                  {visibleCols.motherName && <th className="py-3 px-2.5">Mother</th>}
                  {visibleCols.spouseName && <th className="py-3 px-2.5">Spouse</th>}
                  {visibleCols.age && (
                    <th className="py-3 px-2 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100 text-right" onClick={() => handleSort('age')}>
                      <div className="inline-flex items-center justify-end gap-1">
                        <span>Age</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  {visibleCols.gender && <th className="py-3 px-2 text-center">Sex</th>}
                  {visibleCols.phone && <th className="py-3 px-2.5">Phone</th>}
                  {visibleCols.activity && <th className="py-3 px-2.5 text-center">Activity</th>}
                  <th className="py-3 pl-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                {paginatedVoters.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                      No voter records match the current filters. Clear filters to reset.
                    </td>
                  </tr>
                ) : (
                  paginatedVoters.map((voter, idx) => {
                    const village = villageMap.get(voter.villageId);
                    const vp = villagePartMap.get(voter.villagePartId);
                    const ps = psMap.get(voter.pollingStationId);
                    const fam = familyMap.get(voter.familyId);
                    const openNotes = noteCountMap.get(voter.id) || 0;
                    const openTasks = taskCountMap.get(voter.id) || 0;
                    const sentNotifs = notificationCountMap.get(voter.id) || 0;
                    const isSelected = selectedRowIds.includes(voter.id);
                    const currentCategory = normalizeVoterCategory(voter.category || voter.colorState);
                    const colorStyles = getVoterCategoryStyles(currentCategory);

                    return (
                      <tr
                        key={voter.id}
                        onClick={() => setSelectedVoterId(voter.id)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            : idx % 2 === 1
                            ? 'bg-slate-50/50 dark:bg-zinc-950/30 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                            : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <td
                          className="py-2.5 pl-4 pr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelect(voter.id)}
                            className="rounded border-slate-300 dark:border-zinc-600 text-blue-600"
                          />
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                          {Number.isFinite(voter.serialNo) ? voter.serialNo : '-'}
                        </td>
                        {visibleCols.status && (
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <span className={`font-medium ${statusTextClass[voter.status]}`}>
                              {voter.status}
                            </span>
                            {voter.status === 'Issues' && voter.issueType && (
                              <span className="ml-1 text-xs text-red-600 dark:text-red-400">· {voter.issueType}</span>
                            )}
                          </td>
                        )}
                        {visibleCols.name && (
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {canEditVoter ? (
                                  <div className="inline-flex items-center gap-1">
                                    {VOTER_CATEGORIES.map((cat) => {
                                      const st = getVoterCategoryStyles(cat);
                                      const isCurrent = currentCategory === cat;
                                      return (
                                        <button
                                          key={cat}
                                          type="button"
                                          aria-label="Set row color"
                                          onClick={() => {
                                            if (!isCurrent) {
                                              updateVoter(voter.id, { category: cat });
                                            }
                                          }}
                                          className={`rounded-full transition-all ${st.dot} ${
                                            isCurrent
                                              ? 'h-3 w-3 ring-2 ring-offset-1 dark:ring-offset-zinc-900 ring-slate-400 dark:ring-zinc-500'
                                              : 'h-2 w-2 opacity-25 group-hover:opacity-75 hover:opacity-100 hover:scale-125'
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorStyles.dot}`} />
                                )}
                              </div>
                              <span>{voter.name}</span>
                            </div>
                            {voter.tags.length > 0 && (
                              <div className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 pl-5">
                                {voter.tags.join(' · ')}
                              </div>
                            )}
                          </td>
                        )}
                        {visibleCols.epicNo && (
                          <td className="py-2.5 px-2.5 font-mono text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                            {voter.epicNo}
                          </td>
                        )}
                        {visibleCols.houseNo && (
                          <td className="py-2.5 px-2.5 font-mono text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                            {voter.houseNo || '-'}
                          </td>
                        )}
                        {visibleCols.village && (
                          <td className="py-2.5 px-2.5 text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                            {village?.name || '-'}
                          </td>
                        )}
                        {visibleCols.villagePart && (
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                            {vp?.name || '-'}
                          </td>
                        )}
                        {visibleCols.pollingStation && (
                          <td className="py-2.5 px-2.5 font-mono font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                            PS-{Number.isFinite(ps?.psNo) ? ps?.psNo : Number.isFinite(voter.partNo) ? voter.partNo : '-'}
                          </td>
                        )}
                        {visibleCols.familyId && (
                          <td
                            className="py-2.5 px-2.5 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFamilyFilter(
                                selectedFamilyFilter === voter.familyId ? null : voter.familyId
                              );
                            }}
                          >
                            <span className="font-mono text-blue-600 dark:text-blue-400 hover:underline font-medium">
                              {fam?.familyCode || voter.familyId}
                            </span>
                          </td>
                        )}
                        {visibleCols.fatherName && (
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">{voter.fatherName}</td>
                        )}
                        {visibleCols.motherName && (
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">{voter.motherName}</td>
                        )}
                        {visibleCols.spouseName && (
                          <td
                            className="py-2.5 px-2.5 whitespace-nowrap"
                            onClick={(e) => {
                              if (voter.spouseVoterId) {
                                e.stopPropagation();
                                setSelectedVoterId(voter.spouseVoterId);
                              }
                            }}
                          >
                            {voter.spouseName ? (
                              voter.spouseVoterId ? (
                                <span className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                  {voter.spouseName}
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-zinc-400">{voter.spouseName}</span>
                              )
                            ) : (
                              <span className="text-slate-300 dark:text-zinc-600">-</span>
                            )}
                          </td>
                        )}
                        {visibleCols.age && (
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-zinc-300 tabular-nums">
                            {Number.isFinite(voter.age) ? voter.age : '-'}
                          </td>
                        )}
                        {visibleCols.gender && (
                          <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-zinc-400">
                            {voter.gender}
                          </td>
                        )}
                        {visibleCols.phone && (
                          <td className="py-2.5 px-2.5 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                            {maskPhoneNumber(voter.phone, revealFullPhone)}
                          </td>
                        )}
                        {visibleCols.activity && (
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            {openNotes === 0 && openTasks === 0 && sentNotifs === 0 ? (
                              <span className="text-slate-300 dark:text-zinc-600">-</span>
                            ) : (
                              <div
                                className="inline-flex items-center gap-2 text-slate-600 dark:text-zinc-400"
                                title={`${openNotes} notes, ${openTasks} open tasks, ${sentNotifs} notifications`}
                              >
                                {sentNotifs > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono text-xs tabular-nums">
                                    <BellRing className="h-3.5 w-3.5" />
                                    {sentNotifs}
                                  </span>
                                )}
                                {openNotes > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-mono text-xs tabular-nums">
                                    <FileText className="h-3.5 w-3.5" />
                                    {openNotes}
                                  </span>
                                )}
                                {openTasks > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-mono text-xs tabular-nums">
                                    <CheckSquare className="h-3.5 w-3.5" />
                                    {openTasks}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        <td
                          className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openIndividualNotifyModal(voter)}
                              title={`Notify ${voter.name}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-medium transition-colors"
                            >
                              <BellRing className="h-3 w-3" />
                              <span>Notify</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedVoterId(voter.id)}
                              title="Open voter drawer"
                              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFamilyFilter(voter.familyId);
                                setActiveTab('family-view');
                              }}
                              title="View household"
                              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                  {filteredVoters.length === 0 ? 0 : (safePage - 1) * safePageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                  {Math.min(safePage * safePageSize, filteredVoters.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{filteredVoters.length}</span> voters
              </span>

              <select
                value={safePageSize}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next) && next > 0) {
                    setPageSize(next);
                    setCurrentPage(1);
                  }
                }}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 tabular-nums"
              >
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 whitespace-nowrap"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-xs text-slate-700 dark:text-zinc-300 tabular-nums">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 whitespace-nowrap"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Side Voter Details Drawer */}
      <VoterDrawer filteredVoterIds={filteredVoterIds} />

      {/* Bulk Move Polling Station Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                Move {selectedRowIds.length} voter(s) to polling station
              </h3>
              <button type="button" onClick={() => setShowBulkMoveModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Moving voters across stations requires a reason and records an immutable audit event.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Target polling station
                </label>
                <select
                  value={bulkMovePsId}
                  onChange={(e) => setBulkMovePsId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select polling station...</option>
                  {scopedPollingStations.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      PS-{ps.psNo} {ps.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Audit reason</label>
                <input
                  type="text"
                  value={bulkMoveReason}
                  onChange={(e) => setBulkMoveReason(e.target.value)}
                  placeholder="ECI part boundary correction or household shift"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkMovePsId || !bulkMoveReason.trim()}
                onClick={() => {
                  bulkUpdateVoters(selectedRowIds, {
                    moveToPollingStationId: bulkMovePsId,
                    moveReason: bulkMoveReason.trim(),
                  });
                  setShowBulkMoveModal(false);
                  setBulkMovePsId('');
                  setBulkMoveReason('');
                  setSelectedRowIds([]);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
              >
                Confirm move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Voter Modal */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Add voter record</h3>
              <button type="button" onClick={() => setShowAddVoterModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">EPIC number (3 letters + 7 digits)</label>
                <input
                  type="text"
                  value={newVoterForm.epicNo}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, epicNo: e.target.value.toUpperCase() }))}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Full name</label>
                <input
                  type="text"
                  value={newVoterForm.name}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Thokchom Mangibabu Singh"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Father&apos;s name</label>
                <input
                  type="text"
                  value={newVoterForm.fatherName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, fatherName: e.target.value }))}
                  placeholder="Thokchom Ibohal Singh"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Mother&apos;s name</label>
                <input
                  type="text"
                  value={newVoterForm.motherName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, motherName: e.target.value }))}
                  placeholder="Thokchom Jamuna Devi"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Spouse&apos;s name (optional)</label>
                <input
                  type="text"
                  value={newVoterForm.spouseName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, spouseName: e.target.value }))}
                  placeholder="Thokchom Ibemhal Devi"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">House number</label>
                <input
                  type="text"
                  value={newVoterForm.houseNo}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, houseNo: e.target.value }))}
                  placeholder="H.No. 42/A"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Age (18+)</label>
                  <input
                    type="number"
                    min={18}
                    value={Number.isFinite(newVoterForm.age) ? newVoterForm.age : 18}
                    onChange={(e) => {
                      const nextAge = Number(e.target.value);
                      setNewVoterForm((p) => ({ ...p, age: Number.isFinite(nextAge) ? nextAge : 18 }));
                    }}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Gender</label>
                  <select
                    value={newVoterForm.gender}
                    onChange={(e) => setNewVoterForm((p) => ({ ...p, gender: e.target.value as Gender }))}
                    className={inputClass}
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Phone number</label>
                <input
                  type="text"
                  value={newVoterForm.phone}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, phone: e.target.value }))}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Color</label>
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2">
                  {VOTER_CATEGORIES.map((cat) => {
                    const st = getVoterCategoryStyles(cat);
                    const isSelected = newVoterForm.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-label="Select color"
                        onClick={() => setNewVoterForm((p) => ({ ...p, category: cat }))}
                        className={`h-4 w-4 rounded-full transition-transform ${st.dot} ${
                          isSelected ? 'scale-125 ring-2 ring-offset-1 dark:ring-offset-zinc-950 ring-slate-900 dark:ring-zinc-100' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Village part and station ({villageParts.length} in scope)
                </label>
                <select
                  value={
                    villageParts.some((vp) => vp.id === newVoterForm.villagePartId)
                      ? newVoterForm.villagePartId
                      : villageParts[0]?.id || 'vp-1'
                  }
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, villagePartId: e.target.value }))}
                  className={inputClass}
                >
                  {villageParts.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.name} (PS-{vp.partNo})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVoterModal(false)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newVoterForm.name.trim() || !/^[A-Z]{3}[0-9]{7}$/.test(newVoterForm.epicNo)}
                onClick={() => {
                  const vp = villageParts.find((p) => p.id === newVoterForm.villagePartId) || villageParts[0];
                  if (!vp) return;
                  const houseNoVal = newVoterForm.houseNo.trim() || 'H.No. 1';
                  const fam =
                    families.find((f) => f.villagePartId === vp.id && f.address.startsWith(houseNoVal)) ||
                    families.find((f) => f.villagePartId === vp.id);
                  const targetFamilyId = fam ? fam.id : `fam-${vp.partNo}-${Date.now().toString().slice(-4)}`;
                  createVoter({
                    epicNo: newVoterForm.epicNo,
                    name: newVoterForm.name.trim(),
                    fatherName: newVoterForm.fatherName.trim() || 'Not recorded',
                    motherName: newVoterForm.motherName.trim() || 'Not recorded',
                    spouseName: newVoterForm.spouseName.trim() || undefined,
                    houseNo: houseNoVal,
                    age: Math.max(18, Number.isFinite(Number(newVoterForm.age)) ? Math.round(Number(newVoterForm.age)) : 18),
                    gender: newVoterForm.gender,
                    phone: newVoterForm.phone,
                    familyId: targetFamilyId,
                    partNo: vp.partNo,
                    serialNo: voters.length + 1,
                    villageId: vp.villageId,
                    villagePartId: vp.id,
                    pollingStationId: vp.pollingStationId,
                    addressId: `${houseNoVal}, ${vp.name}`,
                    status: newVoterForm.status,
                    category: newVoterForm.category,
                    tags: ['Manual Entry'],
                    assignedWorkerId: currentUser.id,
                  });
                  setNewVoterForm((p) => ({
                    ...p,
                    epicNo: '',
                    name: '',
                    fatherName: '',
                    motherName: '',
                    spouseName: '',
                    phone: '',
                    houseNo: '',
                    villagePartId: vp.id,
                  }));
                  setShowAddVoterModal(false);
                }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
              >
                Create voter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Approval & Audit Log Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Approval-gated voter export</h3>
              <button type="button" onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Every personal data export requires coordinator approval, carries the requester identity watermark, and is logged in the audit trail.
            </p>
            <div className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 text-xs space-y-1">
              <div>
                <span className="text-slate-500 dark:text-zinc-400">Records in scope </span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                  {selectedRowIds.length > 0 ? selectedRowIds.length : filteredVoters.length} voters
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-zinc-400">Filter scope </span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  {statusCardFilter === 'ALL' ? 'All statuses' : statusCardFilter} ·{' '}
                  {selectedPollingStationFilter.length === 0
                    ? 'All scoped stations'
                    : `${selectedPollingStationFilter.length} station(s)`}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Official purpose for export</label>
              <input
                type="text"
                value={exportReason}
                onChange={(e) => setExportReason(e.target.value)}
                placeholder="Booth verification sheets for field team"
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!exportReason.trim()}
                onClick={() => {
                  const targetList =
                    selectedRowIds.length > 0
                      ? filteredVoters.filter((v) => selectedRowIds.includes(v.id))
                      : filteredVoters;
                  requestDataExport(
                    `${statusCardFilter} Voters (${targetList.length} records)`,
                    targetList.length,
                    exportReason.trim()
                  );
                  const csvRows = [
                    ['# WATERMARK: AC-31 THOUBAL OFFICIAL EXPORT', `TIMESTAMP: ${new Date().toISOString()}`, `REASON: ${exportReason.trim()}`],
                    ['SerialNo', 'EPIC', 'Name', 'FatherName', 'MotherName', 'Age', 'Gender', 'Status', 'PollingStation', 'FamilyID'],
                    ...targetList.map((v) => [
                      v.serialNo,
                      v.epicNo,
                      `"${v.name}"`,
                      `"${v.fatherName}"`,
                      `"${v.motherName}"`,
                      v.age,
                      v.gender,
                      v.status,
                      v.pollingStationId,
                      v.familyId,
                    ]),
                  ]
                    .map((r) => r.join(','))
                    .join('\n');
                  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AC31_Thoubal_Voters_Export_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setShowExportModal(false);
                  setExportReason('');
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
              >
                Log and export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Voter Notification Modal */}
      {activeNotifyVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-black/65 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Voter notification</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">{activeNotifyVoter.name}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 tabular-nums">
                  {activeNotifyVoter.epicNo} · Part {Number.isFinite(activeNotifyVoter.partNo) ? activeNotifyVoter.partNo : '-'} · Sl. {Number.isFinite(activeNotifyVoter.serialNo) ? activeNotifyVoter.serialNo : '-'} ·{' '}
                  {maskPhoneNumber(activeNotifyVoter.phone, revealFullPhone)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotifyVoterId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channel Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Delivery channel</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
                    { id: 'SMS', label: 'SMS text', icon: Send },
                    { id: 'Voice Call', label: 'Voice alert', icon: PhoneCall },
                    { id: 'Field Slip', label: 'Doorstep slip', icon: Printer },
                  ] as { id: NotificationChannel; label: string; icon: React.ComponentType<{ className?: string }> }[]
                ).map((ch) => {
                  const Icon = ch.icon;
                  const active = notifChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setNotifChannel(ch.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Preset Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Notification template</label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'Polling Slip',
                    'Verification Reminder',
                    'Booth Update',
                    'Custom Message',
                  ] as NotificationTemplateType[]
                ).map((tpl) => {
                  const active = notifTemplate === tpl;
                  return (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => {
                        setNotifTemplate(tpl);
                        const ps = psMap.get(activeNotifyVoter.pollingStationId);
                        const generated = buildVoterNotificationTemplate(activeNotifyVoter, tpl, ps?.name);
                        setNotifSubject(generated.subject);
                        setNotifMessage(generated.message);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {tpl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject & Message Body */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={notifSubject}
                  onChange={(e) => setNotifSubject(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Message</label>
                <textarea
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className={`${inputClass} p-3 leading-relaxed`}
                />
              </div>
            </div>

            {/* Recent Notification History */}
            {(() => {
              const history = voterNotifications.filter((n) => n.voterId === activeNotifyVoter.id);
              return (
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                    <span>Dispatch history ({history.length})</span>
                    <span className="font-mono text-slate-400 dark:text-zinc-500">{activeNotifyVoter.epicNo}</span>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 py-1">No notifications sent to this voter yet.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900 dark:text-zinc-100">
                              {item.channel} · {item.templateType}
                            </span>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">{item.message}</p>
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                            <span>By {item.sentByName}</span>
                            <span className="tabular-nums">
                              {new Date(item.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveNotifyVoterId(null)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!canEditVoter || !notifMessage.trim()}
                onClick={() => {
                  sendVoterNotification({
                    voterId: activeNotifyVoter.id,
                    channel: notifChannel,
                    templateType: notifTemplate,
                    subject: notifSubject,
                    message: notifMessage,
                  });
                  setActiveNotifyVoterId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send to {activeNotifyVoter.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Individual Voter Notification Modal */}
      {showBulkNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-black/65 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                Notify {selectedRowIds.length} selected voter(s)
              </h3>
              <button type="button" onClick={() => setShowBulkNotifyModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Each selected voter receives a personalized notification with their EPIC number, part number, serial number, and polling station.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Delivery channel</label>
                <select
                  value={bulkNotifChannel}
                  onChange={(e) => setBulkNotifChannel(e.target.value as NotificationChannel)}
                  className={inputClass}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS text</option>
                  <option value="Voice Call">Voice call alert</option>
                  <option value="Field Slip">Doorstep field slip</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Template type</label>
                <select
                  value={bulkNotifTemplate}
                  onChange={(e) => setBulkNotifTemplate(e.target.value as NotificationTemplateType)}
                  className={inputClass}
                >
                  <option value="Polling Slip">Polling slip (EPIC, booth and serial no)</option>
                  <option value="Verification Reminder">Household verification reminder</option>
                  <option value="Booth Update">Polling station location update</option>
                  <option value="Custom Message">Custom notice</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Additional note (optional)</label>
                <input
                  type="text"
                  value={bulkNotifNote}
                  onChange={(e) => setBulkNotifNote(e.target.value)}
                  placeholder="Appended to each personalized message..."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkNotifyModal(false)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sendBulkVoterNotifications({
                    voterIds: selectedRowIds,
                    channel: bulkNotifChannel,
                    templateType: bulkNotifTemplate,
                    customMessage: bulkNotifNote,
                  });
                  setShowBulkNotifyModal(false);
                  setBulkNotifNote('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send {selectedRowIds.length} notifications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
