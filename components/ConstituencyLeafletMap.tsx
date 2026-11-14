'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Voter, PollingStation, VoterCategory } from '@/lib/types';
import { normalizeVoterCategory } from '@/lib/utils';

interface ConstituencyLeafletMapProps {
  voters: Voter[];
  pollingStations: PollingStation[];
  showBooths: boolean;
  tileMode: 'street' | 'satellite';
  activeVoterId: string | null;
  pinpointingVoter: Voter | null;
  canEditVoter: boolean;
  onSelectVoterForDrawer: (voterId: string) => void;
  onStartPinpointingVoter: (voterId: string) => void;
  onUpdateVoterCoordinates: (voterId: string, lat: number, lng: number) => void;
  onSelectBoothFilter: (psId: string) => void;
}

function getCategoryHexColor(category: VoterCategory): string {
  switch (category) {
    case VoterCategory.Voter:
      return '#10b981'; // Green
    case VoterCategory.Opponent:
      return '#ef4444'; // Red
    case VoterCategory.Worker:
      return '#0071e3'; // Blue
    case VoterCategory.Pending:
    default:
      return '#fbbf24'; // Amber
  }
}

export default function ConstituencyLeafletMap({
  voters,
  pollingStations,
  showBooths,
  tileMode,
  activeVoterId,
  pinpointingVoter,
  canEditVoter,
  onSelectVoterForDrawer,
  onStartPinpointingVoter,
  onUpdateVoterCoordinates,
  onSelectBoothFilter,
}: ConstituencyLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boothsLayerRef = useRef<L.LayerGroup | null>(null);

  // Keep latest callbacks in refs so Leaflet event listeners always invoke fresh handlers
  const callbacksRef = useRef({
    onSelectVoterForDrawer,
    onStartPinpointingVoter,
    onUpdateVoterCoordinates,
    onSelectBoothFilter,
    pinpointingVoter,
    canEditVoter,
  });

  useEffect(() => {
    callbacksRef.current = {
      onSelectVoterForDrawer,
      onStartPinpointingVoter,
      onUpdateVoterCoordinates,
      onSelectBoothFilter,
      pinpointingVoter,
      canEditVoter,
    };
  }, [
    onSelectVoterForDrawer,
    onStartPinpointingVoter,
    onUpdateVoterCoordinates,
    onSelectBoothFilter,
    pinpointingVoter,
    canEditVoter,
  ]);

  // Initialize map instance once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [24.6382, 94.0012], // AC-31 Thoubal center
      zoom: 14,
      zoomControl: true,
    });

    const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    tileLayerRef.current = tile;
    boothsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Handle map click when in Pinpoint Mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { pinpointingVoter: target, canEditVoter: editable, onUpdateVoterCoordinates: updateFn } =
        callbacksRef.current;
      if (target && editable) {
        const nextLat = Number(e.latlng.lat.toFixed(5));
        const nextLng = Number(e.latlng.lng.toFixed(5));
        updateFn(target.id, nextLat, nextLng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch between Street and Satellite tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (tileMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    }
  }, [tileMode]);

  // Render Polling Station Booth Markers
  useEffect(() => {
    const boothsGroup = boothsLayerRef.current;
    if (!boothsGroup) return;

    boothsGroup.clearLayers();
    if (!showBooths) return;

    pollingStations.forEach((ps) => {
      const icon = L.divIcon({
        className: 'ps-booth-marker',
        html: `
          <div style="display: inline-flex; align-items: center; gap: 4px; background: #0f172a; color: #ffffff; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 8px; border: 2px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.3); white-space: nowrap;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #38bdf8;"></span>
            <span>PS-${ps.psNo}</span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
        popupAnchor: [0, -13],
      });

      const marker = L.marker([ps.lat, ps.lng], { icon });

      const popupDiv = document.createElement('div');
      popupDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      popupDiv.style.minWidth = '210px';
      popupDiv.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase; letter-spacing: 0.04em;">Polling Station #${ps.psNo}</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${ps.name}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">${ps.location}</div>
        <div style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 4px;">${ps.lat.toFixed(5)}° N, ${ps.lng.toFixed(5)}° E</div>
        <button type="button" data-action="filter-ps" style="margin-top: 8px; width: 100%; background: #0071e3; color: #ffffff; border: none; border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
          Scope Map to PS-${ps.psNo} Voters
        </button>
      `;

      const filterBtn = popupDiv.querySelector('[data-action="filter-ps"]');
      filterBtn?.addEventListener('click', () => {
        callbacksRef.current.onSelectBoothFilter(ps.id);
        marker.closePopup();
      });

      marker.bindPopup(popupDiv);
      boothsGroup.addLayer(marker);
    });
  }, [pollingStations, showBooths]);

  // Render Color-Coded Voter Household Pins
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    const map = mapRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    voters.forEach((voter) => {
      const lat = Number.isFinite(voter.lat) ? voter.lat! : 24.6382;
      const lng = Number.isFinite(voter.lng) ? voter.lng! : 94.0012;
      const cat = normalizeVoterCategory(voter.category || voter.colorState);
      const hex = getCategoryHexColor(cat);
      const isPinpointingThis = pinpointingVoter?.id === voter.id;
      const isSelected = activeVoterId === voter.id || isPinpointingThis;

      const size = isSelected ? 26 : 16;
      const icon = L.divIcon({
        className: 'voter-household-pin',
        html: `
          <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
            ${
              isSelected
                ? `<div style="position: absolute; inset: -6px; border-radius: 9999px; border: 2px solid ${hex}; background: ${hex}33;"></div>`
                : ''
            }
            <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background: ${hex}; border: ${
          isSelected ? '3px' : '2px'
        } solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      const marker = L.marker([lat, lng], {
        icon,
        draggable: canEditVoter && isPinpointingThis,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        callbacksRef.current.onUpdateVoterCoordinates(
          voter.id,
          Number(pos.lat.toFixed(5)),
          Number(pos.lng.toFixed(5))
        );
      });

      const popupEl = document.createElement('div');
      popupEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      popupEl.style.minWidth = '230px';
      popupEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: ${hex};"></span>
            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #334155;">${voter.epicNo}</span>
          </div>
          <span style="font-family: monospace; font-size: 10px; color: #64748b;">Part ${voter.partNo} · Sl.${voter.serialNo}</span>
        </div>
        <div style="margin-top: 6px;">
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${voter.name}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${voter.houseNo ? `<strong style="font-family: monospace;">${voter.houseNo}</strong> · ` : ''}${voter.age} yrs · ${voter.gender}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 1px;">${voter.addressId}</div>
          <div style="font-family: monospace; font-size: 10px; color: #0071e3; margin-top: 4px;">
            GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 10px;">
          <button type="button" data-action="open-drawer" style="flex: 1; background: #0071e3; color: #ffffff; border: none; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Open Voter Record
          </button>
          ${
            canEditVoter
              ? `<button type="button" data-action="pinpoint-voter" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                  ${isPinpointingThis ? 'Pinpointing...' : 'Move Pin'}
                </button>`
              : ''
          }
        </div>
      `;

      const openDrawerBtn = popupEl.querySelector('[data-action="open-drawer"]');
      openDrawerBtn?.addEventListener('click', () => {
        callbacksRef.current.onSelectVoterForDrawer(voter.id);
      });

      const pinpointBtn = popupEl.querySelector('[data-action="pinpoint-voter"]');
      pinpointBtn?.addEventListener('click', () => {
        callbacksRef.current.onStartPinpointingVoter(voter.id);
        marker.closePopup();
      });

      marker.bindPopup(popupEl);
      markersGroup.addLayer(marker);
    });
  }, [voters, activeVoterId, pinpointingVoter, canEditVoter]);

  // Fly to active or pinpointing voter when selected from sidebar
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetId = pinpointingVoter?.id || activeVoterId;
    if (!targetId) return;

    const target = voters.find((v) => v.id === targetId);
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), {
        duration: 0.45,
      });
    }
  }, [activeVoterId, pinpointingVoter, voters]);

  return <div ref={containerRef} className="h-full w-full z-10" />;
}
