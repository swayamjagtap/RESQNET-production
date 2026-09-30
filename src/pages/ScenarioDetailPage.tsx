import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Scenario, Hospital, Ambulance, HospitalInsert, AmbulanceInsert, ScenarioUpdate } from '../lib/types';
import { DISASTER_TYPES } from '../lib/types';
import { HospitalForm } from '../components/HospitalForm';
import { AmbulanceForm } from '../components/AmbulanceForm';
import {
  validateScenarioTitle,
  validateDisasterType,
  validateLat,
  validateLng,
  validateCasualtyCount,
} from '../lib/validators';
import { ConfigNotice } from '../components/ConfigNotice';

// ─── Helpers ─────────────────────────────────────────────────────

function Alert({ type, children }: { type: 'error' | 'info' | 'success' | 'warning'; children: React.ReactNode }) {
  const icons = { error: '⚠️', info: 'ℹ️', success: '✅', warning: '⚠️' };
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span aria-hidden>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="spinner-center" aria-label={label} role="status">
      <div className="spinner spinner-lg" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export const ScenarioDetailPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, loading: authLoading, isConfigured } = useAuth();
  const navigate = useNavigate();

  // Scenario state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings form state
  const [title, setTitle] = useState('');
  const [disasterType, setDisasterType] = useState('building_collapse');
  const [incidentLat, setIncidentLat] = useState('');
  const [incidentLng, setIncidentLng] = useState('');
  const [fracture, setFracture] = useState('0');
  const [bloodLoss, setBloodLoss] = useState('0');
  const [unconscious, setUnconscious] = useState('0');
  const [limbLoss, setLimbLoss] = useState('0');
  const [settingsFieldErrors, setSettingsFieldErrors] = useState<Record<string, string>>({});

  // Hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState<string | null>(null);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [savingHospital, setSavingHospital] = useState(false);

  // Ambulances
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loadingAmbulances, setLoadingAmbulances] = useState(true);
  const [ambulanceError, setAmbulanceError] = useState<string | null>(null);
  const [showAmbulanceForm, setShowAmbulanceForm] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);
  const [savingAmbulance, setSavingAmbulance] = useState(false);

  // ─── Load Scenario ──────────────────────────────────────────────

  const loadScenario = useCallback(async () => {
    if (!supabase || !scenarioId) return;
    setLoadingScenario(true);
    setNotFound(false);
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      const s = data as Scenario;
      setScenario(s);
      setTitle(s.title);
      setDisasterType(s.disaster_type ?? 'building_collapse');
      setIncidentLat(s.incident_lat != null ? String(s.incident_lat) : '');
      setIncidentLng(s.incident_lng != null ? String(s.incident_lng) : '');
      setFracture(String(s.fracture ?? 0));
      setBloodLoss(String(s.blood_loss ?? 0));
      setUnconscious(String(s.unconscious ?? 0));
      setLimbLoss(String(s.limb_loss ?? 0));
    }
    setLoadingScenario(false);
  }, [scenarioId]);

  const loadHospitals = useCallback(async () => {
    if (!supabase || !scenarioId) return;
    setLoadingHospitals(true);
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    if (error) setHospitalError(error.message);
    else setHospitals((data ?? []) as Hospital[]);
    setLoadingHospitals(false);
  }, [scenarioId]);

  const loadAmbulances = useCallback(async () => {
    if (!supabase || !scenarioId) return;
    setLoadingAmbulances(true);
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    if (error) setAmbulanceError(error.message);
    else setAmbulances((data ?? []) as Ambulance[]);
    setLoadingAmbulances(false);
  }, [scenarioId]);

  useEffect(() => {
    if (!authLoading && user && isConfigured) {
      loadScenario();
      loadHospitals();
      loadAmbulances();
    } else if (!authLoading) {
      setLoadingScenario(false);
      setLoadingHospitals(false);
      setLoadingAmbulances(false);
    }
  }, [authLoading, user, isConfigured, loadScenario, loadHospitals, loadAmbulances]);

  // ─── Settings Save ──────────────────────────────────────────────

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    const errs: Record<string, string> = {};
    const titleErr = validateScenarioTitle(title);
    if (titleErr) errs.title = titleErr;
    const dtErr = validateDisasterType(disasterType);
    if (dtErr) errs.disasterType = dtErr;
    const latErr = validateLat(incidentLat);
    if (latErr) errs.incidentLat = latErr;
    const lngErr = validateLng(incidentLng);
    if (lngErr) errs.incidentLng = lngErr;
    const fracErr = validateCasualtyCount(fracture, 'Fracture');
    if (fracErr) errs.fracture = fracErr;
    const blErr = validateCasualtyCount(bloodLoss, 'Blood loss');
    if (blErr) errs.bloodLoss = blErr;
    const uncErr = validateCasualtyCount(unconscious, 'Unconscious');
    if (uncErr) errs.unconscious = uncErr;
    const llErr = validateCasualtyCount(limbLoss, 'Limb loss');
    if (llErr) errs.limbLoss = llErr;

    setSettingsFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!supabase || !scenarioId) return;
    setSavingSettings(true);

    const update: ScenarioUpdate = {
      title: title.trim(),
      disaster_type: disasterType as Scenario['disaster_type'],
      incident_lat: incidentLat !== '' ? Number(incidentLat) : null,
      incident_lng: incidentLng !== '' ? Number(incidentLng) : null,
      fracture: Number(fracture),
      blood_loss: Number(bloodLoss),
      unconscious: Number(unconscious),
      limb_loss: Number(limbLoss),
    };

    const { error } = await supabase
      .from('scenarios')
      .update(update)
      .eq('id', scenarioId);

    if (error) {
      setSettingsError(error.message);
    } else {
      setSettingsSuccess('Scenario settings saved.');
      await loadScenario();
    }
    setSavingSettings(false);
  };

  // ─── Hospitals ──────────────────────────────────────────────────

  const handleSaveHospital = async (data: Omit<HospitalInsert, 'scenario_id'>) => {
    if (!supabase || !scenarioId) return;
    setSavingHospital(true);
    setHospitalError(null);

    if (editingHospital) {
      const { error } = await supabase
        .from('hospitals')
        .update(data)
        .eq('id', editingHospital.id);
      if (error) { setHospitalError(error.message); }
      else { setShowHospitalForm(false); setEditingHospital(null); await loadHospitals(); }
    } else {
      const { error } = await supabase
        .from('hospitals')
        .insert([{ scenario_id: scenarioId, ...data }]);
      if (error) { setHospitalError(error.message); }
      else { setShowHospitalForm(false); await loadHospitals(); }
    }
    setSavingHospital(false);
  };

  const handleDeleteHospital = async (hospital: Hospital) => {
    if (!window.confirm(`Delete hospital "${hospital.name}"? This cannot be undone.`)) return;
    if (!supabase) return;
    setHospitalError(null);
    const { error } = await supabase.from('hospitals').delete().eq('id', hospital.id);
    if (error) setHospitalError(error.message);
    else await loadHospitals();
  };

  // ─── Ambulances ─────────────────────────────────────────────────

  const handleSaveAmbulance = async (data: Omit<AmbulanceInsert, 'scenario_id'>) => {
    if (!supabase || !scenarioId) return;
    setSavingAmbulance(true);
    setAmbulanceError(null);

    if (editingAmbulance) {
      const { error } = await supabase
        .from('ambulances')
        .update(data)
        .eq('id', editingAmbulance.id);
      if (error) { setAmbulanceError(error.message); }
      else { setShowAmbulanceForm(false); setEditingAmbulance(null); await loadAmbulances(); }
    } else {
      const { error } = await supabase
        .from('ambulances')
        .insert([{ scenario_id: scenarioId, ...data }]);
      if (error) { setAmbulanceError(error.message); }
      else { setShowAmbulanceForm(false); await loadAmbulances(); }
    }
    setSavingAmbulance(false);
  };

  const handleDeleteAmbulance = async (ambulance: Ambulance) => {
    if (!window.confirm(`Delete ambulance "${ambulance.label}"? This cannot be undone.`)) return;
    if (!supabase) return;
    setAmbulanceError(null);
    const { error } = await supabase.from('ambulances').delete().eq('id', ambulance.id);
    if (error) setAmbulanceError(error.message);
    else await loadAmbulances();
  };

  // ─── Guards ─────────────────────────────────────────────────────

  if (authLoading || loadingScenario) {
    return <Spinner label="Loading scenario…" />;
  }

  if (!isConfigured) {
    return <div className="main-content"><ConfigNotice /></div>;
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
          <h2>Authentication Required</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>Please sign in to view this scenario.</p>
          <Link to="/login" className="btn btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
          <h2>Scenario Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
            This scenario does not exist or you do not have permission to view it.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/workspace')}>
            ← Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  const totalCasualties =
    Number(fracture) + Number(bloodLoss) + Number(unconscious) + Number(limbLoss);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="main-content">
      <nav className="breadcrumb" aria-label="breadcrumb">
        <Link to="/workspace">Workspace</Link>
        <span aria-hidden>›</span>
        <span>{scenario?.title ?? 'Scenario'}</span>
      </nav>

      <header className="page-header">
        <h1>{scenario?.title}</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          ID: <code>{scenarioId}</code> •{' '}
          {scenario?.updated_at
            ? `Last updated ${new Date(scenario.updated_at).toLocaleString()}`
            : `Created ${new Date(scenario?.created_at ?? '').toLocaleString()}`}
        </p>
      </header>

      {/* ── Scenario Settings ── */}
      <section className="card detail-section" aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="section-heading">Scenario Settings</h2>

        {settingsError && <Alert type="error">{settingsError}</Alert>}
        {settingsSuccess && <Alert type="success">{settingsSuccess}</Alert>}

        <form onSubmit={handleSaveSettings} noValidate>
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="s-title">Title</label>
              <input
                id="s-title"
                type="text"
                className={`form-input${settingsFieldErrors.title ? ' input-error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                disabled={savingSettings}
                aria-describedby={settingsFieldErrors.title ? 's-title-err' : undefined}
              />
              {settingsFieldErrors.title && <span id="s-title-err" className="field-error">{settingsFieldErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="s-dtype">Disaster Type</label>
              <select
                id="s-dtype"
                className="form-input"
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                disabled={savingSettings}
              >
                {DISASTER_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {settingsFieldErrors.disasterType && <span className="field-error">{settingsFieldErrors.disasterType}</span>}
            </div>

            <div className="form-group" />

            <div className="form-group">
              <label className="form-label" htmlFor="s-lat">Incident Latitude (optional)</label>
              <input
                id="s-lat"
                type="number"
                step="any"
                className={`form-input${settingsFieldErrors.incidentLat ? ' input-error' : ''}`}
                value={incidentLat}
                onChange={(e) => setIncidentLat(e.target.value)}
                placeholder="19.1136"
                disabled={savingSettings}
              />
              {settingsFieldErrors.incidentLat && <span className="field-error">{settingsFieldErrors.incidentLat}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="s-lng">Incident Longitude (optional)</label>
              <input
                id="s-lng"
                type="number"
                step="any"
                className={`form-input${settingsFieldErrors.incidentLng ? ' input-error' : ''}`}
                value={incidentLng}
                onChange={(e) => setIncidentLng(e.target.value)}
                placeholder="72.8697"
                disabled={savingSettings}
              />
              {settingsFieldErrors.incidentLng && <span className="field-error">{settingsFieldErrors.incidentLng}</span>}
            </div>
          </div>

          {/* Casualty counts */}
          <div className="section-divider" />
          <p className="synthetic-notice" style={{ marginBottom: '1rem' }}>
            ⚠️ Synthetic / illustrative patient counts — not real health records.
          </p>
          <div className="form-grid-4">
            {[
              { id: 's-fracture', label: 'Fracture', value: fracture, set: setFracture, errKey: 'fracture' },
              { id: 's-blood', label: 'Blood Loss', value: bloodLoss, set: setBloodLoss, errKey: 'bloodLoss' },
              { id: 's-uncon', label: 'Unconscious', value: unconscious, set: setUnconscious, errKey: 'unconscious' },
              { id: 's-limb', label: 'Limb Loss', value: limbLoss, set: setLimbLoss, errKey: 'limbLoss' },
            ].map(({ id, label, value, set, errKey }) => (
              <div className="form-group" key={id}>
                <label className="form-label" htmlFor={id}>{label}</label>
                <input
                  id={id}
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  className={`form-input${settingsFieldErrors[errKey] ? ' input-error' : ''}`}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  disabled={savingSettings}
                />
                {settingsFieldErrors[errKey] && <span className="field-error">{settingsFieldErrors[errKey]}</span>}
              </div>
            ))}
          </div>
          <p className="casualty-total">
            Total simulated patients: <strong>{isNaN(totalCasualties) ? '—' : totalCasualties}</strong>
          </p>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? <><span className="spinner" /><span>Saving…</span></> : <span>Save Settings</span>}
            </button>
          </div>
        </form>
      </section>

      {/* ── Hospitals ── */}
      <section className="card detail-section" aria-labelledby="hospitals-heading">
        <div className="section-header-row">
          <h2 id="hospitals-heading" className="section-heading">Hospitals</h2>
          {!showHospitalForm && (
            <button
              className="btn btn-secondary"
              onClick={() => { setShowHospitalForm(true); setEditingHospital(null); }}
            >
              + Add Hospital
            </button>
          )}
        </div>

        {hospitalError && <Alert type="error">{hospitalError}</Alert>}

        {showHospitalForm && (
          <div className="sub-form-card">
            <h3>{editingHospital ? 'Edit Hospital' : 'New Hospital'}</h3>
            <HospitalForm
              scenarioId={scenarioId!}
              existing={editingHospital ?? undefined}
              onSave={handleSaveHospital}
              onCancel={() => { setShowHospitalForm(false); setEditingHospital(null); }}
              saving={savingHospital}
            />
          </div>
        )}

        {loadingHospitals ? (
          <Spinner label="Loading hospitals…" />
        ) : hospitals.length === 0 ? (
          <div className="empty-state">
            <p>No hospitals added to this scenario yet.</p>
          </div>
        ) : (
          <div className="resource-list" role="list" aria-label="Hospitals">
            {hospitals.map((h) => (
              <div key={h.id} className="resource-item" role="listitem">
                <div className="resource-info">
                  <span className="resource-name">🏥 {h.name}</span>
                  <span className="resource-meta">
                    {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                    {' · '}ICU: {h.icu_beds} · Blood: {h.blood_units} · Vent: {h.ventilators} · Gen: {h.general_beds}
                  </span>
                </div>
                <div className="resource-actions">
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => { setEditingHospital(h); setShowHospitalForm(true); }}
                    aria-label={`Edit ${h.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => handleDeleteHospital(h)}
                    aria-label={`Delete ${h.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ambulances ── */}
      <section className="card detail-section" aria-labelledby="ambulances-heading">
        <div className="section-header-row">
          <h2 id="ambulances-heading" className="section-heading">Ambulances</h2>
          {!showAmbulanceForm && (
            <button
              className="btn btn-secondary"
              onClick={() => { setShowAmbulanceForm(true); setEditingAmbulance(null); }}
            >
              + Add Ambulance
            </button>
          )}
        </div>

        {ambulanceError && <Alert type="error">{ambulanceError}</Alert>}

        {showAmbulanceForm && (
          <div className="sub-form-card">
            <h3>{editingAmbulance ? 'Edit Ambulance' : 'New Ambulance'}</h3>
            <AmbulanceForm
              existing={editingAmbulance ?? undefined}
              onSave={handleSaveAmbulance}
              onCancel={() => { setShowAmbulanceForm(false); setEditingAmbulance(null); }}
              saving={savingAmbulance}
            />
          </div>
        )}

        {loadingAmbulances ? (
          <Spinner label="Loading ambulances…" />
        ) : ambulances.length === 0 ? (
          <div className="empty-state">
            <p>No ambulances added to this scenario yet.</p>
          </div>
        ) : (
          <div className="resource-list" role="list" aria-label="Ambulances">
            {ambulances.map((a) => (
              <div key={a.id} className="resource-item" role="listitem">
                <div className="resource-info">
                  <span className="resource-name">🚑 {a.label}</span>
                  <span className="resource-meta">
                    Base: {a.base_lat.toFixed(4)}, {a.base_lng.toFixed(4)}
                    {' · '}Cap: {a.capacity}
                    {' · '}<span className={a.available ? 'status-available' : 'status-unavailable'}>
                      {a.available ? '● Available' : '● Deployed'}
                    </span>
                  </span>
                </div>
                <div className="resource-actions">
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => { setEditingAmbulance(a); setShowAmbulanceForm(true); }}
                    aria-label={`Edit ambulance ${a.label}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => handleDeleteAmbulance(a)}
                    aria-label={`Delete ambulance ${a.label}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
