import React, { useState } from 'react';
import type { Ambulance, AmbulanceInsert } from '../lib/types';
import {
  validateAmbulanceLabel,
  validateRequiredLat,
  validateRequiredLng,
  validateAmbulanceCapacity,
} from '../lib/validators';

interface Props {
  existing?: Ambulance;
  onSave: (data: Omit<AmbulanceInsert, 'scenario_id'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

interface FieldErrors {
  label?: string;
  base_lat?: string;
  base_lng?: string;
  capacity?: string;
}

export const AmbulanceForm: React.FC<Props> = ({ existing, onSave, onCancel, saving }) => {
  const [label, setLabel] = useState(existing?.label ?? '');
  const [baseLat, setBaseLat] = useState(existing?.base_lat?.toString() ?? '');
  const [baseLng, setBaseLng] = useState(existing?.base_lng?.toString() ?? '');
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() ?? '2');
  const [available, setAvailable] = useState(existing?.available ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errs: FieldErrors = {
      label: validateAmbulanceLabel(label) ?? undefined,
      base_lat: validateRequiredLat(baseLat) ?? undefined,
      base_lng: validateRequiredLng(baseLng) ?? undefined,
      capacity: validateAmbulanceCapacity(capacity) ?? undefined,
    };
    setFieldErrors(errs);
    return Object.values(errs).every((v) => v === undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      label: label.trim(),
      base_lat: Number(baseLat),
      base_lng: Number(baseLng),
      capacity: Number(capacity),
      available,
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-label={existing ? 'Edit ambulance' : 'Add ambulance'}>
      <p className="synthetic-notice">
        ⚠️ Synthetic / illustrative data — not real emergency vehicle records.
      </p>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="amb-label">Unit Label</label>
          <input
            id="amb-label"
            type="text"
            className={`form-input${fieldErrors.label ? ' input-error' : ''}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., AMB-VP-01"
            maxLength={64}
            disabled={saving}
            aria-describedby={fieldErrors.label ? 'amb-label-err' : undefined}
          />
          {fieldErrors.label && <span id="amb-label-err" className="field-error">{fieldErrors.label}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amb-capacity">Capacity (patients)</label>
          <input
            id="amb-capacity"
            type="number"
            min="1"
            max="20"
            step="1"
            className={`form-input${fieldErrors.capacity ? ' input-error' : ''}`}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={saving}
            aria-describedby={fieldErrors.capacity ? 'amb-capacity-err' : undefined}
          />
          {fieldErrors.capacity && <span id="amb-capacity-err" className="field-error">{fieldErrors.capacity}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amb-lat">Base Latitude</label>
          <input
            id="amb-lat"
            type="number"
            step="any"
            className={`form-input${fieldErrors.base_lat ? ' input-error' : ''}`}
            value={baseLat}
            onChange={(e) => setBaseLat(e.target.value)}
            placeholder="19.1072"
            disabled={saving}
            aria-describedby={fieldErrors.base_lat ? 'amb-lat-err' : undefined}
          />
          {fieldErrors.base_lat && <span id="amb-lat-err" className="field-error">{fieldErrors.base_lat}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amb-lng">Base Longitude</label>
          <input
            id="amb-lng"
            type="number"
            step="any"
            className={`form-input${fieldErrors.base_lng ? ' input-error' : ''}`}
            value={baseLng}
            onChange={(e) => setBaseLng(e.target.value)}
            placeholder="72.8478"
            disabled={saving}
            aria-describedby={fieldErrors.base_lng ? 'amb-lng-err' : undefined}
          />
          {fieldErrors.base_lng && <span id="amb-lng-err" className="field-error">{fieldErrors.base_lng}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            disabled={saving}
            id="amb-available"
          />
          <span>Available for dispatch</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" /><span>Saving…</span></> : <span>{existing ? 'Update Ambulance' : 'Add Ambulance'}</span>}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};
