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
  Users,
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

  // Base voters filtered by non-status filters so the 4 Status Cards show live counts for the current scope/filters
  const votersBeforeStatusCard = useMemo(() => {
    return voters.filter((v) => {
      if (selectedPollingStationFilter.length > 0 && !selectedPollingStationFilter.includes(v.pollingStationId)) {
        return false;
      }
      if (villageFilter !== 'ALL' && v.villageId !== villageFilter) return false;
      if (villagePartFilter !== 'ALL' && v.villagePartId !== villagePartFilter) return false;
      if (selectedFamilyFilter && v.familyId !== selectedFamilyFilter) return false;
      if (genderFilter !== 'ALL' && v.gender !== genderFilter) return false;
      if (minAge && v.age < Number(minAge)) return false;
      if (maxAge && v.age > Number(maxAge)) return false;
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

  // Live Status Card Totals (Always match the data!)
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
      if (sortField === 'serialNo') cmp = a.serialNo - b.serialNo;
      else if (sortField === 'age') cmp = a.age - b.age;
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'epicNo') cmp = a.epicNo.localeCompare(b.epicNo);
      else if (sortField === 'pollingStationId') cmp = a.partNo - b.partNo;
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
  }, [votersAfterStatusFilter, categoryColorFilter, activityLegendFilter, sortField, sortAsc, tasks, noteCountMap, taskCountMap]);

  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVoters = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredVoters.slice(start, start + pageSize);
  }, [filteredVoters, safePage, pageSize]);

  const filteredVoterIds = useMemo(() => filteredVoters.map((v) => v.id), [filteredVoters]);

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

  const statusChipClasses: Record<VoterStatus, string> = {
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Issues: 'bg-red-50 text-red-700 border-red-200',
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Removed: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  return (
    <div className="space-y-8">
      {/* Section Header matching NEXUS-31 layout */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Voter List - Part {selectedPollingStationFilter.length === 1 ? (psMap.get(selectedPollingStationFilter[0])?.psNo || 12) : selectedPollingStationFilter.length > 1 ? `${selectedPollingStationFilter.length} Parts` : '12'} ({viewMode === 'expanded' ? 'Expanded View' : 'List View'})
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Total Voters: <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{filteredVoters.length}</span>
            {' | '}Total Families: <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{new Set(filteredVoters.map((v) => v.familyId)).size}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-4 w-4 text-[#0071e3]" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 text-[#0071e3]" />
                <span>Full Screen</span>
              </>
            )}
          </button>
          {canEditVoter && (
            <button
              type="button"
              onClick={() => setShowAddVoterModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Voter</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Four Clickable Status Filter Cards (22px rounded corners, 20-24px titles, 13-14px captions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: 'Verified' as VoterStatus,
            label: 'Verified Voters',
            count: statusCounts.Verified,
            pct: statusCounts.total ? Math.round((statusCounts.Verified / statusCounts.total) * 100) : 0,
            subtitle: 'Confirmed on location with GPS',
            icon: CheckCircle2,
            activeRing: 'ring-2 ring-[#0071e3]',
            iconStyle: 'text-emerald-600',
            countColor: 'text-[#1d1d1f] dark:text-[#f5f5f7]',
          },
          {
            key: 'Pending' as VoterStatus,
            label: 'Pending Verification',
            count: statusCounts.Pending,
            pct: statusCounts.total ? Math.round((statusCounts.Pending / statusCounts.total) * 100) : 0,
            subtitle: 'Assigned to field workers',
            icon: Clock,
            activeRing: 'ring-2 ring-[#0071e3]',
            iconStyle: 'text-amber-600',
            countColor: 'text-[#1d1d1f] dark:text-[#f5f5f7]',
          },
          {
            key: 'Issues' as VoterStatus,
            label: 'Flagged Issues',
            count: statusCounts.Issues,
            pct: statusCounts.total ? Math.round((statusCounts.Issues / statusCounts.total) * 100) : 0,
            subtitle: 'Requires BLO resolution',
            icon: AlertTriangle,
            activeRing: 'ring-2 ring-[#ff3b30]',
            iconStyle: 'text-[#ff3b30]',
            countColor: 'text-[#ff3b30]',
          },
          {
            key: 'New' as VoterStatus,
            label: 'Newly Imported',
            count: statusCounts.New,
            pct: statusCounts.total ? Math.round((statusCounts.New / statusCounts.total) * 100) : 0,
            subtitle: 'Supplemental roll additions',
            icon: Sparkles,
            activeRing: 'ring-2 ring-[#0071e3]',
            iconStyle: 'text-[#0071e3]',
            countColor: 'text-[#0071e3]',
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
              className={`text-left rounded-[22px] border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] p-5 transition-all hover:shadow-md ${
                isActive ? card.activeRing : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#6e6e73] dark:text-[#a1a1a6]">{card.label}</span>
                <Icon className={`h-5 w-5 ${card.iconStyle}`} />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className={`text-[24px] font-semibold tracking-[-0.02em] tabular-nums ${card.countColor}`}>
                  {card.count.toLocaleString()}
                </span>
                <span className="text-[13px] font-normal text-[#6e6e73] dark:text-[#a1a1a6] tabular-nums">({card.pct}%)</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">{card.subtitle}</span>
                {isActive && (
                  <span className="text-[13px] font-semibold text-[#0071e3]">Filtered</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Saved Filters & Quick Views Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mr-1">
            <Bookmark className="h-3.5 w-3.5" />
            Saved Views:
          </span>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusCardFilter === 'ALL' &&
              categoryColorFilter === 'ALL' &&
              !minAge &&
              selectedPollingStationFilter.length === 0 &&
              !selectedFamilyFilter
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Scoped Voters ({voters.length})
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
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {sf.name}
            </button>
          ))}
          {selectedFamilyFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold">
              Family: {familyMap.get(selectedFamilyFilter)?.familyCode || selectedFamilyFilter}
              <button type="button" onClick={() => setSelectedFamilyFilter(null)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* Save current filter */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            placeholder="Save current filter as..."
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 w-40"
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
                minAge: minAge ? Number(minAge) : undefined,
                maxAge: maxAge ? Number(maxAge) : undefined,
              });
              setNewFilterName('');
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Search, Hierarchy Filters, and Action Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Fuzzy Search + Multi-select Polling Station + Village + Pure Color Dots Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by name, house number, or voter ID..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 focus:border-[#0071e3] focus:outline-none"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="h-3.5 w-3.5 text-[#0071e3]" />
                <span>
                  {selectedPollingStationFilter.length === 0
                    ? `All Stations (${scopedPollingStations.length})`
                    : `${selectedPollingStationFilter.length} Station(s) Selected`}
                </span>
              </button>
              {showPsMultiSelect && (
                <div className="absolute left-0 mt-1.5 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Select Polling Stations (PS 1–{scopedPollingStations.length})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPollingStationFilter([])}
                      className="text-[11px] text-[#0071e3] hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {scopedPollingStations.map((ps) => {
                      const checked = selectedPollingStationFilter.includes(ps.id);
                      return (
                        <label
                          key={ps.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer"
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
                            className="rounded border-slate-300 text-[#0071e3]"
                          />
                          <span className="font-mono font-semibold text-slate-800">PS-{ps.psNo}</span>
                          <span className="text-slate-600 truncate">{ps.name.replace(/^31\/\d+\s*/, '')}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPsMultiSelect(false)}
                      className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium"
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
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All 12 Villages</option>
              {villages.map((vil) => (
                <option key={vil.id} value={vil.id}>
                  {vil.name} ({vil.code})
                </option>
              ))}
            </select>

            {/* Pure Color Dots Filter (No text naming) */}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5">
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
                    className={`h-4 w-4 rounded-full transition-transform ${st.dot} ${
                      isSelected ? 'scale-125 ring-2 ring-offset-1 ring-slate-900' : 'opacity-75 hover:opacity-100'
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
                  className="ml-0.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersPanel((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                showFiltersPanel
                  ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              More Filters
            </button>

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          {/* Right: Column Show/Hide, Add Voter, Import, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Columns className="h-3.5 w-3.5" />
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-1.5 z-30 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                    Show / Hide Columns
                  </div>
                  {(Object.keys(visibleCols) as Array<keyof typeof visibleCols>).map((colKey) => (
                    <label key={colKey} className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleCols[colKey]}
                        onChange={() => setVisibleCols((prev) => ({ ...prev, [colKey]: !prev[colKey] }))}
                        className="rounded border-slate-300"
                      />
                      <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {canEditVoter && (
              <button
                type="button"
                onClick={() => setShowAddVoterModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Voter
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('import-data')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Expanded Filter Drawer Panel */}
        {showFiltersPanel && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Village Part (Leikai)</label>
              <select
                value={villagePartFilter}
                onChange={(e) => setVillagePartFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
              >
                <option value="ALL">All Leikais</option>
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
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as Gender | 'ALL')}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
              >
                <option value="ALL">All Genders</option>
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="O">Other (O)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Age Range (Min–Max)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="18"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-1.5 text-slate-800 tabular-nums"
                />
                <input
                  type="number"
                  placeholder="99"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-1.5 text-slate-800 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tag</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
              >
                <option value="ALL">Any Tag</option>
                {availableTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Assigned Worker</label>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
              >
                <option value="ALL">All Workers</option>
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
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Issue Type</label>
              <select
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value as IssueType | 'ALL')}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
              >
                <option value="ALL">All Issue Types</option>
                {issueTypes.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={newlyImportedOnly}
                  onChange={(e) => setNewlyImportedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-[#0071e3]"
                />
                <span>Newly Imported Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar when rows are selected */}
        {selectedRowIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-white text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{selectedRowIds.length} voter(s) selected</span>
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="text-slate-300 hover:text-white underline ml-2"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Pure Color Bulk Assignment (4 Color Dots, no text labels) */}
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5">
                {VOTER_CATEGORIES.map((cat) => {
                  const st = getVoterCategoryStyles(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-label="Apply color to selected"
                      onClick={() => bulkUpdateVoters(selectedRowIds, { category: cat })}
                      className={`h-4 w-4 rounded-full ${st.dot} ring-1 ring-white/40 hover:scale-125 transition-transform`}
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
                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="" disabled>
                  Bulk Change Status...
                </option>
                <option value="Verified">Mark Verified</option>
                <option value="Pending">Mark Pending</option>
                <option value="Issues">Mark Issue</option>
              </select>

              <select
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  bulkUpdateVoters(selectedRowIds, { assignedWorkerId: e.target.value });
                  e.target.value = '';
                }}
                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="" disabled>
                  Assign Field Worker...
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
                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="" disabled>
                  Add Tag...
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
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 hover:bg-slate-700"
              >
                Move to Polling Station
              </button>

              <button
                type="button"
                onClick={() => setShowBulkNotifyModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
              >
                <BellRing className="h-3.5 w-3.5" />
                <span>Notify Selected ({selectedRowIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="rounded-lg bg-[#0071e3] px-3 py-1.5 font-semibold text-white hover:bg-blue-600"
              >
                Export Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Search & Filter Banner */}
      {globalSearch.trim() && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#0071e3] shrink-0" />
            <span>
              Filtering by{' '}
              <span className="font-semibold text-slate-800">
                {searchScope === 'name'
                  ? 'Name'
                  : searchScope === 'houseNo'
                  ? 'House Number'
                  : searchScope === 'voterId'
                  ? 'Voter ID / EPIC'
                  : 'Name, House No, or Voter ID'}
              </span>
              :{' '}
              <strong className="font-semibold underline decoration-blue-400">&ldquo;{globalSearch.trim()}&rdquo;</strong>
              {' '}({filteredVoters.length} {filteredVoters.length === 1 ? 'record found' : 'records found'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-blue-200 text-[11px]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'name', label: 'Name' },
                  { id: 'houseNo', label: 'House No' },
                  { id: 'voterId', label: 'Voter ID' },
                ] as const
              ).map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setSearchScope(scope.id)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    searchScope === scope.id
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071e3] hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* View Switcher, Rows-per-page & Activity Status Legend from Reference Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Left: View Mode Toggle & Rows per page */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('expanded');
                setPageSize(70);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'expanded'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Expanded View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setPageSize(25);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={70}>70</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Activity Legend Badges from Reference Screenshot */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActivityLegendFilter((prev) => (prev === 'meeting' ? 'ALL' : 'meeting'))}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
              activityLegendFilter === 'meeting'
                ? 'bg-red-500 text-white border-red-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Meeting Scheduled</span>
          </button>

          <button
            type="button"
            onClick={() => setActivityLegendFilter((prev) => (prev === 'notes' ? 'ALL' : 'notes'))}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
              activityLegendFilter === 'notes'
                ? 'bg-amber-400 text-white border-amber-500 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActivityLegendFilter((prev) => (prev === 'followup' ? 'ALL' : 'followup'))}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
              activityLegendFilter === 'followup'
                ? 'bg-[#0071e3] text-white border-blue-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
            <span>Follow-up Required</span>
          </button>

          <button
            type="button"
            onClick={() => setActivityLegendFilter((prev) => (prev === 'completed' ? 'ALL' : 'completed'))}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
              activityLegendFilter === 'completed'
                ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Completed / No Pending</span>
          </button>

          {activityLegendFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActivityLegendFilter('ALL')}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Reset Legend
            </button>
          )}
        </div>
      </div>

      {viewMode === 'expanded' ? (
        <div className="space-y-4">
          {/* 10-Column Grid of Voter Slip Cards matching the Reference Screenshot */}
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

              // Soft pastel tint matching screenshot
              const pastelBgClass =
                currentCategory === VoterCategory.Opponent
                  ? 'bg-[#fee2e2]/75 dark:bg-red-950/30 border-red-200 dark:border-red-900/40'
                  : currentCategory === VoterCategory.Pending
                  ? 'bg-[#fef3c7]/75 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                  : currentCategory === VoterCategory.Voter
                  ? 'bg-[#d1fae5]/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                  : currentCategory === VoterCategory.Worker
                  ? 'bg-[#e0f2fe]/75 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';

              return (
                <div
                  key={voter.id}
                  onClick={() => setSelectedVoterId(voter.id)}
                  className={`group relative rounded-xl border p-2 text-left cursor-pointer transition-all hover:shadow-md ${pastelBgClass} ${
                    isSelected
                      ? 'ring-2 ring-red-500 border-red-500 shadow-md'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Top row: Checkbox, Serial Number, Context menu */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => toggleRowSelect(voter.id)}
                        className="rounded border-slate-300 text-[#0071e3] h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {voter.serialNo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoterId(voter.id);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </div>

                  {/* EPIC Number */}
                  <div className="font-mono text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-200 truncate">
                    {voter.epicNo}
                  </div>

                  {/* Voter Name: STRICTLY UNCOLORED (Neutral text) per user request */}
                  <div className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 min-h-[30px] mt-0.5">
                    {voter.name}
                  </div>

                  {/* Age & Gender */}
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {voter.age} {voter.gender}
                  </div>

                  {/* 4 Bottom Action / Status Icons from screenshot */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-black/5 dark:border-white/5 mt-1.5">
                    <span
                      title={hasMeeting ? 'Meeting Scheduled' : 'No Meeting'}
                      className={`h-4.5 w-4.5 rounded flex items-center justify-center text-[9px] ${
                        hasMeeting
                          ? 'bg-red-500 text-white font-bold shadow-xs'
                          : 'bg-red-100 dark:bg-red-950/40 text-red-400 opacity-30'
                      }`}
                    >
                      <Calendar className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={notesCount > 0 ? `${notesCount} Notes` : 'No Notes'}
                      className={`h-4.5 w-4.5 rounded flex items-center justify-center text-[9px] ${
                        notesCount > 0
                          ? 'bg-amber-400 text-white font-bold shadow-xs'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-400 opacity-30'
                      }`}
                    >
                      <FileText className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={hasFollowup ? 'Follow-up Required' : 'No Follow-up'}
                      className={`h-4.5 w-4.5 rounded flex items-center justify-center text-[9px] ${
                        hasFollowup
                          ? 'bg-[#0071e3] text-white font-bold shadow-xs'
                          : 'bg-blue-100 dark:bg-blue-950/40 text-blue-400 opacity-30'
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                    </span>
                    <span
                      title={isCompleted ? 'Completed / Verified' : 'Pending Verification'}
                      className={`h-4.5 w-4.5 rounded flex items-center justify-center text-[9px] ${
                        isCompleted
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-400 opacity-30'
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
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500">
              No voter records match the current filters. Click &ldquo;Clear&rdquo; to reset.
            </div>
          )}

          {/* Expanded View Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
            <div className="flex items-center gap-3">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {filteredVoters.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {Math.min(safePage * pageSize, filteredVoters.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{filteredVoters.length}</span> voters
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40"
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
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors ${
                      safePage === pageNum
                        ? 'bg-[#0071e3] text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 7 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors ${
                      safePage === totalPages
                        ? 'bg-[#0071e3] text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
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
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Modern CRM Voter Table (List View) */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 pl-4 pr-2 w-9">
                  <input
                    type="checkbox"
                    checked={
                      paginatedVoters.length > 0 &&
                      paginatedVoters.every((v) => selectedRowIds.includes(v.id))
                    }
                    onChange={toggleSelectAllOnPage}
                    className="rounded border-slate-300 text-[#0071e3]"
                  />
                </th>
                <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('serialNo')}>
                  <div className="inline-flex items-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                {visibleCols.status && (
                  <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('status')}>
                    <div className="inline-flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                )}
                {visibleCols.name && (
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                    <div className="inline-flex items-center gap-1">
                      <span>Voter Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                )}
                {visibleCols.epicNo && (
                  <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('epicNo')}>
                    <div className="inline-flex items-center gap-1">
                      <span>EPIC / Voter ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                )}
                {visibleCols.houseNo && <th className="py-3 px-2.5">House No.</th>}
                {visibleCols.village && <th className="py-3 px-2.5">Village</th>}
                {visibleCols.villagePart && <th className="py-3 px-2.5">Village Part (Leikai)</th>}
                {visibleCols.pollingStation && (
                  <th className="py-3 px-2.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('pollingStationId')}>
                    <div className="inline-flex items-center gap-1">
                      <span>Polling Station</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                )}
                {visibleCols.familyId && <th className="py-3 px-2.5">Family ID</th>}
                {visibleCols.fatherName && <th className="py-3 px-2.5">Father&apos;s Name</th>}
                {visibleCols.motherName && <th className="py-3 px-2.5">Mother&apos;s Name</th>}
                {visibleCols.spouseName && <th className="py-3 px-2.5">Spouse / Close Member</th>}
                {visibleCols.age && (
                  <th className="py-3 px-2 cursor-pointer hover:text-slate-900 text-right" onClick={() => handleSort('age')}>
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>Age</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                )}
                {visibleCols.gender && <th className="py-3 px-2 text-center">Gender</th>}
                {visibleCols.phone && <th className="py-3 px-2.5">Phone</th>}
                {visibleCols.activity && <th className="py-3 px-2.5 text-center">Activity</th>}
                <th className="py-3 pl-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedVoters.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-500">
                    No voter records match the current filters. Click &ldquo;Clear&rdquo; to reset.
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
                      className={`group cursor-pointer transition-colors ${colorStyles.rowBorder} ${
                        isSelected
                          ? 'bg-blue-50/60 hover:bg-blue-50'
                          : idx % 2 === 1
                          ? 'bg-slate-50/40 hover:bg-blue-50/40'
                          : 'bg-white hover:bg-blue-50/40'
                      }`}
                    >
                      <td
                        className="py-2.5 pl-3 pr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelect(voter.id)}
                          className="rounded border-slate-300 text-[#0071e3]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-500 tabular-nums">{voter.serialNo}</td>
                      {visibleCols.status && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              statusChipClasses[voter.status]
                            }`}
                          >
                            {voter.status}
                          </span>
                          {voter.status === 'Issues' && voter.issueType && (
                            <span className="ml-1 text-[10px] text-red-600 font-medium">({voter.issueType})</span>
                          )}
                        </td>
                      )}
                      {visibleCols.name && (
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Pure Color Dot Indicator + Hover/Click 4-Dot Picker (No text naming) */}
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
                                            ? 'h-3 w-3 ring-2 ring-offset-1 ring-slate-400'
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
                            <div className="text-[10px] font-normal text-slate-400 pl-5">
                              {voter.tags.join(' · ')}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleCols.epicNo && (
                        <td className="py-2.5 px-2.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {voter.epicNo}
                        </td>
                      )}
                      {visibleCols.houseNo && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            {voter.houseNo || '—'}
                          </span>
                        </td>
                      )}
                      {visibleCols.village && (
                        <td className="py-2.5 px-2.5 text-slate-700 whitespace-nowrap">{village?.name || '—'}</td>
                      )}
                      {visibleCols.villagePart && (
                        <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">{vp?.name || '—'}</td>
                      )}
                      {visibleCols.pollingStation && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-slate-800">
                            PS-{ps?.psNo || voter.partNo}
                          </span>
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
                          <span className="font-mono text-[#0071e3] hover:underline font-medium">
                            {fam?.familyCode || voter.familyId}
                          </span>
                        </td>
                      )}
                      {visibleCols.fatherName && (
                        <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">{voter.fatherName}</td>
                      )}
                      {visibleCols.motherName && (
                        <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">{voter.motherName}</td>
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
                              <span className="text-[#0071e3] hover:underline font-medium">
                                {voter.spouseName} ↗
                              </span>
                            ) : (
                              <span className="text-slate-600">{voter.spouseName}</span>
                            )
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}
                      {visibleCols.age && (
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700 tabular-nums">{voter.age}</td>
                      )}
                      {visibleCols.gender && (
                        <td className="py-2.5 px-2 text-center font-medium text-slate-600">{voter.gender}</td>
                      )}
                      {visibleCols.phone && (
                        <td className="py-2.5 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                          {maskPhoneNumber(voter.phone, revealFullPhone)}
                        </td>
                      )}
                      {visibleCols.activity && (
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          {openNotes === 0 && openTasks === 0 && sentNotifs === 0 ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <div
                              className="inline-flex items-center gap-2 text-slate-600"
                              title={`${openNotes} Note(s), ${openTasks} Open Task(s), ${sentNotifs} Notification(s) sent`}
                            >
                              {sentNotifs > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-mono text-[11px]">
                                  <BellRing className="h-3.5 w-3.5" />
                                  {sentNotifs}
                                </span>
                              )}
                              {openNotes > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-blue-600 font-mono text-[11px]">
                                  <FileText className="h-3.5 w-3.5" />
                                  {openNotes}
                                </span>
                              )}
                              {openTasks > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono text-[11px]">
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
                            title={`Notify ${voter.name} individually`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 bg-blue-50/70 text-[#0071e3] hover:bg-[#0071e3] hover:text-white text-[11px] font-semibold transition-colors"
                          >
                            <BellRing className="h-3 w-3" />
                            <span>Notify</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedVoterId(voter.id)}
                            title="Edit Voter"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFamilyFilter(voter.familyId);
                              setActiveTab('family-view');
                            }}
                            title="Open Household in Family View"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-900 tabular-nums">
                {filteredVoters.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 tabular-nums">
                {Math.min(safePage * pageSize, filteredVoters.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 tabular-nums">{filteredVoters.length}</span> voters
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-xs text-slate-700 tabular-nums">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Right-Side Voter Details Drawer */}
      <VoterDrawer filteredVoterIds={filteredVoterIds} />

      {/* Bulk Move Polling Station Modal (Requires Reason) */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Move {selectedRowIds.length} Voter(s) to Polling Station</h3>
              <button type="button" onClick={() => setShowBulkMoveModal(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Every voter belongs to exactly one polling station. Moving voters across stations requires a coordinator reason and writes to the immutable audit log.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Polling Station (PS 1–41)</label>
                <select
                  value={bulkMovePsId}
                  onChange={(e) => setBulkMovePsId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="">Select Polling Station...</option>
                  {scopedPollingStations.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      PS-{ps.psNo}: {ps.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Reason (Required)</label>
                <input
                  type="text"
                  value={bulkMoveReason}
                  onChange={(e) => setBulkMoveReason(e.target.value)}
                  placeholder="e.g., ECI Part boundary correction / household shift"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Confirm Station Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Voter Modal */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Voter Record (AC-31 Thoubal)</h3>
              <button type="button" onClick={() => setShowAddVoterModal(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">EPIC Number (3 Letters + 7 Digits)</label>
                <input
                  type="text"
                  value={newVoterForm.epicNo}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, epicNo: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newVoterForm.name}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Thokchom Mangibabu Singh"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Father&apos;s Name</label>
                <input
                  type="text"
                  value={newVoterForm.fatherName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, fatherName: e.target.value }))}
                  placeholder="e.g. Thokchom Ibohal Singh"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={newVoterForm.motherName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, motherName: e.target.value }))}
                  placeholder="e.g. Thokchom Jamuna Devi"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Spouse&apos;s Name (Optional)</label>
                <input
                  type="text"
                  value={newVoterForm.spouseName}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, spouseName: e.target.value }))}
                  placeholder="e.g. Thokchom Ibemhal Devi"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">House Number</label>
                <input
                  type="text"
                  value={newVoterForm.houseNo}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, houseNo: e.target.value }))}
                  placeholder="e.g. H.No. 42/A"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Age (&ge; 18)</label>
                  <input
                    type="number"
                    min={18}
                    value={newVoterForm.age}
                    onChange={(e) => setNewVoterForm((p) => ({ ...p, age: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={newVoterForm.gender}
                    onChange={(e) => setNewVoterForm((p) => ({ ...p, gender: e.target.value as Gender }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newVoterForm.phone}
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Color</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 px-3 py-2">
                  {VOTER_CATEGORIES.map((cat) => {
                    const st = getVoterCategoryStyles(cat);
                    const isSelected = newVoterForm.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-label="Select color"
                        onClick={() => setNewVoterForm((p) => ({ ...p, category: cat }))}
                        className={`h-5 w-5 rounded-full transition-transform ${st.dot} ${
                          isSelected ? 'scale-125 ring-2 ring-offset-1 ring-slate-900' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Village Part (Leikai) → Allocates Station ({villageParts.length} in Scope)
                </label>
                <select
                  value={
                    villageParts.some((vp) => vp.id === newVoterForm.villagePartId)
                      ? newVoterForm.villagePartId
                      : villageParts[0]?.id || 'vp-1'
                  }
                  onChange={(e) => setNewVoterForm((p) => ({ ...p, villagePartId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  {villageParts.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.name} → Allocated to PS-{vp.partNo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVoterModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                    fatherName: newVoterForm.fatherName.trim() || 'Not Recorded',
                    motherName: newVoterForm.motherName.trim() || 'Not Recorded',
                    spouseName: newVoterForm.spouseName.trim() || undefined,
                    houseNo: houseNoVal,
                    age: Math.max(18, newVoterForm.age),
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
                className="rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Create Voter Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Approval & Audit Log Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Approval-Gated Voter Data Export</h3>
              <button type="button" onClick={() => setShowExportModal(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every personal data export requires Admin approval, is watermarked with the requester&apos;s identity, and is permanently logged in the audit trail.
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Records in Scope:</span>{' '}
                <span className="font-bold text-slate-900">
                  {selectedRowIds.length > 0 ? selectedRowIds.length : filteredVoters.length} voters
                </span>
              </div>
              <div>
                <span className="text-slate-500">Filter Scope:</span>{' '}
                <span className="font-medium text-slate-800">
                  {statusCardFilter === 'ALL' ? 'All Statuses' : statusCardFilter} ·{' '}
                  {selectedPollingStationFilter.length === 0
                    ? 'All Scoped Stations'
                    : `${selectedPollingStationFilter.length} Station(s)`}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Official Purpose / Reason for Export</label>
              <input
                type="text"
                value={exportReason}
                onChange={(e) => setExportReason(e.target.value)}
                placeholder="e.g., Booth verification sheets for PS-1 field team..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                  // Also trigger downloadable watermarked CSV if Admin/Coordinator
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
                className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Log & Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Voter Notification Modal */}
      {activeNotifyVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0071e3]">
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Individual Voter Notification</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeNotifyVoter.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  EPIC: {activeNotifyVoter.epicNo} · Part {activeNotifyVoter.partNo} · Sl. {activeNotifyVoter.serialNo} · Phone:{' '}
                  {maskPhoneNumber(activeNotifyVoter.phone, revealFullPhone)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotifyVoterId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">1. Delivery Channel</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
                    { id: 'SMS', label: 'SMS Text', icon: Send },
                    { id: 'Voice Call', label: 'Voice Alert', icon: PhoneCall },
                    { id: 'Field Slip', label: 'Doorstep Slip', icon: Printer },
                  ] as { id: NotificationChannel; label: string; icon: React.ComponentType<{ className?: string }> }[]
                ).map((ch) => {
                  const Icon = ch.icon;
                  const active = notifChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setNotifChannel(ch.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[#0071e3] bg-[#0071e3] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">2. Notification Template</label>
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
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                <label className="block font-medium text-slate-700 mb-1">Subject / Reference</label>
                <input
                  type="text"
                  value={notifSubject}
                  onChange={(e) => setNotifSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#0071e3] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Personalized Voter Message</label>
                <textarea
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 leading-relaxed focus:border-[#0071e3] focus:outline-none"
                />
              </div>
            </div>

            {/* Recent Notification History for this Individual Voter */}
            {(() => {
              const history = voterNotifications.filter((n) => n.voterId === activeNotifyVoter.id);
              return (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Individual Dispatch History ({history.length})</span>
                    <span className="font-mono text-slate-400">{activeNotifyVoter.epicNo}</span>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 py-1">No notifications sent to this voter yet.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {item.channel} · {item.templateType}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{item.message}</p>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
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
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Notification to {activeNotifyVoter.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Individual Voter Notification Modal */}
      {showBulkNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Notify {selectedRowIds.length} Selected Voter(s) Individually
              </h3>
              <button type="button" onClick={() => setShowBulkNotifyModal(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Each selected voter receives a personalized notification containing their individual EPIC number, Part No, Serial No, and Polling Station.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Channel</label>
                <select
                  value={bulkNotifChannel}
                  onChange={(e) => setBulkNotifChannel(e.target.value as NotificationChannel)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS Text</option>
                  <option value="Voice Call">Voice Call Alert</option>
                  <option value="Field Slip">Doorstep Field Slip</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Type</label>
                <select
                  value={bulkNotifTemplate}
                  onChange={(e) => setBulkNotifTemplate(e.target.value as NotificationTemplateType)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="Polling Slip">Polling Slip (EPIC + Booth + Serial No)</option>
                  <option value="Verification Reminder">Household Verification Reminder</option>
                  <option value="Booth Update">Polling Station Location Update</option>
                  <option value="Custom Message">Custom Notice</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Note (Optional)</label>
                <input
                  type="text"
                  value={bulkNotifNote}
                  onChange={(e) => setBulkNotifNote(e.target.value)}
                  placeholder="Appended to each voter's personalized message..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkNotifyModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch {selectedRowIds.length} Notifications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
