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
    <div className="h-[620px] w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">
      Loading AC-31 Thoubal OpenStreetMap view...
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
  } = useVoterStore();

  const [psFilter, setPsFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<VoterStatus | 'ALL'>('ALL');
  const [categoryColorFilter, setCategoryColorFilter] = useState<VoterCategory | 'ALL'>('ALL');
  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street');
  const [showBooths, setShowBooths] = useState<boolean>(true);

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
      `Pinpointed house location on OpenStreetMap (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Constituency map
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Household pinpointing across OpenStreetMap ·{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-zinc-300 tabular-nums">
              {filteredVoters.length}
            </span>{' '}
            voters ·{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-zinc-300 tabular-nums">
              {scopedPollingStations.length}
            </span>{' '}
            polling stations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-0.5">
            <button
              type="button"
              onClick={() => setTileMode('street')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                tileMode === 'street'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Street map
            </button>
            <button
              type="button"
              onClick={() => setTileMode('satellite')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                tileMode === 'satellite'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowBooths((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              showBooths
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{showBooths ? `Booths visible (${scopedPollingStations.length})` : 'Show booths'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search voter name, house no, or EPIC..."
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:outline-none"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={psFilter}
          onChange={(e) => setPsFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
        >
          <option value="ALL">All stations ({scopedPollingStations.length})</option>
          {scopedPollingStations.map((ps) => (
            <option key={ps.id} value={ps.id}>
              PS-{ps.psNo}: {ps.name.replace(/^31\/\d+\s*/, '')}
            </option>
          ))}
        </select>

        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
        >
          <option value="ALL">All {villages.length} villages</option>
          {villages.map((vil) => (
            <option key={vil.id} value={vil.id}>
              {vil.name} ({vil.code})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VoterStatus | 'ALL')}
          className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-blue-600 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Issues">Issues</option>
          <option value="New">New</option>
        </select>

        {/* Functional Color Dots Filter (No text names) */}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-2">
          {VOTER_CATEGORIES.map((cat) => {
            const st = getVoterCategoryStyles(cat);
            const isSelected = categoryColorFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-label="Filter pins by color"
                onClick={() => setCategoryColorFilter(isSelected ? 'ALL' : cat)}
                className={`h-3.5 w-3.5 rounded-full transition-transform ${st.dot} ${
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
              className="ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Active Pinpointing Mode Banner */}
      {pinpointingVoter && (
        <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                Pinpointing location for {pinpointingVoter.name} ({pinpointingVoter.epicNo})
              </div>
              <div className="text-slate-600 dark:text-zinc-400 mt-0.5 font-mono text-[11px] tabular-nums">
                {(Number.isFinite(pinpointingVoter.lat) ? pinpointingVoter.lat! : 24.6382).toFixed(5)}° N, {(Number.isFinite(pinpointingVoter.lng) ? pinpointingVoter.lng! : 94.0012).toFixed(5)}° E ·{' '}
                {pinpointingVoter.houseNo || pinpointingVoter.addressId} · Click the map or drag pin to update
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={syncFamilyOnPinpoint}
                onChange={(e) => setSyncFamilyOnPinpoint(e.target.checked)}
                className="rounded border-slate-300 dark:border-zinc-700 text-blue-600"
              />
              <span>
                Sync household ({familyMap.get(pinpointingVoter.familyId)?.familyCode || pinpointingVoter.familyId})
              </span>
            </label>

            <button
              type="button"
              onClick={handleCaptureDeviceGpsForPinpoint}
              disabled={isCapturingGps}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 whitespace-nowrap"
            >
              {isCapturingGps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
              <span>Use device GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setPinpointingVoterId(null)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 font-medium hover:bg-slate-800 dark:hover:bg-zinc-100 whitespace-nowrap"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden h-[620px] relative">
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

        <div className="lg:col-span-4 xl:col-span-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-[620px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              Household pins ({filteredVoters.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Select a voter to focus their location on the map.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filteredVoters.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                No voter locations match the current filters.
              </div>
            ) : (
              filteredVoters.slice(0, 120).map((voter) => {
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
                        ? 'bg-blue-50/80 dark:bg-blue-950/30'
                        : isFocused
                        ? 'bg-slate-100 dark:bg-zinc-800/70'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${st.dot}`} />
                          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                            {voter.name}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                          <span>{voter.epicNo}</span>
                          <span>·</span>
                          <span>{voter.houseNo || 'No house no'}</span>
                          <span>·</span>
                          <span>PS-{Number.isFinite(ps?.psNo) ? ps?.psNo : Number.isFinite(voter.partNo) ? voter.partNo : '-'}</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                          {(Number.isFinite(voter.lat) ? voter.lat! : 24.6382).toFixed(5)}° N, {(Number.isFinite(voter.lng) ? voter.lng! : 94.0012).toFixed(5)}° E
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {canEditVoter && (
                          <button
                            type="button"
                            onClick={() => {
                              setPinpointingVoterId(isPinpointing ? null : voter.id);
                              setFocusedVoterId(voter.id);
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                              isPinpointing
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 hover:border-blue-500'
                            }`}
                          >
                            <MapPin className="h-3 w-3" />
                            <span>{isPinpointing ? 'Pinpointing' : 'Pinpoint'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedVoterId(voter.id)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <VoterDrawer filteredVoterIds={filteredVoterIds} />
    </div>
  );
}
