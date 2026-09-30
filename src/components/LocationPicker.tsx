/**
 * LocationPicker.tsx
 * Reusable map + coordinate input component backed by Leaflet / OpenStreetMap.
 *
 * - Click-to-place and draggable marker.
 * - Two-way sync with lat/lng number inputs (keyboard-accessible).
 * - Soft out-of-area warning (no block).
 * - Context markers for incident / hospitals / ambulances.
 * - Tile-load error banner.
 * - Fixed Leaflet default icon (Vite asset pipeline workaround).
 * - © OpenStreetMap attribution always visible (Leaflet default).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

import { VILE_PARLE_CENTER, roundCoord } from '../lib/geo';

// ── Custom coloured icons ─────────────────────────────────────────────────────

// ── Fix Leaflet default icon broken by Vite's asset pipeline ──────────────────
// Leaflet tries to resolve marker-icon.png via a relative URL from its own
// dist/leaflet.css, which breaks when Vite re-hashes assets. We import the
// images explicitly so Vite includes them, then create the icon manually.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Custom coloured icons ─────────────────────────────────────────────────────

function makeIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${color};
        border:2px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        width:28px;height:28px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.5);
      ">
        <span style="transform:rotate(45deg);font-size:11px;font-weight:700;color:#fff;line-height:1;">${label}</span>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

const ICON_SELECTED  = makeIcon('#ef4444', '📍');
const ICON_INCIDENT  = makeIcon('#f97316', 'I');
const ICON_HOSPITAL  = makeIcon('#3b82f6', 'H');
const ICON_AMBULANCE = makeIcon('#10b981', 'A');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatLng { lat: number; lng: number; }

export interface ContextMarker {
  kind: 'incident' | 'hospital' | 'ambulance';
  lat: number;
  lng: number;
  label: string;
}

interface Props {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  label?: string;
  contextMarkers?: ContextMarker[];
  readOnly?: boolean;
}

// Default center is Vile Parle: lat 19.105, lng 72.85
const DEFAULT_CENTER: [number, number] = [VILE_PARLE_CENTER.lat, VILE_PARLE_CENTER.lng];

function round6(n: number): number {
  return roundCoord(n);
}

// ── Sub-component: click handler inside the map context ───────────────────────

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(round6(e.latlng.lat), round6(e.latlng.lng));
    },
  });
  return null;
}

// ── Sub-component: fly to a position when it changes ─────────────────────────

function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const prevRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!position) return;
    const prev = prevRef.current;
    const moved =
      !prev || Math.abs(prev[0] - position[0]) > 0.0001 || Math.abs(prev[1] - position[1]) > 0.0001;
    if (moved) {
      map.panTo(position, { animate: true, duration: 0.4 });
    }
    prevRef.current = position;
  }, [position, map]);
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export const LocationPicker: React.FC<Props> = ({
  value,
  onChange,
  label,
  contextMarkers = [],
  readOnly = false,
}) => {
  // Local input strings — let user type freely; parse on blur/change
  const [latStr, setLatStr] = useState(value ? String(value.lat) : '');
  const [lngStr, setLngStr] = useState(value ? String(value.lng) : '');
  const [tileError, setTileError] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Keep input strings in sync when value changes from parent (e.g. after DB load)
  useEffect(() => {
    if (value) {
      setLatStr(String(value.lat));
      setLngStr(String(value.lng));
    } else {
      setLatStr('');
      setLngStr('');
    }
  }, [value]);


  const applyInputs = useCallback(
    (latRaw: string, lngRaw: string) => {
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (!isFinite(lat) || !isFinite(lng)) {
        setInputError('Latitude and longitude must be valid numbers.');
        return;
      }
      if (lat < -90 || lat > 90) {
        setInputError('Latitude must be between -90 and 90.');
        return;
      }
      if (lng < -180 || lng > 180) {
        setInputError('Longitude must be between -180 and 180.');
        return;
      }
      setInputError(null);
      onChange({ lat: round6(lat), lng: round6(lng) });
    },
    [onChange],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (readOnly) return;
      setLatStr(String(lat));
      setLngStr(String(lng));
      setInputError(null);
      onChange({ lat, lng });
    },
    [readOnly, onChange],
  );

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      if (readOnly) return;
      const m = e.target as L.Marker;
      const pos = m.getLatLng();
      const lat = round6(pos.lat);
      const lng = round6(pos.lng);
      setLatStr(String(lat));
      setLngStr(String(lng));
      setInputError(null);
      onChange({ lat, lng });
    },
    [readOnly, onChange],
  );

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLatStr(v);
    // Clear error as soon as value looks numeric — don't wait for blur
    const n = Number(v);
    if (v !== '' && isFinite(n) && n >= -90 && n <= 90 && lngStr !== '') {
      const lng = Number(lngStr);
      if (isFinite(lng) && lng >= -180 && lng <= 180) {
        setInputError(null);
        onChange({ lat: round6(n), lng: round6(lng) });
      }
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLngStr(v);
    const n = Number(v);
    if (v !== '' && isFinite(n) && n >= -180 && n <= 180 && latStr !== '') {
      const lat = Number(latStr);
      if (isFinite(lat) && lat >= -90 && lat <= 90) {
        setInputError(null);
        onChange({ lat: round6(lat), lng: round6(n) });
      }
    }
  };

  const handleLatBlur = () => applyInputs(latStr, lngStr);
  const handleLngBlur = () => applyInputs(latStr, lngStr);

  const contextIconMap: Record<ContextMarker['kind'], L.DivIcon> = {
    incident: ICON_INCIDENT,
    hospital: ICON_HOSPITAL,
    ambulance: ICON_AMBULANCE,
  };

  const markerPosition: [number, number] | null = value
    ? [value.lat, value.lng]
    : null;

  return (
    <div className="location-picker-wrapper">
      {label && <p className="location-picker-label">{label}</p>}

      {/* Legend */}
      <div className="lp-legend" role="list" aria-label="Map marker legend">
        <span role="listitem" className="lp-legend-item">
          <span className="lp-dot" style={{ background: '#ef4444' }} aria-hidden />
          Selected
        </span>
        {contextMarkers.some((m) => m.kind === 'incident') && (
          <span role="listitem" className="lp-legend-item">
            <span className="lp-dot" style={{ background: '#f97316' }} aria-hidden />
            Incident (I)
          </span>
        )}
        {contextMarkers.some((m) => m.kind === 'hospital') && (
          <span role="listitem" className="lp-legend-item">
            <span className="lp-dot" style={{ background: '#3b82f6' }} aria-hidden />
            Hospital (H)
          </span>
        )}
        {contextMarkers.some((m) => m.kind === 'ambulance') && (
          <span role="listitem" className="lp-legend-item">
            <span className="lp-dot" style={{ background: '#10b981' }} aria-hidden />
            Ambulance (A)
          </span>
        )}
      </div>

      {/* Map */}
      <div className="lp-map-container" aria-label="Interactive map — click to place marker">
        {tileError && (
          <div className="lp-tile-error" role="alert">
            ⚠️ Map tiles failed to load. Check your internet connection. Coordinate inputs still work.
          </div>
        )}
        <MapContainer
          center={markerPosition ?? DEFAULT_CENTER}
          zoom={14}
          className="lp-map"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
            eventHandlers={{
              tileerror: () => setTileError(true),
              tileload: () => setTileError(false),
            }}
          />

          {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}
          {markerPosition && <MapFlyTo position={markerPosition} />}

          {/* Selected position marker */}
          {markerPosition && (
            <Marker
              position={markerPosition}
              icon={ICON_SELECTED}
              draggable={!readOnly}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}

          {/* Context markers */}
          {contextMarkers.map((cm, i) => (
            <Marker
              key={i}
              position={[cm.lat, cm.lng]}
              icon={contextIconMap[cm.kind]}
              title={cm.label}
            />
          ))}
        </MapContainer>
      </div>


      {/* Coordinate inputs */}
      <div className="lp-inputs">
        <div className="form-group">
          <label className="form-label" htmlFor="lp-lat-input">
            {readOnly ? 'Latitude' : 'Latitude (or click map)'}
          </label>
          <input
            id="lp-lat-input"
            type="number"
            step="any"
            className={`form-input${inputError ? ' input-error' : ''}`}
            value={latStr}
            onChange={handleLatChange}
            onBlur={handleLatBlur}
            disabled={readOnly}
            placeholder="19.105"
            aria-describedby={inputError ? 'lp-coord-err' : undefined}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lp-lng-input">
            {readOnly ? 'Longitude' : 'Longitude (or click map)'}
          </label>
          <input
            id="lp-lng-input"
            type="number"
            step="any"
            className={`form-input${inputError ? ' input-error' : ''}`}
            value={lngStr}
            onChange={handleLngChange}
            onBlur={handleLngBlur}
            disabled={readOnly}
            placeholder="72.849"
            aria-describedby={inputError ? 'lp-coord-err' : undefined}
          />
        </div>
      </div>

      {inputError && (
        <span id="lp-coord-err" className="field-error" role="alert">
          {inputError}
        </span>
      )}

      {!readOnly && (
        <p className="lp-hint">
          Click the map or drag the marker to set coordinates. Editing the inputs also moves the marker.
        </p>
      )}
    </div>
  );
};
