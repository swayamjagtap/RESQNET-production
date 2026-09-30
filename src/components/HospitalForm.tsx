import React, { useState } from 'react';
import type { Hospital, HospitalInsert } from '../lib/types';
import {
  validateHospitalName,
  validateRequiredLat,
  validateRequiredLng,
  validateInventory,
} from '../lib/validators';
import { LocationPicker } from './LocationPicker';
import type { LatLng, ContextMarker } from './LocationPicker';

interface Props {
  scenarioId: string;
  existing?: Hospital;
  onSave: (data: Omit<HospitalInsert, 'scenario_id'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  contextMarkers?: ContextMarker[];
}

interface FieldErrors {
  name?: string;
  coords?: string;
  icu_beds?: string;
  blood_units?: string;
  ventilators?: string;
  general_beds?: string;
}

export const HospitalForm: React.FC<Props> = ({
  existing,
  onSave,
  onCancel,
  saving,
  contextMarkers = [],
}) => {
  const [name, setName] = useState(existing?.name ?? '');
  // Coordinates managed through LocationPicker
  const [coords, setCoords] = useState<LatLng | null>(
    existing?.lat != null && existing?.lng != null
      ? { lat: existing.lat, lng: existing.lng }
      : null,
  );
  const [icuBeds, setIcuBeds] = useState(existing?.icu_beds?.toString() ?? '0');
  const [bloodUnits, setBloodUnits] = useState(existing?.blood_units?.toString() ?? '0');
  const [ventilators, setVentilators] = useState(existing?.ventilators?.toString() ?? '0');
  const [generalBeds, setGeneralBeds] = useState(existing?.general_beds?.toString() ?? '0');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Track touched for blur-only error display
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const nameErr = validateHospitalName(name);
    if (nameErr) errs.name = nameErr;
    // Coordinates: validate using the same rules as before
    if (!coords) {
      errs.coords = 'Location is required. Click the map or enter coordinates.';
    } else {
      const latErr = validateRequiredLat(coords.lat);
      const lngErr = validateRequiredLng(coords.lng);
      if (latErr || lngErr) errs.coords = latErr ?? lngErr ?? 'Invalid coordinates.';
    }
    const icuErr = validateInventory(icuBeds, 'ICU beds');
    if (icuErr) errs.icu_beds = icuErr;
    const blErr = validateInventory(bloodUnits, 'Blood units');
    if (blErr) errs.blood_units = blErr;
    const ventErr = validateInventory(ventilators, 'Ventilators');
    if (ventErr) errs.ventilators = ventErr;
    const genErr = validateInventory(generalBeds, 'General beds');
    if (genErr) errs.general_beds = genErr;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched on submit so errors show
    setTouched({ name: true, coords: true, icu_beds: true, blood_units: true, ventilators: true, general_beds: true });
    if (!validate()) return;
    await onSave({
      name: name.trim(),
      lat: coords!.lat,
      lng: coords!.lng,
      icu_beds: Number(icuBeds),
      blood_units: Number(bloodUnits),
      ventilators: Number(ventilators),
      general_beds: Number(generalBeds),
    });
  };

  // Only show field error if touched or if submit was attempted
  const showErr = (key: keyof FieldErrors) =>
    touched[key] ? fieldErrors[key] : undefined;

  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  return (
    <form onSubmit={handleSubmit} aria-label={existing ? 'Edit hospital' : 'Add hospital'}>
      {/* Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="hosp-name">Hospital Name</label>
        <input
          id="hosp-name"
          type="text"
          className={`form-input${showErr('name') ? ' input-error' : ''}`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            // Clear error immediately once valid
            if (validateHospitalName(e.target.value) === null) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          onBlur={() => {
            markTouched('name');
            const err = validateHospitalName(name);
            setFieldErrors((prev) => ({ ...prev, name: err ?? undefined }));
          }}
          placeholder="e.g., Vile Parle Civic Hospital"
          maxLength={255}
          disabled={saving}
          aria-describedby={showErr('name') ? 'hosp-name-err' : undefined}
        />
        {showErr('name') && <span id="hosp-name-err" className="field-error">{showErr('name')}</span>}
      </div>

      {/* Location picker */}
      <LocationPicker
        label="Location — click map or enter coordinates"
        value={coords}
        onChange={(pos) => {
          setCoords(pos);
          setFieldErrors((prev) => ({ ...prev, coords: undefined }));
        }}
        contextMarkers={contextMarkers}
      />
      {showErr('coords') && <span className="field-error">{showErr('coords')}</span>}

      <p className="synthetic-notice">
        ⚠️ Synthetic / illustrative data — not real hospital inventory.
      </p>

      {/* Inventory — 4-column grid, minmax(0,1fr) prevents overflow */}
      <div className="form-grid-4">
        {[
          { id: 'hosp-icu', label: 'ICU Beds', value: icuBeds, set: setIcuBeds, errKey: 'icu_beds' as const },
          { id: 'hosp-blood', label: 'Blood Units', value: bloodUnits, set: setBloodUnits, errKey: 'blood_units' as const },
          { id: 'hosp-vent', label: 'Ventilators', value: ventilators, set: setVentilators, errKey: 'ventilators' as const },
          { id: 'hosp-gen', label: 'General Beds', value: generalBeds, set: setGeneralBeds, errKey: 'general_beds' as const },
        ].map(({ id, label, value, set, errKey }) => (
          <div className="form-group" key={id}>
            <label className="form-label" htmlFor={id}>{label}</label>
            <input
              id={id}
              type="number"
              min="0"
              step="1"
              className={`form-input${showErr(errKey) ? ' input-error' : ''}`}
              value={value}
              onChange={(e) => {
                set(e.target.value);
                if (validateInventory(e.target.value, label) === null) {
                  setFieldErrors((prev) => ({ ...prev, [errKey]: undefined }));
                }
              }}
              onBlur={() => {
                markTouched(errKey);
                const err = validateInventory(value, label);
                setFieldErrors((prev) => ({ ...prev, [errKey]: err ?? undefined }));
              }}
              disabled={saving}
            />
            {showErr(errKey) && <span className="field-error">{showErr(errKey)}</span>}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving
            ? <><span className="spinner" /><span>Saving…</span></>
            : <span>{existing ? 'Update Hospital' : 'Add Hospital'}</span>}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};
