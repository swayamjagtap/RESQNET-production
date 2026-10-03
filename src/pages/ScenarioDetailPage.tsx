import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  useParams,
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import type {
  Scenario,
  Hospital,
  Ambulance,
  HospitalInsert,
  AmbulanceInsert,
  ScenarioUpdate,
} from '../lib/types';

import { DISASTER_TYPES } from '../lib/types';

import { HospitalForm } from '../components/HospitalForm';
import { AmbulanceForm } from '../components/AmbulanceForm';
import { LocationPicker } from '../components/LocationPicker';

import type {
  LatLng,
  ContextMarker,
} from '../components/LocationPicker';

import {
  validateScenarioTitle,
  validateDisasterType,
  validateCasualtyCount,
} from '../lib/validators';

import { ConfigNotice } from '../components/ConfigNotice';

/* =========================================================
   SMALL HELPERS
   ========================================================= */

function Alert({
  type,
  children,
}: {
  type: 'error' | 'info' | 'success' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`scenario-alert scenario-alert-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div
      className="scenario-loading"
      aria-label={label}
      role="status"
    >
      <div className="spinner scenario-loading-spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function formatDisasterType(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export const ScenarioDetailPage: React.FC = () => {
  const { scenarioId } = useParams<{
    scenarioId: string;
  }>();

  const {
    user,
    loading: authLoading,
    isConfigured,
  } = useAuth();

  const navigate = useNavigate();

  /* ---------------- Scenario ---------------- */

  const [scenario, setScenario] =
    useState<Scenario | null>(null);

  const [loadingScenario, setLoadingScenario] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [settingsError, setSettingsError] =
    useState<string | null>(null);

  const [settingsSuccess, setSettingsSuccess] =
    useState<string | null>(null);

  const [savingSettings, setSavingSettings] =
    useState(false);

  /* ---------------- Scenario form ---------------- */

  const [title, setTitle] =
    useState('');

  const [disasterType, setDisasterType] =
    useState('building_collapse');

  const [incidentCoords, setIncidentCoords] =
    useState<LatLng | null>(null);

  const [fracture, setFracture] =
    useState('0');

  const [bloodLoss, setBloodLoss] =
    useState('0');

  const [unconscious, setUnconscious] =
    useState('0');

  const [limbLoss, setLimbLoss] =
    useState('0');

  const [
    settingsFieldErrors,
    setSettingsFieldErrors,
  ] = useState<Record<string, string>>({});

  const [
    settingsTouched,
    setSettingsTouched,
  ] = useState<Record<string, boolean>>({});

  /* ---------------- Hospitals ---------------- */

  const [hospitals, setHospitals] =
    useState<Hospital[]>([]);

  const [
    loadingHospitals,
    setLoadingHospitals,
  ] = useState(true);

  const [
    hospitalError,
    setHospitalError,
  ] = useState<string | null>(null);

  const [
    showHospitalForm,
    setShowHospitalForm,
  ] = useState(false);

  const [
    editingHospital,
    setEditingHospital,
  ] = useState<Hospital | null>(null);

  const [
    savingHospital,
    setSavingHospital,
  ] = useState(false);

  /* ---------------- Ambulances ---------------- */

  const [ambulances, setAmbulances] =
    useState<Ambulance[]>([]);

  const [
    loadingAmbulances,
    setLoadingAmbulances,
  ] = useState(true);

  const [
    ambulanceError,
    setAmbulanceError,
  ] = useState<string | null>(null);

  const [
    showAmbulanceForm,
    setShowAmbulanceForm,
  ] = useState(false);

  const [
    editingAmbulance,
    setEditingAmbulance,
  ] = useState<Ambulance | null>(null);

  const [
    savingAmbulance,
    setSavingAmbulance,
  ] = useState(false);

  /* =========================================================
     DATA LOADING
     ========================================================= */

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
      const loadedScenario = data as Scenario;

      setScenario(loadedScenario);
      setTitle(loadedScenario.title);

      setDisasterType(
        loadedScenario.disaster_type ??
        'building_collapse',
      );

      setIncidentCoords(
        loadedScenario.incident_lat != null &&
          loadedScenario.incident_lng != null
          ? {
            lat: loadedScenario.incident_lat,
            lng: loadedScenario.incident_lng,
          }
          : null,
      );

      setFracture(
        String(loadedScenario.fracture ?? 0),
      );

      setBloodLoss(
        String(loadedScenario.blood_loss ?? 0),
      );

      setUnconscious(
        String(loadedScenario.unconscious ?? 0),
      );

      setLimbLoss(
        String(loadedScenario.limb_loss ?? 0),
      );
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
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      setHospitalError(error.message);
    } else {
      setHospitals(
        (data ?? []) as Hospital[],
      );
    }

    setLoadingHospitals(false);
  }, [scenarioId]);

  const loadAmbulances = useCallback(async () => {
    if (!supabase || !scenarioId) return;

    setLoadingAmbulances(true);

    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      setAmbulanceError(error.message);
    } else {
      setAmbulances(
        (data ?? []) as Ambulance[],
      );
    }

    setLoadingAmbulances(false);
  }, [scenarioId]);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      isConfigured
    ) {
      loadScenario();
      loadHospitals();
      loadAmbulances();
    } else if (!authLoading) {
      setLoadingScenario(false);
      setLoadingHospitals(false);
      setLoadingAmbulances(false);
    }
  }, [
    authLoading,
    user,
    isConfigured,
    loadScenario,
    loadHospitals,
    loadAmbulances,
  ]);

  /* =========================================================
     SAVE SCENARIO SETTINGS
     ========================================================= */

  const handleSaveSettings = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setSettingsError(null);
    setSettingsSuccess(null);

    setSettingsTouched({
      title: true,
      disasterType: true,
      fracture: true,
      bloodLoss: true,
      unconscious: true,
      limbLoss: true,
    });

    const errors: Record<string, string> = {};

    const titleError =
      validateScenarioTitle(title);

    if (titleError) {
      errors.title = titleError;
    }

    const disasterTypeError =
      validateDisasterType(disasterType);

    if (disasterTypeError) {
      errors.disasterType =
        disasterTypeError;
    }

    const fractureError =
      validateCasualtyCount(
        fracture,
        'Fracture',
      );

    if (fractureError) {
      errors.fracture = fractureError;
    }

    const bloodLossError =
      validateCasualtyCount(
        bloodLoss,
        'Blood loss',
      );

    if (bloodLossError) {
      errors.bloodLoss = bloodLossError;
    }

    const unconsciousError =
      validateCasualtyCount(
        unconscious,
        'Unconscious',
      );

    if (unconsciousError) {
      errors.unconscious =
        unconsciousError;
    }

    const limbLossError =
      validateCasualtyCount(
        limbLoss,
        'Limb loss',
      );

    if (limbLossError) {
      errors.limbLoss =
        limbLossError;
    }

    setSettingsFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!supabase || !scenarioId) {
      return;
    }

    setSavingSettings(true);

    const update: ScenarioUpdate = {
      title: title.trim(),

      disaster_type:
        disasterType as Scenario['disaster_type'],

      incident_lat:
        incidentCoords?.lat ?? null,

      incident_lng:
        incidentCoords?.lng ?? null,

      fracture: Number(fracture),

      blood_loss:
        Number(bloodLoss),

      unconscious:
        Number(unconscious),

      limb_loss:
        Number(limbLoss),
    };

    const { error } = await supabase
      .from('scenarios')
      .update(update)
      .eq('id', scenarioId);

    if (error) {
      setSettingsError(error.message);
    } else {
      setSettingsSuccess(
        'Scenario configuration saved.',
      );

      await loadScenario();
    }

    setSavingSettings(false);
  };

  const showSettingsError = (
    key: string,
  ) =>
    settingsTouched[key]
      ? settingsFieldErrors[key]
      : undefined;

  const markSettingsTouched = (
    key: string,
    validator: () => string | null,
  ) => {
    setSettingsTouched((current) => ({
      ...current,
      [key]: true,
    }));

    const error = validator();

    setSettingsFieldErrors(
      (current) => ({
        ...current,
        [key]: error ?? '',
      }),
    );
  };

  /* =========================================================
     HOSPITAL CRUD
     ========================================================= */

  const handleSaveHospital = async (
    data: Omit<
      HospitalInsert,
      'scenario_id'
    >,
  ) => {
    if (!supabase || !scenarioId) return;

    setSavingHospital(true);
    setHospitalError(null);

    if (editingHospital) {
      const { error } = await supabase
        .from('hospitals')
        .update(data)
        .eq('id', editingHospital.id);

      if (error) {
        setHospitalError(error.message);
      } else {
        setShowHospitalForm(false);
        setEditingHospital(null);

        await loadHospitals();
      }
    } else {
      const { error } = await supabase
        .from('hospitals')
        .insert([
          {
            scenario_id: scenarioId,
            ...data,
          },
        ]);

      if (error) {
        setHospitalError(error.message);
      } else {
        setShowHospitalForm(false);

        await loadHospitals();
      }
    }

    setSavingHospital(false);
  };

  const handleDeleteHospital = async (
    hospital: Hospital,
  ) => {
    const confirmed = window.confirm(
      `Delete hospital "${hospital.name}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed || !supabase) {
      return;
    }

    setHospitalError(null);

    const { error } = await supabase
      .from('hospitals')
      .delete()
      .eq('id', hospital.id);

    if (error) {
      setHospitalError(error.message);
    } else {
      await loadHospitals();
    }
  };

  /* =========================================================
     AMBULANCE CRUD
     ========================================================= */

  const handleSaveAmbulance = async (
    data: Omit<
      AmbulanceInsert,
      'scenario_id'
    >,
  ) => {
    if (!supabase || !scenarioId) return;

    setSavingAmbulance(true);
    setAmbulanceError(null);

    if (editingAmbulance) {
      const { error } = await supabase
        .from('ambulances')
        .update(data)
        .eq('id', editingAmbulance.id);

      if (error) {
        setAmbulanceError(error.message);
      } else {
        setShowAmbulanceForm(false);
        setEditingAmbulance(null);

        await loadAmbulances();
      }
    } else {
      const { error } = await supabase
        .from('ambulances')
        .insert([
          {
            scenario_id: scenarioId,
            ...data,
          },
        ]);

      if (error) {
        setAmbulanceError(error.message);
      } else {
        setShowAmbulanceForm(false);

        await loadAmbulances();
      }
    }

    setSavingAmbulance(false);
  };

  const handleDeleteAmbulance = async (
    ambulance: Ambulance,
  ) => {
    const confirmed = window.confirm(
      `Delete ambulance "${ambulance.label}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed || !supabase) {
      return;
    }

    setAmbulanceError(null);

    const { error } = await supabase
      .from('ambulances')
      .delete()
      .eq('id', ambulance.id);

    if (error) {
      setAmbulanceError(error.message);
    } else {
      await loadAmbulances();
    }
  };

  /* =========================================================
     MAP CONTEXT
     ========================================================= */

  const contextMarkers: ContextMarker[] = [
    ...hospitals.map((hospital) => ({
      kind: 'hospital' as const,
      lat: hospital.lat,
      lng: hospital.lng,
      label: hospital.name,
    })),

    ...ambulances.map((ambulance) => ({
      kind: 'ambulance' as const,
      lat: ambulance.base_lat,
      lng: ambulance.base_lng,
      label: ambulance.label,
    })),
  ];

  const incidentContextMarker:
    ContextMarker[] = incidentCoords
      ? [
        {
          kind: 'incident' as const,
          lat: incidentCoords.lat,
          lng: incidentCoords.lng,
          label: 'Incident',
        },
      ]
      : [];

  /* =========================================================
     GUARDS
     ========================================================= */

  if (
    authLoading ||
    loadingScenario
  ) {
    return (
      <Spinner label="Loading scenario…" />
    );
  }

  if (!isConfigured) {
    return (
      <div className="main-content">
        <ConfigNotice />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="scenario-detail-page">
        <div className="scenario-guard-card">
          <div className="scenario-guard-icon">
            R
          </div>

          <h1>Sign in to continue.</h1>

          <p>
            This scenario belongs to a
            RESQNET workspace and requires
            authentication.
          </p>

          <Link
            to="/login"
            className="btn btn-primary"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="scenario-detail-page">
        <div className="scenario-guard-card">
          <div className="scenario-guard-icon">
            ?
          </div>

          <h1>Scenario not found.</h1>

          <p>
            The scenario does not exist or
            your account does not have access
            to it.
          </p>

          <button
            className="btn btn-secondary"
            onClick={() =>
              navigate('/workspace')
            }
          >
            ← Back to workspace
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     DERIVED STATE
     ========================================================= */

  const totalCasualties =
    Number(fracture) +
    Number(bloodLoss) +
    Number(unconscious) +
    Number(limbLoss);

  const availableAmbulances =
    ambulances.filter(
      (ambulance) =>
        ambulance.available,
    ).length;

  const totalAmbulanceCapacity =
    ambulances.reduce(
      (total, ambulance) =>
        total + ambulance.capacity,
      0,
    );

  const hasIncidentLocation =
    incidentCoords != null;

  const hasCasualties =
    !Number.isNaN(totalCasualties) &&
    totalCasualties > 0;

  const hasHospitals =
    hospitals.length > 0;

  const hasAmbulances =
    ambulances.length > 0;

  const readyChecks = [
    {
      label: 'Incident location',
      ready: hasIncidentLocation,
    },
    {
      label: 'Casualty demand',
      ready: hasCasualties,
    },
    {
      label: 'Hospital resources',
      ready: hasHospitals,
    },
    {
      label: 'Ambulance fleet',
      ready: hasAmbulances,
    },
  ];

  const readyCount =
    readyChecks.filter(
      (check) => check.ready,
    ).length;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main className="scenario-detail-page">
      <style>
        {`
          .scenario-detail-page {
            width: min(100% - 3rem, 1180px);

            margin: 0 auto;

            padding:
              2.8rem 0
              5rem;
          }

          .scenario-loading {
            min-height: 420px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .scenario-loading-spinner {
            width: 32px;
            height: 32px;
          }

          /* =========================================
             BREADCRUMB
             ========================================= */

          .scenario-breadcrumb {
            display: flex;
            align-items: center;

            gap: 0.5rem;

            margin-bottom: 1.25rem;

            color: #607087;

            font-size: 0.74rem;
          }

          .scenario-breadcrumb a {
            color: #7dd3fc;

            text-decoration: none;

            font-weight: 700;
          }

          .scenario-breadcrumb a:hover {
            color: #bae6fd;
          }

          /* =========================================
             HERO
             ========================================= */

          .scenario-hero {
            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              auto;

            gap: 2rem;

            align-items: end;

            margin-bottom: 2rem;
          }

          .scenario-eyebrow {
            margin-bottom: 0.65rem;

            color: #38bdf8;

            font-size: 0.7rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .scenario-hero h1 {
            margin: 0;

            color: #f8fafc;

            font-size: 2.65rem;
            line-height: 1.08;
            letter-spacing: -0.04em;
          }

          .scenario-meta {
            display: flex;
            align-items: center;

            flex-wrap: wrap;

            gap: 0.55rem;

            margin-top: 0.85rem;

            color: #718198;

            font-size: 0.73rem;
          }

          .scenario-meta-badge {
            display: inline-flex;
            align-items: center;

            min-height: 25px;

            padding: 0 0.55rem;

            border: 1px solid rgba(56, 189, 248, 0.18);
            border-radius: 999px;

            color: #7dd3fc;

            background: rgba(56, 189, 248, 0.05);

            font-size: 0.64rem;
            font-weight: 800;

            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .scenario-run-button {
            min-height: 46px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 1.2rem;

            border-radius: 10px;

            color: #07111d;

            background:
              linear-gradient(
                90deg,
                #38bdf8,
                #67c8f5 35%,
                #8b5cf6
              );

            font-size: 0.84rem;
            font-weight: 850;

            text-decoration: none;

            box-shadow:
              0 12px 32px rgba(56, 189, 248, 0.1);

            transition:
              transform 150ms ease,
              filter 150ms ease;
          }

          .scenario-run-button:hover {
            transform:
              translateY(-1px);

            filter: brightness(1.05);
          }

          /* =========================================
             SUMMARY STRIP
             ========================================= */

          .scenario-summary {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 0.85rem;

            margin-bottom: 1.5rem;
          }

          .scenario-summary-card {
            padding: 1rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.13);

            border-radius: 12px;

            background:
              rgba(15, 23, 42, 0.44);
          }

          .scenario-summary-label {
            color: #66768d;

            font-size: 0.65rem;
            font-weight: 800;

            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .scenario-summary-value {
            display: block;

            margin-top: 0.35rem;

            color: #f8fafc;

            font-size: 1.35rem;
            font-weight: 800;
          }

          .scenario-summary-note {
            display: block;

            margin-top: 0.3rem;

            color: #66768d;

            font-size: 0.68rem;
          }

          /* =========================================
             READINESS
             ========================================= */

          .scenario-readiness {
            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              auto;

            gap: 1rem;

            align-items: center;

            margin-bottom: 1.5rem;

            padding: 1rem 1.1rem;

            border:
              1px solid
              rgba(139, 92, 246, 0.18);

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.045),
                rgba(139, 92, 246, 0.045),
                rgba(244, 63, 94, 0.025)
              );
          }

          .scenario-readiness-title {
            margin: 0;

            color: #e7edf6;

            font-size: 0.86rem;
            font-weight: 750;
          }

          .scenario-readiness-copy {
            margin: 0.3rem 0 0;

            color: #718198;

            font-size: 0.74rem;
            line-height: 1.5;
          }

          .scenario-readiness-checks {
            display: flex;
            align-items: center;

            gap: 0.45rem;

            flex-wrap: wrap;

            justify-content: flex-end;
          }

          .scenario-ready-chip {
            min-height: 29px;

            display: inline-flex;
            align-items: center;

            gap: 0.35rem;

            padding: 0 0.6rem;

            border-radius: 999px;

            font-size: 0.64rem;
            font-weight: 750;
          }

          .scenario-ready-chip.is-ready {
            color: #7dd3fc;

            border:
              1px solid
              rgba(56, 189, 248, 0.18);

            background:
              rgba(56, 189, 248, 0.055);
          }

          .scenario-ready-chip.is-pending {
            color: #9aa7b8;

            border:
              1px solid
              rgba(148, 163, 184, 0.13);

            background:
              rgba(148, 163, 184, 0.035);
          }

          .scenario-ready-dot {
            width: 6px;
            height: 6px;

            border-radius: 999px;

            background: currentColor;
          }

          /* =========================================
             MAIN CARD SYSTEM
             ========================================= */

          .scenario-section {
            margin-top: 1.25rem;

            overflow: hidden;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            border-radius: 16px;

            background:
              linear-gradient(
                180deg,
                rgba(17, 27, 45, 0.88),
                rgba(13, 21, 36, 0.92)
              );
          }

          .scenario-section-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 1rem;

            padding: 1.4rem 1.5rem;

            border-bottom:
              1px solid
              rgba(148, 163, 184, 0.1);
          }

          .scenario-section-kicker {
            margin-bottom: 0.4rem;

            color: #38bdf8;

            font-size: 0.65rem;
            font-weight: 800;

            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .scenario-section-header h2 {
            margin: 0;

            color: #f8fafc;

            font-size: 1.25rem;
            line-height: 1.25;
          }

          .scenario-section-header p {
            max-width: 640px;

            margin: 0.45rem 0 0;

            color: #75859b;

            font-size: 0.78rem;
            line-height: 1.55;
          }

          .scenario-section-body {
            padding: 1.5rem;
          }

          /* =========================================
             ALERTS
             ========================================= */

          .scenario-alert {
            margin-bottom: 1rem;

            padding: 0.85rem 0.95rem;

            border-radius: 10px;

            font-size: 0.78rem;
            line-height: 1.5;
          }

          .scenario-alert-error {
            color: #fecdd3;

            border:
              1px solid
              rgba(244, 63, 94, 0.24);

            background:
              rgba(244, 63, 94, 0.06);
          }

          .scenario-alert-success {
            color: #bae6fd;

            border:
              1px solid
              rgba(56, 189, 248, 0.22);

            background:
              rgba(56, 189, 248, 0.055);
          }

          .scenario-alert-info {
            color: #c4b5fd;

            border:
              1px solid
              rgba(139, 92, 246, 0.22);

            background:
              rgba(139, 92, 246, 0.055);
          }

          .scenario-alert-warning {
            color: #fcd34d;

            border:
              1px solid
              rgba(245, 158, 11, 0.22);

            background:
              rgba(245, 158, 11, 0.055);
          }

          /* =========================================
             FORM RESTYLING
             ========================================= */

          .scenario-detail-page
          .form-group {
            margin-bottom: 1rem;
          }

          .scenario-detail-page
          .form-label {
            display: block;

            margin-bottom: 0.45rem;

            color: #aab7ca;

            font-size: 0.75rem;
            font-weight: 700;
          }

          .scenario-detail-page
          .form-input {
            width: 100%;
            min-height: 44px;

            box-sizing: border-box;

            padding: 0 0.85rem;

            color: #f8fafc;

            border:
              1px solid
              rgba(148, 163, 184, 0.16);

            border-radius: 9px;

            outline: none;

            background:
              rgba(7, 13, 24, 0.38);

            font-family: inherit;

            transition:
              border-color 150ms ease,
              box-shadow 150ms ease;
          }

          .scenario-detail-page
          .form-input:focus {
            border-color:
              rgba(56, 189, 248, 0.46);

            box-shadow:
              0 0 0 3px
              rgba(56, 189, 248, 0.06);
          }

          .scenario-detail-page
          .input-error {
            border-color:
              rgba(244, 63, 94, 0.46);
          }

          .scenario-detail-page
          .field-error {
            display: block;

            margin-top: 0.35rem;

            color: #fb7185;

            font-size: 0.7rem;
          }

          .scenario-detail-page
          .form-grid-2 {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 1rem;
          }

          .scenario-detail-page
          .form-grid-4 {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 0.9rem;
          }

          .scenario-detail-page
          .form-actions {
            display: flex;

            gap: 0.7rem;

            flex-wrap: wrap;

            margin-top: 1.2rem;
          }

          .scenario-detail-page
          .synthetic-notice {
            margin: 1rem 0;

            padding: 0.75rem 0.85rem;

            color: #9aa7b8;

            border:
              1px solid
              rgba(139, 92, 246, 0.16);

            border-radius: 9px;

            background:
              rgba(139, 92, 246, 0.04);

            font-size: 0.72rem;
            line-height: 1.5;
          }

          .scenario-detail-page
          .checkbox-label {
            display: inline-flex;
            align-items: center;

            gap: 0.55rem;

            color: #aab7ca;

            font-size: 0.8rem;

            cursor: pointer;
          }

          /* =========================================
             CASUALTY CONFIG
             ========================================= */

          .scenario-casualty-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 1rem;

            margin:
              1.5rem 0
              0.9rem;
          }

          .scenario-casualty-header h3 {
            margin: 0;

            color: #e7edf6;

            font-size: 0.95rem;
          }

          .scenario-casualty-total {
            color: #7dd3fc;

            font-size: 0.75rem;
            font-weight: 750;
          }

          /* =========================================
             LOCATION PICKER
             ========================================= */

          .scenario-detail-page
          .location-picker-wrapper {
            margin-top: 1rem;
          }

          .scenario-detail-page
          .location-picker-label {
            margin-bottom: 0.65rem;

            color: #aab7ca;

            font-size: 0.75rem;
            font-weight: 700;
          }

          .scenario-detail-page
          .lp-map-container {
            overflow: hidden;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            border-radius: 12px;
          }

          .scenario-detail-page
          .lp-map {
            height: 340px;
          }

          .scenario-detail-page
          .lp-legend {
            display: flex;

            gap: 0.8rem;

            flex-wrap: wrap;

            margin-bottom: 0.6rem;

            color: #718198;

            font-size: 0.68rem;
          }

          .scenario-detail-page
          .lp-legend-item {
            display: inline-flex;
            align-items: center;

            gap: 0.35rem;
          }

          .scenario-detail-page
          .lp-dot {
            width: 7px;
            height: 7px;

            border-radius: 999px;
          }

          .scenario-detail-page
          .lp-inputs {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 1rem;

            margin-top: 0.8rem;
          }

          .scenario-detail-page
          .lp-hint {
            margin-top: 0.35rem;

            color: #607087;

            font-size: 0.67rem;
          }

          /* =========================================
             RESOURCE LISTS
             ========================================= */

          .scenario-resource-list {
            display: grid;

            gap: 0.7rem;
          }

          .scenario-resource-item {
            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              auto;

            gap: 1rem;

            align-items: center;

            padding: 1rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.11);

            border-radius: 11px;

            background:
              rgba(7, 13, 24, 0.28);
          }

          .scenario-resource-name {
            display: block;

            color: #f8fafc;

            font-size: 0.9rem;
            font-weight: 750;
          }

          .scenario-resource-meta {
            display: flex;
            align-items: center;

            flex-wrap: wrap;

            gap: 0.45rem;

            margin-top: 0.45rem;

            color: #697990;

            font-size: 0.7rem;
            line-height: 1.5;
          }

          .scenario-resource-chip {
            display: inline-flex;
            align-items: center;

            min-height: 23px;

            padding: 0 0.45rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.11);

            border-radius: 999px;

            background:
              rgba(255, 255, 255, 0.025);
          }

          .scenario-availability {
            display: inline-flex;
            align-items: center;

            gap: 0.3rem;
          }

          .scenario-availability::before {
            content: '';

            width: 6px;
            height: 6px;

            border-radius: 999px;

            background: currentColor;
          }

          .scenario-availability.available {
            color: #38bdf8;
          }

          .scenario-availability.unavailable {
            color: #fb7185;
          }

          .scenario-resource-actions {
            display: flex;
            align-items: center;

            gap: 0.45rem;
          }

          .scenario-action-button {
            min-height: 33px;

            padding: 0 0.7rem;

            border-radius: 8px;

            font-family: inherit;

            font-size: 0.7rem;
            font-weight: 750;

            cursor: pointer;
          }

          .scenario-action-edit {
            color: #dce5f0;

            border:
              1px solid
              rgba(148, 163, 184, 0.15);

            background:
              rgba(255, 255, 255, 0.035);
          }

          .scenario-action-edit:hover {
            border-color:
              rgba(56, 189, 248, 0.3);

            background:
              rgba(56, 189, 248, 0.06);
          }

          .scenario-action-delete {
            color: #fb7185;

            border:
              1px solid
              rgba(244, 63, 94, 0.17);

            background:
              rgba(244, 63, 94, 0.035);
          }

          .scenario-action-delete:hover {
            color: #fecdd3;

            border-color:
              rgba(244, 63, 94, 0.3);

            background:
              rgba(244, 63, 94, 0.07);
          }

          /* =========================================
             SUBFORMS
             ========================================= */

          .scenario-subform {
            margin-bottom: 1.2rem;

            padding: 1.2rem;

            border:
              1px solid
              rgba(139, 92, 246, 0.19);

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.035),
                rgba(139, 92, 246, 0.045),
                rgba(244, 63, 94, 0.02)
              );
          }

          .scenario-subform h3 {
            margin:
              0 0
              1rem;

            color: #f8fafc;

            font-size: 1rem;
          }

          .scenario-add-button {
            min-height: 36px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 0.8rem;

            border:
              1px solid
              rgba(56, 189, 248, 0.22);

            border-radius: 8px;

            color: #bae6fd;

            background:
              rgba(56, 189, 248, 0.055);

            font-family: inherit;

            font-size: 0.72rem;
            font-weight: 750;

            cursor: pointer;
          }

          .scenario-add-button:hover {
            background:
              rgba(56, 189, 248, 0.09);
          }

          /* =========================================
             EMPTY STATE
             ========================================= */

          .scenario-empty {
            padding: 2.2rem 1rem;

            text-align: center;

            border:
              1px dashed
              rgba(148, 163, 184, 0.15);

            border-radius: 11px;

            background:
              rgba(7, 13, 24, 0.22);
          }

          .scenario-empty strong {
            display: block;

            color: #dce5f0;

            font-size: 0.88rem;
          }

          .scenario-empty span {
            display: block;

            max-width: 440px;

            margin:
              0.4rem auto
              0;

            color: #64748b;

            font-size: 0.72rem;
            line-height: 1.5;
          }

          /* =========================================
             GUARDS
             ========================================= */

          .scenario-guard-card {
            max-width: 550px;

            margin: 5rem auto;

            padding: 2.5rem;

            text-align: center;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.05),
                rgba(139, 92, 246, 0.05)
              );
          }

          .scenario-guard-icon {
            width: 46px;
            height: 46px;

            margin:
              0 auto
              1.2rem;

            display: flex;
            align-items: center;
            justify-content: center;

            border:
              1px solid
              rgba(56, 189, 248, 0.25);

            border-radius: 12px;

            color: #f8fafc;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.1),
                rgba(139, 92, 246, 0.1)
              );

            font-weight: 850;
          }

          .scenario-guard-card h1 {
            margin: 0;

            font-size: 1.55rem;
          }

          .scenario-guard-card p {
            margin:
              0.75rem auto
              1.4rem;

            color: #7f8da3;

            line-height: 1.6;
          }

          /* =========================================
             RESPONSIVE
             ========================================= */

          @media (max-width: 900px) {
            .scenario-summary {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .scenario-readiness {
              grid-template-columns: 1fr;
            }

            .scenario-readiness-checks {
              justify-content:
                flex-start;
            }

            .scenario-detail-page
            .form-grid-4 {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }
          }

          @media (max-width: 680px) {
            .scenario-detail-page {
              width:
                calc(100% - 2rem);

              padding-top:
                2rem;
            }

            .scenario-hero {
              grid-template-columns: 1fr;

              align-items:
                flex-start;
            }

            .scenario-hero h1 {
              font-size:
                2.1rem;
            }

            .scenario-run-button {
              width: 100%;
            }

            .scenario-summary {
              grid-template-columns: 1fr 1fr;
            }

            .scenario-section-header {
              flex-direction: column;
            }

            .scenario-resource-item {
              grid-template-columns: 1fr;
            }

            .scenario-resource-actions {
              justify-content:
                flex-start;
            }

            .scenario-detail-page
            .form-grid-4,
            .scenario-detail-page
            .form-grid-2,
            .scenario-detail-page
            .lp-inputs {
              grid-template-columns: 1fr;
            }

            .scenario-detail-page
            .lp-map {
              height: 280px;
            }
          }
        `}
      </style>

      {/* BREADCRUMB */}
      <nav
        className="scenario-breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/workspace">
          Workspace
        </Link>

        <span aria-hidden="true">
          /
        </span>

        <span>
          Scenario configuration
        </span>
      </nav>

      {/* HERO */}
      <header className="scenario-hero">
        <div>
          <div className="scenario-eyebrow">
            Scenario configuration
          </div>

          <h1>
            {scenario?.title}
          </h1>

          <div className="scenario-meta">
            <span className="scenario-meta-badge">
              {formatDisasterType(
                disasterType,
              )}
            </span>

            <span>
              {scenario?.updated_at
                ? `Updated ${new Date(
                  scenario.updated_at,
                ).toLocaleString()}`
                : `Created ${new Date(
                  scenario?.created_at ??
                  '',
                ).toLocaleString()}`}
            </span>
          </div>
        </div>

        <Link
          to={`/workspace/${scenarioId}/simulate`}
          className="scenario-run-button"
        >
          Run simulation →
        </Link>
      </header>

      {/* SUMMARY */}
      <section className="scenario-summary">
        <div className="scenario-summary-card">
          <span className="scenario-summary-label">
            Casualties
          </span>

          <strong className="scenario-summary-value">
            {Number.isNaN(
              totalCasualties,
            )
              ? '—'
              : totalCasualties}
          </strong>

          <span className="scenario-summary-note">
            Synthetic patients
          </span>
        </div>

        <div className="scenario-summary-card">
          <span className="scenario-summary-label">
            Hospitals
          </span>

          <strong className="scenario-summary-value">
            {hospitals.length}
          </strong>

          <span className="scenario-summary-note">
            Simulated destinations
          </span>
        </div>

        <div className="scenario-summary-card">
          <span className="scenario-summary-label">
            Ambulances
          </span>

          <strong className="scenario-summary-value">
            {ambulances.length}
          </strong>

          <span className="scenario-summary-note">
            {availableAmbulances}{' '}
            currently available
          </span>
        </div>

        <div className="scenario-summary-card">
          <span className="scenario-summary-label">
            Fleet capacity
          </span>

          <strong className="scenario-summary-value">
            {totalAmbulanceCapacity}
          </strong>

          <span className="scenario-summary-note">
            Patients per full fleet trip
          </span>
        </div>
      </section>

      {/* READINESS */}
      <section className="scenario-readiness">
        <div>
          <p className="scenario-readiness-title">
            Simulation readiness · {readyCount}/4 configured
          </p>

          <p className="scenario-readiness-copy">
            This is a configuration guide only. The existing simulation route
            remains available while you refine the scenario.
          </p>
        </div>

        <div className="scenario-readiness-checks">
          {readyChecks.map((check) => (
            <span
              key={check.label}
              className={`scenario-ready-chip ${check.ready
                  ? 'is-ready'
                  : 'is-pending'
                }`}
            >
              <span className="scenario-ready-dot" />

              {check.label}
            </span>
          ))}
        </div>
      </section>

      {/* =====================================================
          INCIDENT + CASUALTIES
          ===================================================== */}

      <section className="scenario-section">
        <div className="scenario-section-header">
          <div>
            <div className="scenario-section-kicker">
              01 · Incident state
            </div>

            <h2>
              Define the incident and casualty demand
            </h2>

            <p>
              Set the scenario type, incident location and synthetic casualty
              groups that the allocation engine will respond to.
            </p>
          </div>
        </div>

        <div className="scenario-section-body">
          {settingsError && (
            <Alert type="error">
              {settingsError}
            </Alert>
          )}

          {settingsSuccess && (
            <Alert type="success">
              {settingsSuccess}
            </Alert>
          )}

          <form
            onSubmit={
              handleSaveSettings
            }
            noValidate
          >
            <div className="form-grid-2">
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="s-title"
                >
                  Scenario title
                </label>

                <input
                  id="s-title"
                  type="text"
                  className={`form-input ${showSettingsError(
                    'title',
                  )
                      ? 'input-error'
                      : ''
                    }`}
                  value={title}
                  onChange={(e) => {
                    setTitle(
                      e.target.value,
                    );

                    if (
                      validateScenarioTitle(
                        e.target.value,
                      ) === null
                    ) {
                      setSettingsFieldErrors(
                        (current) => ({
                          ...current,
                          title: '',
                        }),
                      );
                    }
                  }}
                  onBlur={() =>
                    markSettingsTouched(
                      'title',
                      () =>
                        validateScenarioTitle(
                          title,
                        ),
                    )
                  }
                  maxLength={255}
                  disabled={
                    savingSettings
                  }
                />

                {showSettingsError(
                  'title',
                ) && (
                    <span className="field-error">
                      {showSettingsError(
                        'title',
                      )}
                    </span>
                  )}
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="s-dtype"
                >
                  Disaster type
                </label>

                <select
                  id="s-dtype"
                  className="form-input"
                  value={disasterType}
                  onChange={(e) =>
                    setDisasterType(
                      e.target.value,
                    )
                  }
                  disabled={
                    savingSettings
                  }
                >
                  {DISASTER_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {formatDisasterType(
                          type,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <LocationPicker
              label="Incident location"
              value={incidentCoords}
              onChange={
                setIncidentCoords
              }
              contextMarkers={
                contextMarkers
              }
            />

            <div className="scenario-casualty-header">
              <div>
                <h3>
                  Synthetic casualty demand
                </h3>
              </div>

              <span className="scenario-casualty-total">
                Total:{' '}
                <strong>
                  {Number.isNaN(
                    totalCasualties,
                  )
                    ? '—'
                    : totalCasualties}
                </strong>
              </span>
            </div>

            <p className="synthetic-notice">
              Synthetic / illustrative patient counts only — not real health records.
            </p>

            <div className="form-grid-4">
              {[
                {
                  id: 's-fracture',
                  label: 'Fracture',
                  value: fracture,
                  set: setFracture,
                  errorKey:
                    'fracture',
                },
                {
                  id: 's-blood',
                  label: 'Blood Loss',
                  value: bloodLoss,
                  set: setBloodLoss,
                  errorKey:
                    'bloodLoss',
                },
                {
                  id: 's-uncon',
                  label: 'Unconscious',
                  value: unconscious,
                  set: setUnconscious,
                  errorKey:
                    'unconscious',
                },
                {
                  id: 's-limb',
                  label: 'Limb Loss',
                  value: limbLoss,
                  set: setLimbLoss,
                  errorKey:
                    'limbLoss',
                },
              ].map(
                ({
                  id,
                  label,
                  value,
                  set,
                  errorKey,
                }) => (
                  <div
                    className="form-group"
                    key={id}
                  >
                    <label
                      className="form-label"
                      htmlFor={id}
                    >
                      {label}
                    </label>

                    <input
                      id={id}
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      className={`form-input ${showSettingsError(
                        errorKey,
                      )
                          ? 'input-error'
                          : ''
                        }`}
                      value={value}
                      onChange={(e) => {
                        set(
                          e.target.value,
                        );

                        if (
                          validateCasualtyCount(
                            e.target.value,
                            label,
                          ) === null
                        ) {
                          setSettingsFieldErrors(
                            (
                              current,
                            ) => ({
                              ...current,
                              [errorKey]:
                                '',
                            }),
                          );
                        }
                      }}
                      onBlur={() =>
                        markSettingsTouched(
                          errorKey,
                          () =>
                            validateCasualtyCount(
                              value,
                              label,
                            ),
                        )
                      }
                      disabled={
                        savingSettings
                      }
                    />

                    {showSettingsError(
                      errorKey,
                    ) && (
                        <span className="field-error">
                          {showSettingsError(
                            errorKey,
                          )}
                        </span>
                      )}
                  </div>
                ),
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  savingSettings
                }
              >
                {savingSettings
                  ? 'Saving configuration...'
                  : 'Save incident configuration'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* =====================================================
          HOSPITALS
          ===================================================== */}

      <section className="scenario-section">
        <div className="scenario-section-header">
          <div>
            <div className="scenario-section-kicker">
              02 · Hospital resources
            </div>

            <h2>
              Configure receiving hospitals
            </h2>

            <p>
              Define synthetic hospital locations and available resource
              inventories used during allocation.
            </p>
          </div>

          {!showHospitalForm && (
            <button
              type="button"
              className="scenario-add-button"
              onClick={() => {
                setShowHospitalForm(
                  true,
                );

                setEditingHospital(
                  null,
                );
              }}
            >
              + Add hospital
            </button>
          )}
        </div>

        <div className="scenario-section-body">
          {hospitalError && (
            <Alert type="error">
              {hospitalError}
            </Alert>
          )}

          {showHospitalForm && (
            <div className="scenario-subform">
              <h3>
                {editingHospital
                  ? `Edit ${editingHospital.name}`
                  : 'Add hospital'}
              </h3>

              <HospitalForm
                scenarioId={
                  scenarioId!
                }
                existing={
                  editingHospital ??
                  undefined
                }
                onSave={
                  handleSaveHospital
                }
                onCancel={() => {
                  setShowHospitalForm(
                    false,
                  );

                  setEditingHospital(
                    null,
                  );
                }}
                saving={
                  savingHospital
                }
                contextMarkers={[
                  ...incidentContextMarker,

                  ...ambulances.map(
                    (ambulance) => ({
                      kind: 'ambulance' as const,
                      lat: ambulance.base_lat,
                      lng: ambulance.base_lng,
                      label: ambulance.label,
                    }),
                  ),
                ]}
              />
            </div>
          )}

          {loadingHospitals ? (
            <Spinner label="Loading hospitals…" />
          ) : hospitals.length === 0 ? (
            <div className="scenario-empty">
              <strong>
                No hospitals configured
              </strong>

              <span>
                Add at least one simulated receiving hospital and define its available resources.
              </span>
            </div>
          ) : (
            <div
              className="scenario-resource-list"
              role="list"
              aria-label="Hospitals"
            >
              {hospitals.map(
                (hospital) => (
                  <div
                    key={
                      hospital.id
                    }
                    className="scenario-resource-item"
                    role="listitem"
                  >
                    <div>
                      <span className="scenario-resource-name">
                        {hospital.name}
                      </span>

                      <div className="scenario-resource-meta">
                        <span className="scenario-resource-chip">
                          ICU{' '}
                          {hospital.icu_beds}
                        </span>

                        <span className="scenario-resource-chip">
                          Blood{' '}
                          {hospital.blood_units}
                        </span>

                        <span className="scenario-resource-chip">
                          Ventilators{' '}
                          {hospital.ventilators}
                        </span>

                        <span className="scenario-resource-chip">
                          General beds{' '}
                          {hospital.general_beds}
                        </span>

                        <span>
                          {hospital.lat.toFixed(
                            4,
                          )}
                          ,{' '}
                          {hospital.lng.toFixed(
                            4,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="scenario-resource-actions">
                      <button
                        type="button"
                        className="scenario-action-button scenario-action-edit"
                        onClick={() => {
                          setEditingHospital(
                            hospital,
                          );

                          setShowHospitalForm(
                            true,
                          );
                        }}
                        aria-label={`Edit ${hospital.name}`}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="scenario-action-button scenario-action-delete"
                        onClick={() =>
                          handleDeleteHospital(
                            hospital,
                          )
                        }
                        aria-label={`Delete ${hospital.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          AMBULANCES
          ===================================================== */}

      <section className="scenario-section">
        <div className="scenario-section-header">
          <div>
            <div className="scenario-section-kicker">
              03 · Ambulance fleet
            </div>

            <h2>
              Configure transport capacity
            </h2>

            <p>
              Add simulated ambulance units, their base locations, capacities
              and current availability.
            </p>
          </div>

          {!showAmbulanceForm && (
            <button
              type="button"
              className="scenario-add-button"
              onClick={() => {
                setShowAmbulanceForm(
                  true,
                );

                setEditingAmbulance(
                  null,
                );
              }}
            >
              + Add ambulance
            </button>
          )}
        </div>

        <div className="scenario-section-body">
          {ambulanceError && (
            <Alert type="error">
              {ambulanceError}
            </Alert>
          )}

          {showAmbulanceForm && (
            <div className="scenario-subform">
              <h3>
                {editingAmbulance
                  ? `Edit ${editingAmbulance.label}`
                  : 'Add ambulance'}
              </h3>

              <AmbulanceForm
                existing={
                  editingAmbulance ??
                  undefined
                }
                onSave={
                  handleSaveAmbulance
                }
                onCancel={() => {
                  setShowAmbulanceForm(
                    false,
                  );

                  setEditingAmbulance(
                    null,
                  );
                }}
                saving={
                  savingAmbulance
                }
                contextMarkers={[
                  ...incidentContextMarker,

                  ...hospitals.map(
                    (hospital) => ({
                      kind: 'hospital' as const,
                      lat: hospital.lat,
                      lng: hospital.lng,
                      label: hospital.name,
                    }),
                  ),
                ]}
              />
            </div>
          )}

          {loadingAmbulances ? (
            <Spinner label="Loading ambulances…" />
          ) : ambulances.length === 0 ? (
            <div className="scenario-empty">
              <strong>
                No ambulances configured
              </strong>

              <span>
                Add at least one ambulance unit to create transport capacity for the simulation.
              </span>
            </div>
          ) : (
            <div
              className="scenario-resource-list"
              role="list"
              aria-label="Ambulances"
            >
              {ambulances.map(
                (ambulance) => (
                  <div
                    key={
                      ambulance.id
                    }
                    className="scenario-resource-item"
                    role="listitem"
                  >
                    <div>
                      <span className="scenario-resource-name">
                        {ambulance.label}
                      </span>

                      <div className="scenario-resource-meta">
                        <span className="scenario-resource-chip">
                          Capacity{' '}
                          {ambulance.capacity}
                        </span>

                        <span
                          className={`scenario-availability ${ambulance.available
                              ? 'available'
                              : 'unavailable'
                            }`}
                        >
                          {ambulance.available
                            ? 'Available'
                            : 'Deployed'}
                        </span>

                        <span>
                          Base{' '}
                          {ambulance.base_lat.toFixed(
                            4,
                          )}
                          ,{' '}
                          {ambulance.base_lng.toFixed(
                            4,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="scenario-resource-actions">
                      <button
                        type="button"
                        className="scenario-action-button scenario-action-edit"
                        onClick={() => {
                          setEditingAmbulance(
                            ambulance,
                          );

                          setShowAmbulanceForm(
                            true,
                          );
                        }}
                        aria-label={`Edit ambulance ${ambulance.label}`}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="scenario-action-button scenario-action-delete"
                        onClick={() =>
                          handleDeleteAmbulance(
                            ambulance,
                          )
                        }
                        aria-label={`Delete ambulance ${ambulance.label}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          FINAL ACTION
          ===================================================== */}

      <section
        className="scenario-section"
        style={{
          marginTop: '1.5rem',
          background:
            'linear-gradient(135deg, rgba(56,189,248,0.07), rgba(139,92,246,0.07), rgba(244,63,94,0.045))',
        }}
      >
        <div
          className="scenario-section-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="scenario-section-kicker">
              Next step
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '1.35rem',
              }}
            >
              Take this scenario into the simulation.
            </h2>

            <p
              style={{
                margin: '0.5rem 0 0',
                maxWidth: '620px',
                color: '#78889e',
                fontSize: '0.8rem',
                lineHeight: 1.55,
              }}
            >
              Run the configured incident against the allocation, routing,
              hospital-resource and decision-record workflow.
            </p>
          </div>

          <Link
            to={`/workspace/${scenarioId}/simulate`}
            className="scenario-run-button"
          >
            Run simulation →
          </Link>
        </div>
      </section>
    </main>
  );
};