import React, { useState } from 'react';
import type { Hospital, HospitalInsert } from '../lib/types';
import {
  validateHospitalName,
  validateRequiredLat,
  validateRequiredLng,
  validateInventory,
} from '../lib/validators';

interface Props {
  scenarioId: string;
  existing?: Hospital;
  onSave: (data: Omit<HospitalInsert, 'scenario_id'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

interface FieldErrors {
  name?: string;
  lat?: string;
  lng?: string;
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
}) => {
  const [name, setName] = useState(existing?.name ?? '');
  const [lat, setLat] = useState(existing?.lat?.toString() ?? '');
  const [lng, setLng] = useState(existing?.lng?.toString() ?? '');
  const [icuBeds, setIcuBeds] = useState(existing?.icu_beds?.toString() ?? '0');
  const [bloodUnits, setBloodUnits] = useState(existing?.blood_units?.toString() ?? '0');
  const [ventilators, setVentilators] = useState(existing?.ventilators?.toString() ?? '0');
  const [generalBeds, setGeneralBeds] = useState(existing?.general_beds?.toString() ?? '0');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errs: FieldErrors = {
      name: validateHospitalName(name) ?? undefined,
      lat: validateRequiredLat(lat) ?? undefined,
      lng: validateRequiredLng(lng) ?? undefined,
      icu_beds: validateInventory(icuBeds, 'ICU beds') ?? undefined,
      blood_units: validateInventory(bloodUnits, 'Blood units') ?? undefined,
      ventilators: validateInventory(ventilators, 'Ventilators') ?? undefined,
      general_beds: validateInventory(generalBeds, 'General beds') ?? undefined,
    };
    setFieldErrors(errs);
    return Object.values(errs).every((v) => v === undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      icu_beds: Number(icuBeds),
      blood_units: Number(bloodUnits),
      ventilators: Number(ventilators),
      general_beds: Number(generalBeds),
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-label={existing ? 'Edit hospital' : 'Add hospital'}>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="hosp-name">Hospital Name</label>
          <input
            id="hosp-name"
            type="text"
            className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Vile Parle Civic Hospital"
            maxLength={255}
            disabled={saving}
            aria-describedby={fieldErrors.name ? 'hosp-name-err' : undefined}
          />
          {fieldErrors.name && <span id="hosp-name-err" className="field-error">{fieldErrors.name}</span>}
        </div>

        <div className="form-group" />

        <div className="form-group">
          <label className="form-label" htmlFor="hosp-lat">Latitude</label>
          <input
            id="hosp-lat"
            type="number"
            step="any"
            className={`form-input${fieldErrors.lat ? ' input-error' : ''}`}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="19.1136"
            disabled={saving}
            aria-describedby={fieldErrors.lat ? 'hosp-lat-err' : undefined}
          />
          {fieldErrors.lat && <span id="hosp-lat-err" className="field-error">{fieldErrors.lat}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="hosp-lng">Longitude</label>
          <input
            id="hosp-lng"
            type="number"
            step="any"
            className={`form-input${fieldErrors.lng ? ' input-error' : ''}`}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="72.8697"
            disabled={saving}
            aria-describedby={fieldErrors.lng ? 'hosp-lng-err' : undefined}
          />
          {fieldErrors.lng && <span id="hosp-lng-err" className="field-error">{fieldErrors.lng}</span>}
        </div>
      </div>

      <p className="synthetic-notice">
        ⚠️ Synthetic / illustrative data — not real hospital inventory.
      </p>

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
              className={`form-input${fieldErrors[errKey] ? ' input-error' : ''}`}
              value={value}
              onChange={(e) => set(e.target.value)}
              disabled={saving}
              aria-describedby={fieldErrors[errKey] ? `${id}-err` : undefined}
            />
            {fieldErrors[errKey] && <span id={`${id}-err`} className="field-error">{fieldErrors[errKey]}</span>}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" /><span>Saving…</span></> : <span>{existing ? 'Update Hospital' : 'Add Hospital'}</span>}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};
