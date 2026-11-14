'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  Search,
  Layers,
  MapPin,
  RotateCcw,
  Navigation,
  Check,
  Loader2,
} from 'lucide-react';
import { VoterCategory } from '@/lib/types';

interface VoterPinPickerMapProps {
  lat: number;
  lng: number;
  category: VoterCategory;
  voterName: string;
  houseNo?: string;
  epicNo: string;
  pollingStation?: {
    psNo: number;
    name: string;
    location: string;
    lat: number;
    lng: number;
  };
  canEdit: boolean;
  onChangeCoordinates: (lat: number, lng: number, accuracyMeters?: number) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function getCategoryHexColor(category: VoterCategory): string {
  switch (category) {
    case VoterCategory.Voter:
      return '#10b981'; // Emerald
    case VoterCategory.Opponent:
      return '#ef4444'; // Red
    case VoterCategory.Worker:
      return '#0071e3'; // Blue
    case VoterCategory.Pending:
    default:
      return '#fbbf24'; // Amber
  }
}

export default function VoterPinPickerMap({
  lat,
  lng,
  category,
  voterName,
  houseNo,
  epicNo,
  pollingStation,
  canEdit,
  onChangeCoordinates,
}: VoterPinPickerMapProps) {
  const safeLat = Number.isFinite(lat) ? lat : 24.6382;
  const safeLng = Number.isFinite(lng) ? lng : 94.0012;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const voterMarkerRef = useRef<L.Marker | null>(null);
  const psMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Free OpenStreetMap Nominatim search state
  const [placeQuery, setPlaceQuery] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeResults, setPlaceResults] = useState<NominatimResult[]>([]);

