import React, { useState } from 'react';
import type { Ambulance, AmbulanceInsert } from '../lib/types';
import {
  validateAmbulanceLabel,
  validateAmbulanceCapacity,
} from '../lib/validators';
import { LocationPicker } from './LocationPicker';
import type { LatLng, ContextMarker } from './LocationPicker';

interface Props {
  existing?: Ambulance;
  onSave: (data: Omit<AmbulanceInsert, 'scenario_id'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  contextMarkers?: ContextMarker[];
}

interface FieldErrors {
  label?: string;
  coords?: string;
  capacity?: string;
}

export const AmbulanceForm: React.FC<Props> = ({
  existing,
  onSave,
  onCancel,
  saving,
  contextMarkers = [],
}) => {
  const [label, setLabel] = useState(existing?.label ?? '');
  const [coords, setCoords] = useState<LatLng | null>(
    existing?.base_lat != null && existing?.base_lng != null
      ? { lat: existing.base_lat, lng: existing.base_lng }
      : null,
  );
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() ?? '2');
  const [available, setAvailable] = useState(existing?.available ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const labelErr = validateAmbulanceLabel(label);
    if (labelErr) errs.label = labelErr;
    if (!coords) {
      errs.coords = 'Base location is required. Click the map or enter coordinates.';
    }
    const capErr = validateAmbulanceCapacity(capacity);
    if (capErr) errs.capacity = capErr;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ label: true, coords: true, capacity: true });
    if (!validate()) return;
    await onSave({
      label: label.trim(),
      base_lat: coords!.lat,
      base_lng: coords!.lng,
      capacity: Number(capacity),
      available,
    });
  };

  const showErr = (key: keyof FieldErrors) =>
    touched[key] ? fieldErrors[key] : undefined;

  return (
    <form onSubmit={handleSubmit} aria-label={existing ? 'Edit ambulance' : 'Add ambulance'}>
      <p className="synthetic-notice">
        ⚠️ Synthetic / illustrative data — not real emergency vehicle records.
      </p>

      <div className="form-grid-2">
        {/* Label */}
        <div className="form-group">
          <label className="form-label" htmlFor="amb-label">Unit Label</label>
          <input
            id="amb-label"
            type="text"
            className={`form-input${showErr('label') ? ' input-error' : ''}`}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (validateAmbulanceLabel(e.target.value) === null) {
                setFieldErrors((prev) => ({ ...prev, label: undefined }));
              }
            }}
            onBlur={() => {
              markTouched('label');
              const err = validateAmbulanceLabel(label);
              setFieldErrors((prev) => ({ ...prev, label: err ?? undefined }));
            }}
            placeholder="e.g., AMB-VP-01"
            maxLength={64}
            disabled={saving}
            aria-describedby={showErr('label') ? 'amb-label-err' : undefined}
          />
          {showErr('label') && <span id="amb-label-err" className="field-error">{showErr('label')}</span>}
        </div>

        {/* Capacity */}
        <div className="form-group">
          <label className="form-label" htmlFor="amb-capacity">Capacity (patients)</label>
          <input
            id="amb-capacity"
            type="number"
            min="1"
            max="20"
            step="1"
            className={`form-input${showErr('capacity') ? ' input-error' : ''}`}
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value);
              if (validateAmbulanceCapacity(e.target.value) === null) {
                setFieldErrors((prev) => ({ ...prev, capacity: undefined }));
              }
            }}
            onBlur={() => {
              markTouched('capacity');
              const err = validateAmbulanceCapacity(capacity);
              setFieldErrors((prev) => ({ ...prev, capacity: err ?? undefined }));
            }}
            disabled={saving}
            aria-describedby={showErr('capacity') ? 'amb-capacity-err' : undefined}
          />
          {showErr('capacity') && <span id="amb-capacity-err" className="field-error">{showErr('capacity')}</span>}
        </div>
      </div>

      {/* Location picker */}
      <LocationPicker
        label="Base Location — click map or enter coordinates"
        value={coords}
        onChange={(pos) => {
          setCoords(pos);
          setFieldErrors((prev) => ({ ...prev, coords: undefined }));
        }}
        contextMarkers={contextMarkers}
      />
      {showErr('coords') && <span className="field-error">{showErr('coords')}</span>}

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            id="amb-available"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            disabled={saving}
          />
          <span>Available for dispatch</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving
            ? <><span className="spinner" /><span>Saving…</span></>
            : <span>{existing ? 'Update Ambulance' : 'Add Ambulance'}</span>}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};
