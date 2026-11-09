'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Search,
  Layers,
  Crosshair,
  Building2,
  RotateCcw,
  X,
  Navigation,
  Check,
  Loader2,
} from 'lucide-react';
import { useVoterStore, matchesFuzzyQuery } from '@/lib/store-context';
import { VoterCategory, VoterStatus } from '@/lib/types';
import { VOTER_CATEGORIES, getVoterCategoryStyles, normalizeVoterCategory } from '@/lib/utils';
import VoterDrawer from './VoterDrawer';

const ConstituencyLeafletMap = dynamic(() => import('./ConstituencyLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[620px] w-full rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
      Loading AC-31 Thoubal OpenStreetMap GIS View...
    </div>
  ),
});

export default function MapsView() {
  const {
    voters,
    villages,
    scopedPollingStations,
    families,
    globalSearch,
    setGlobalSearch,
    searchScope,
    selectedVoterId,
    setSelectedVoterId,
    canEditVoter,
    updateVoter,
    bulkUpdateVoters,
  } = useVoterStore();

  const [psFilter, setPsFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<VoterStatus | 'ALL'>('ALL');
  const [categoryColorFilter, setCategoryColorFilter] = useState<VoterCategory | 'ALL'>('ALL');
  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street');
  const [showBooths, setShowBooths] = useState<boolean>(true);

  // Pinpoint Mode State
  const [pinpointingVoterId, setPinpointingVoterId] = useState<string | null>(null);
  const [syncFamilyOnPinpoint, setSyncFamilyOnPinpoint] = useState<boolean>(true);
  const [focusedVoterId, setFocusedVoterId] = useState<string | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);

  const familyMap = useMemo(() => new Map(families.map((f) => [f.id, f])), [families]);
  const psMap = useMemo(() => new Map(scopedPollingStations.map((p) => [p.id, p])), [scopedPollingStations]);

  const filteredVoters = useMemo(() => {
    return voters.filter((v) => {
      if (psFilter !== 'ALL' && v.pollingStationId !== psFilter) return false;
      if (villageFilter !== 'ALL' && v.villageId !== villageFilter) return false;
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (categoryColorFilter !== 'ALL') {
        const cat = normalizeVoterCategory(v.category || v.colorState);
        if (cat !== categoryColorFilter) return false;
      }
      if (globalSearch.trim()) {
        const famCode = familyMap.get(v.familyId)?.familyCode;
        if (!matchesFuzzyQuery(v, globalSearch, famCode, searchScope)) return false;
      }
      return true;
    });
  }, [voters, psFilter, villageFilter, statusFilter, categoryColorFilter, globalSearch, searchScope, familyMap]);

  const pinpointingVoter = useMemo(
    () => (pinpointingVoterId ? voters.find((v) => v.id === pinpointingVoterId) || null : null),
    [voters, pinpointingVoterId]
  );

  const filteredVoterIds = useMemo(() => filteredVoters.map((v) => v.id), [filteredVoters]);

  const handleUpdateVoterCoordinates = (voterId: string, lat: number, lng: number) => {
    const target = voters.find((v) => v.id === voterId);
    if (!target) return;

    updateVoter(
      voterId,
      { lat, lng },
      `Pinpointed exact house location on OpenStreetMap (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`
    );

    if (syncFamilyOnPinpoint) {
      const householdMemberIds = voters
        .filter((v) => v.familyId === target.familyId && v.id !== voterId)
        .map((v) => v.id);
      householdMemberIds.forEach((memberId) => {
        updateVoter(
          memberId,
          { lat, lng },
          `Synced household GPS pin with ${target.name} (${target.houseNo || target.addressId})`
        );
      });
    }
  };

  const handleCaptureDeviceGpsForPinpoint = () => {
    if (!pinpointingVoter || !canEditVoter) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(5));
        const nextLng = Number(pos.coords.longitude.toFixed(5));
        handleUpdateVoterCoordinates(pinpointingVoter.id, nextLat, nextLng);
        setIsCapturingGps(false);
      },
      () => {
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleResetFilters = () => {
    setPsFilter('ALL');
    setVillageFilter('ALL');
    setStatusFilter('ALL');
    setCategoryColorFilter('ALL');
    setGlobalSearch('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Constituency GIS Map — AC-31 Thoubal
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            OpenStreetMap & Leaflet household pinpointing ·{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {filteredVoters.length}
            </span>{' '}
            voters mapped across{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {scopedPollingStations.length}
            </span>{' '}
            Polling Stations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Street vs Satellite Toggle */}
          <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setTileMode('street')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tileMode === 'street'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              OpenStreetMap
            </button>
            <button
              type="button"
              onClick={() => setTileMode('satellite')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tileMode === 'satellite'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Satellite Hybrid</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowBooths((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              showBooths
                ? 'border-[#0071e3] bg-blue-50 dark:bg-blue-950/40 text-[#0071e3]'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{showBooths ? `Booths Visible (PS 1–${scopedPollingStations.length})` : 'Show Booths'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search voter name, house no, or EPIC..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0071e3] focus:outline-none"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Part / Polling Station Filter */}
          <select
            value={psFilter}
            onChange={(e) => setPsFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Parts (PS 1–{scopedPollingStations.length})</option>
            {scopedPollingStations.map((ps) => (
              <option key={ps.id} value={ps.id}>
                Part {ps.psNo} — {ps.name.replace(/^31\/\d+\s*/, '')}
              </option>
            ))}
          </select>

          {/* Village Filter */}
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All 12 Villages</option>
            {villages.map((vil) => (
              <option key={vil.id} value={vil.id}>
                {vil.name} ({vil.code})
              </option>
            ))}
          </select>

          {/* Verification Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VoterStatus | 'ALL')}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Issues">Issues</option>
            <option value="New">New</option>
          </select>

          {/* Pure Color Dots Filter (Zero text naming per system constraint) */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5">
            {VOTER_CATEGORIES.map((cat) => {
              const st = getVoterCategoryStyles(cat);
              const isSelected = categoryColorFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-label="Filter pins by color"
                  onClick={() => setCategoryColorFilter(isSelected ? 'ALL' : cat)}
                  className={`h-4 w-4 rounded-full transition-transform ${st.dot} ${
                    isSelected
                      ? 'scale-125 ring-2 ring-offset-1 ring-slate-900 dark:ring-white'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                />
              );
            })}
            {categoryColorFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setCategoryColorFilter('ALL')}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Active Pinpointing Mode Banner */}
      {pinpointingVoter && (
        <div className="rounded-2xl border-2 border-[#0071e3] bg-blue-50/90 dark:bg-blue-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Pinpointing Exact Household Location for: {pinpointingVoter.name} ({pinpointingVoter.epicNo})
              </div>
              <div className="text-slate-600 dark:text-slate-300 mt-0.5 font-mono text-[11px]">
                Current Pin: {(pinpointingVoter.lat || 24.6382).toFixed(5)}° N,{' '}
                {(pinpointingVoter.lng || 94.0012).toFixed(5)}° E · {pinpointingVoter.houseNo || pinpointingVoter.addressId} —{' '}
                <strong className="font-sans text-[#0071e3]">
                  Click anywhere on the map or drag their pin to set exact house location
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={syncFamilyOnPinpoint}
                onChange={(e) => setSyncFamilyOnPinpoint(e.target.checked)}
                className="rounded border-slate-300 text-[#0071e3]"
              />
              <span>Sync Household ({familyMap.get(pinpointingVoter.familyId)?.familyCode || pinpointingVoter.familyId})</span>
            </label>

            <button
              type="button"
              onClick={handleCaptureDeviceGpsForPinpoint}
              disabled={isCapturingGps}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0071e3] px-3 py-1.5 font-semibold text-white hover:bg-blue-600"
            >
              {isCapturingGps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
              <span>Use My GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setPinpointingVoterId(null)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-3 py-1.5 font-semibold hover:bg-slate-800"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Done Pinpointing</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout: Map Canvas + Quick Pinpoint Voter List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Columns: Interactive OpenStreetMap Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs h-[620px] relative">
          <ConstituencyLeafletMap
            voters={filteredVoters}
            pollingStations={scopedPollingStations}
            showBooths={showBooths}
            tileMode={tileMode}
            activeVoterId={focusedVoterId || selectedVoterId}
            pinpointingVoter={pinpointingVoter}
            canEditVoter={canEditVoter}
            onSelectVoterForDrawer={(id) => setSelectedVoterId(id)}
            onStartPinpointingVoter={(id) => {
              setPinpointingVoterId(id);
              setFocusedVoterId(id);
            }}
            onUpdateVoterCoordinates={handleUpdateVoterCoordinates}
            onSelectBoothFilter={(psId) => setPsFilter(psId)}
          />
        </div>

        {/* Right 4 Columns: Voter Household Geolocation Directory */}
        <div className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[620px] overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Voter Household Pins ({filteredVoters.length})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Click a voter to fly to pin or adjust exact house location
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredVoters.slice(0, 120).map((voter) => {
              const cat = normalizeVoterCategory(voter.category || voter.colorState);
              const st = getVoterCategoryStyles(cat);
              const isPinpointing = pinpointingVoterId === voter.id;
              const isFocused = focusedVoterId === voter.id;
              const ps = psMap.get(voter.pollingStationId);

              return (
                <div
                  key={voter.id}
                  onClick={() => setFocusedVoterId(voter.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isPinpointing
                      ? 'bg-blue-50/90 dark:bg-blue-950/40'
                      : isFocused
                      ? 'bg-slate-100/80 dark:bg-slate-800/70'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${st.dot}`} />
                        {/* Voter Name strictly uncolored neutral text */}
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {voter.name}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <span>{voter.epicNo}</span>
                        <span>·</span>
                        <span>{voter.houseNo || 'H.No. —'}</span>
                        <span>·</span>
                        <span>PS-{ps?.psNo || voter.partNo}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-400 tabular-nums">
                        {(voter.lat || 24.6382).toFixed(5)}° N, {(voter.lng || 94.0012).toFixed(5)}° E
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canEditVoter && (
                        <button
                          type="button"
                          onClick={() => {
                            setPinpointingVoterId(isPinpointing ? null : voter.id);
                            setFocusedVoterId(voter.id);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                            isPinpointing
                              ? 'bg-[#0071e3] text-white'
                              : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3]'
                          }`}
                        >
                          <MapPin className="h-3 w-3" />
                          <span>{isPinpointing ? 'Pinpointing' : 'Pinpoint'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedVoterId(voter.id)}
                        className="text-[11px] font-medium text-[#0071e3] hover:underline"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voter Details Drawer */}
      <VoterDrawer filteredVoterIds={filteredVoterIds} />
    </div>
  );
}