  const createVoterIcon = (cat: VoterCategory) => {
    const color = getCategoryHexColor(cat);
    return L.divIcon({
      className: 'custom-voter-pin-icon',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; opacity: 0.25; transform: scale(1.25);"></div>
          <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: ${color}; border: 3px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.35);"></div>
          <div style="position: absolute; bottom: -5px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid ${color};"></div>
        </div>
      `,
      iconSize: [32, 37],
      iconAnchor: [16, 34],
      popupAnchor: [0, -32],
    });
  };

  const createPsIcon = (psNo: number) => {
    return L.divIcon({
      className: 'custom-ps-pin-icon',
      html: `
        <div style="display: inline-flex; align-items: center; gap: 3px; background: #0f172a; color: #ffffff; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;">
          <span>PS-${psNo}</span>
        </div>
      `,
      iconSize: [52, 24],
      iconAnchor: [26, 12],
      popupAnchor: [0, -12],
    });
  };

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [safeLat, safeLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    const initialTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    tileLayerRef.current = initialTile;

    const marker = L.marker([safeLat, safeLng], {
      icon: createVoterIcon(category),
      draggable: canEdit,
    }).addTo(map);

    marker.bindPopup(
      `<div style="font-family: -apple-system, sans-serif; font-size: 12px; line-height: 1.4;">
        <div style="font-weight: 700; color: #0f172a;">${voterName}</div>
        <div style="font-family: monospace; font-size: 11px; color: #475569;">${epicNo}${houseNo ? ` · ${houseNo}` : ''}</div>
        <div style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 2px;">${safeLat.toFixed(5)}° N, ${safeLng.toFixed(5)}° E</div>
      </div>`
    );

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nextLat = Number(pos.lat.toFixed(5));
      const nextLng = Number(pos.lng.toFixed(5));
      onChangeCoordinates(nextLat, nextLng);
      setGpsStatusMsg(`Pin moved to ${nextLat.toFixed(5)}° N, ${nextLng.toFixed(5)}° E`);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!canEdit) return;
      const nextLat = Number(e.latlng.lat.toFixed(5));
      const nextLng = Number(e.latlng.lng.toFixed(5));
      marker.setLatLng([nextLat, nextLng]);
      onChangeCoordinates(nextLat, nextLng);
      setGpsStatusMsg(`Pin placed at ${nextLat.toFixed(5)}° N, ${nextLng.toFixed(5)}° E`);
    });

    voterMarkerRef.current = marker;
    mapInstanceRef.current = map;

    // Ensure proper layout sizing inside slide-over drawer
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 220);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      voterMarkerRef.current = null;
      psMarkerRef.current = null;
      lineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between OpenStreetMap Street and Satellite tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
    }
  }, [tileMode]);

  // Update voter marker & polling station reference line when coordinates or category change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = voterMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([safeLat, safeLng]);
    marker.setIcon(createVoterIcon(category));
    marker.setPopupContent(
      `<div style="font-family: -apple-system, sans-serif; font-size: 12px; line-height: 1.4;">
        <div style="font-weight: 700; color: #0f172a;">${voterName}</div>
        <div style="font-family: monospace; font-size: 11px; color: #475569;">${epicNo}${houseNo ? ` · ${houseNo}` : ''}</div>
        <div style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 2px;">${safeLat.toFixed(5)}° N, ${safeLng.toFixed(5)}° E</div>
      </div>`
    );

    if (psMarkerRef.current) {
      map.removeLayer(psMarkerRef.current);
      psMarkerRef.current = null;
    }
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }

    if (pollingStation) {
      const psMarker = L.marker([pollingStation.lat, pollingStation.lng], {
        icon: createPsIcon(pollingStation.psNo),
        interactive: true,
      }).addTo(map);

      psMarker.bindPopup(
        `<div style="font-family: -apple-system, sans-serif; font-size: 12px;">
          <div style="font-weight: 700; color: #0f172a;">PS-${pollingStation.psNo}: ${pollingStation.name}</div>
          <div style="font-size: 11px; color: #475569;">${pollingStation.location}</div>
        </div>`
      );
      psMarkerRef.current = psMarker;

      const line = L.polyline(
        [
          [safeLat, safeLng],
          [pollingStation.lat, pollingStation.lng],
        ],
        {
          color: '#0071e3',
          weight: 2,
          dashArray: '5, 6',
          opacity: 0.65,
        }
      ).addTo(map);
      lineRef.current = line;
    }
  }, [safeLat, safeLng, category, voterName, houseNo, epicNo, pollingStation]);

  const handleUseDeviceGps = () => {
    if (!canEdit) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by this browser.');
      return;
    }
    setIsLocatingGps(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS fix...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(5));
        const nextLng = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 5);
        onChangeCoordinates(nextLat, nextLng, acc);
        mapInstanceRef.current?.flyTo([nextLat, nextLng], 17, { duration: 0.5 });
        setIsLocatingGps(false);
        setGpsStatusMsg(`Captured device GPS (±${acc}m)`);
      },
      () => {
        setIsLocatingGps(false);
        setGpsStatusMsg('Unable to read device GPS. Click or drag the pin on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchNominatim = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;
    setIsSearchingPlace(true);
    try {
      const searchStr = q.toLowerCase().includes('manipur') || q.toLowerCase().includes('thoubal')
        ? q
        : `${q}, Thoubal, Manipur, India`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(searchStr)}`
      );
      if (res.ok) {
        const data = (await res.json()) as NominatimResult[];
        setPlaceResults(data);
      }
    } catch {
      setPlaceResults([]);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const handleSelectPlace = (place: NominatimResult) => {
    const rawLat = parseFloat(place.lat);
    const rawLng = parseFloat(place.lon);
    if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) return;
    const nextLat = Number(rawLat.toFixed(5));
    const nextLng = Number(rawLng.toFixed(5));
    if (canEdit) {
      onChangeCoordinates(nextLat, nextLng);
    }
    mapInstanceRef.current?.flyTo([nextLat, nextLng], 17, { duration: 0.45 });
    setPlaceResults([]);
    setGpsStatusMsg(`Pinned to ${place.display_name.split(',')[0]}`);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Top Map Controls & Free Nominatim Search */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200">
            <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>OpenStreetMap location pin</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tile Mode Switcher: Street vs Satellite */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTileMode('street')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  tileMode === 'street'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                Street map
              </button>
              <button
                type="button"
                onClick={() => setTileMode('satellite')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  tileMode === 'satellite'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Layers className="h-3 w-3" />
                Satellite
              </button>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={handleUseDeviceGps}
                disabled={isLocatingGps}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                title="Capture your device's live GPS coordinates"
              >
                {isLocatingGps ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Crosshair className="h-3 w-3" />
                )}
                <span>Use my GPS</span>
              </button>
            )}
          </div>
        </div>

        {/* Landmark / Leikai Search via Free OSM Nominatim */}
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchNominatim(e);
                  }
                }}
                placeholder="Search landmark, leikai, or road in Thoubal..."
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchNominatim}
              disabled={isSearchingPlace || !placeQuery.trim()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 whitespace-nowrap"
            >
              {isSearchingPlace ? 'Searching...' : 'Locate'}
            </button>
            {pollingStation && (
              <button
                type="button"
                onClick={() => {
                  mapInstanceRef.current?.flyTo([pollingStation.lat, pollingStation.lng], 16, {
                    duration: 0.4,
                  });
                }}
                title={`Center near PS-${pollingStation.psNo}`}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {placeResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {placeResults.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(p)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between gap-2"
                >
                  <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                    {p.display_name}
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">Pin here</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Leaflet Map Canvas */}
      <div className="relative h-64 w-full bg-slate-100 dark:bg-zinc-950">
        <div ref={mapContainerRef} className="h-full w-full z-10" />
        <div className="pointer-events-none absolute bottom-2 left-2 z-20 rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300">
          {canEdit ? 'Click anywhere on map or drag the pin to set house location' : 'View-only mode'}
        </div>
      </div>

      {/* Coordinate Readout & Directions Footer */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-zinc-400">Lat</span>
            <input
              type="number"
              step="0.0001"
              disabled={!canEdit}
              value={safeLat}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v)) onChangeCoordinates(v, safeLng);
              }}
              className="w-24 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-xs text-slate-900 dark:text-zinc-100 tabular-nums"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-zinc-400">Lng</span>
            <input
              type="number"
              step="0.0001"
              disabled={!canEdit}
              value={safeLng}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v)) onChangeCoordinates(safeLat, v);
              }}
              className="w-24 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-xs text-slate-900 dark:text-zinc-100 tabular-nums"
            />
          </div>
          {gpsStatusMsg && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              {gpsStatusMsg}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://www.openstreetmap.org/?mlat=${safeLat}&mlon=${safeLng}#map=18/${safeLat}/${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            Open in OSM
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            <Navigation className="h-3 w-3" />
            Directions
          </a>
        </div>
      </div>
    </div>
  );
}
