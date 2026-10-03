import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import type {
  Scenario,
  Hospital,
  Ambulance,
} from '../lib/types';

import { ConfigNotice } from '../components/ConfigNotice';
import { SimulationView } from './SimulationView';

/* =========================================================
   SHARED FALLBACK STYLES
   ========================================================= */

const shellStyle: React.CSSProperties = {
  width: 'min(100% - 2rem, 860px)',
  margin: '0 auto',
  padding: '4rem 0',
};

const panelStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  padding: '2rem',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: '16px',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(17,24,39,0.92))',
  boxShadow: '0 18px 60px rgba(0,0,0,0.14)',
};

const labelStyle: React.CSSProperties = {
  marginBottom: '0.55rem',
  color: '#38bdf8',
  fontSize: '0.68rem',
  fontWeight: 800,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#f8fafc',
  fontSize: '1.75rem',
  lineHeight: 1.2,
  letterSpacing: '-0.025em',
};

const copyStyle: React.CSSProperties = {
  margin: '0.75rem 0 0',
  color: '#8392a8',
  fontSize: '0.9rem',
  lineHeight: 1.65,
};

const gradientLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background:
    'linear-gradient(90deg, #38bdf8, #8b5cf6, #f43f5e)',
};

/* =========================================================
   ERROR BOUNDARY
   ========================================================= */

class SimulationErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    scenarioId?: string;
  },
  {
    hasError: boolean;
    error: Error | null;
  }
> {
  constructor(props: {
    children: React.ReactNode;
    scenarioId?: string;
  }) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={shellStyle}>
          <section
            style={{
              ...panelStyle,
              borderColor: 'rgba(244, 63, 94, 0.22)',
            }}
          >
            <div style={gradientLineStyle} />

            <div
              style={{
                ...labelStyle,
                color: '#fb7185',
              }}
            >
              Simulation error
            </div>

            <h1 style={titleStyle}>
              The simulation could not be displayed.
            </h1>

            <p style={copyStyle}>
              The simulator encountered an unexpected error while rendering
              this scenario. Your scenario data has not been deleted.
            </p>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.9rem 1rem',
                border: '1px solid rgba(244, 63, 94, 0.18)',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.05)',
                color: '#fecdd3',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {this.state.error?.message ?? 'Unknown error'}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '1.4rem',
              }}
            >
              <Link
                to={
                  this.props.scenarioId
                    ? `/workspace/${this.props.scenarioId}`
                    : '/workspace'
                }
                className="btn btn-secondary"
              >
                ← Back to scenario
              </Link>

              <Link
                to="/workspace"
                className="btn btn-secondary"
              >
                Open workspace
              </Link>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   PAGE CONTENT
   ========================================================= */

const SimulationPageContent: React.FC = () => {
  const { scenarioId } = useParams<{
    scenarioId: string;
  }>();

  const {
    user,
    loading: authLoading,
    isConfigured,
  } = useAuth();

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [scenario, setScenario] =
    useState<Scenario | null>(null);

  const [hospitals, setHospitals] =
    useState<Hospital[]>([]);

  const [ambulances, setAmbulances] =
    useState<Ambulance[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!supabase || !scenarioId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          scRes,
          hsRes,
          amRes,
        ] = await Promise.all([
          supabase
            .from('scenarios')
            .select('*')
            .eq('id', scenarioId)
            .single(),

          supabase
            .from('hospitals')
            .select('*')
            .eq('scenario_id', scenarioId)
            .order('created_at'),

          supabase
            .from('ambulances')
            .select('*')
            .eq('scenario_id', scenarioId)
            .order('created_at'),
        ]);

        if (scRes.error) {
          throw new Error(scRes.error.message);
        }

        if (hsRes.error) {
          throw new Error(hsRes.error.message);
        }

        if (amRes.error) {
          throw new Error(amRes.error.message);
        }

        setScenario(scRes.data as Scenario);

        setHospitals(
          (hsRes.data ?? []) as Hospital[],
        );

        setAmbulances(
          (amRes.data ?? []) as Ambulance[],
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load simulation data';

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (user && isConfigured) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [
    user,
    isConfigured,
    scenarioId,
    authLoading,
  ]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (authLoading || loading) {
    return (
      <main
        style={{
          minHeight: '62vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            color: '#7f8da3',
            textAlign: 'center',
          }}
        >
          <div
            className="spinner"
            style={{
              width: '34px',
              height: '34px',
            }}
          />

          <div>
            <strong
              style={{
                display: 'block',
                color: '#e7edf6',
                marginBottom: '0.3rem',
              }}
            >
              Preparing simulation
            </strong>

            <span
              style={{
                fontSize: '0.82rem',
              }}
            >
              Loading scenario, hospital resources and ambulance fleet…
            </span>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  if (!isConfigured) {
    return (
      <div className="main-content">
        <ConfigNotice />
      </div>
    );
  }

  /* =======================================================
     SIGNED OUT
     ======================================================= */

  if (!user) {
    return (
      <main style={shellStyle}>
        <section style={panelStyle}>
          <div style={gradientLineStyle} />

          <div style={labelStyle}>
            Workspace required
          </div>

          <h1 style={titleStyle}>
            Sign in to run this scenario.
          </h1>

          <p style={copyStyle}>
            Saved simulations belong to a RESQNET workspace. Sign in to load
            the scenario and continue into the simulator.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginTop: '1.4rem',
            }}
          >
            <Link
              to="/login"
              className="btn btn-primary"
            >
              Sign in
            </Link>

            <Link
              to="/demo"
              className="btn btn-secondary"
            >
              Open public demo
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     DATA ERROR
     ======================================================= */

  if (error) {
    return (
      <main style={shellStyle}>
        <section
          style={{
            ...panelStyle,
            borderColor:
              'rgba(244, 63, 94, 0.22)',
          }}
        >
          <div style={gradientLineStyle} />

          <div
            style={{
              ...labelStyle,
              color: '#fb7185',
            }}
          >
            Loading failed
          </div>

          <h1 style={titleStyle}>
            The scenario could not be loaded.
          </h1>

          <p style={copyStyle}>
            RESQNET could not retrieve all of the data required to prepare
            this simulation.
          </p>

          <div
            style={{
              marginTop: '1.15rem',
              padding: '0.9rem 1rem',
              border:
                '1px solid rgba(244, 63, 94, 0.18)',
              borderRadius: '10px',
              background:
                'rgba(244, 63, 94, 0.05)',
              color: '#fecdd3',
              fontSize: '0.8rem',
              lineHeight: 1.55,
            }}
          >
            {error}
          </div>

          <div
            style={{
              marginTop: '1.4rem',
            }}
          >
            <Link
              to={`/workspace/${scenarioId}`}
              className="btn btn-secondary"
            >
              ← Back to scenario
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     READINESS CHECK
     ======================================================= */

  const totalCasualties =
    (scenario?.fracture ?? 0) +
    (scenario?.blood_loss ?? 0) +
    (scenario?.unconscious ?? 0) +
    (scenario?.limb_loss ?? 0);

  const missingItems: Array<{
    title: string;
    detail: string;
  }> = [];

  if (
    scenario?.incident_lat == null ||
    scenario?.incident_lng == null
  ) {
    missingItems.push({
      title: 'Incident location',
      detail:
        'Set an incident point on the scenario map.',
    });
  }

  if (hospitals.length === 0) {
    missingItems.push({
      title: 'Receiving hospital',
      detail:
        'Add at least one simulated hospital and resource inventory.',
    });
  }

  if (ambulances.length === 0) {
    missingItems.push({
      title: 'Ambulance fleet',
      detail:
        'Add at least one simulated ambulance unit.',
    });
  }

  if (totalCasualties === 0) {
    missingItems.push({
      title: 'Casualty demand',
      detail:
        'Add at least one synthetic casualty before running the scenario.',
    });
  }

  if (missingItems.length > 0) {
    return (
      <main style={shellStyle}>
        <section style={panelStyle}>
          <div style={gradientLineStyle} />

          <div style={labelStyle}>
            Simulation readiness
          </div>

          <h1 style={titleStyle}>
            This scenario needs a little more configuration.
          </h1>

          <p style={copyStyle}>
            The simulator is ready, but this scenario is missing{' '}
            {missingItems.length === 1
              ? 'one required input'
              : `${missingItems.length} required inputs`}
            .
          </p>

          <div
            style={{
              display: 'grid',
              gap: '0.7rem',
              marginTop: '1.3rem',
            }}
          >
            {missingItems.map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'auto minmax(0, 1fr)',
                  gap: '0.8rem',
                  alignItems: 'start',
                  padding: '0.9rem 1rem',
                  border:
                    '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  background:
                    'rgba(7, 13, 24, 0.3)',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '7px',
                    color: '#fbbf24',
                    border:
                      '1px solid rgba(245,158,11,0.18)',
                    background:
                      'rgba(245,158,11,0.055)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  !
                </span>

                <div>
                  <strong
                    style={{
                      display: 'block',
                      color: '#dce5f0',
                      fontSize: '0.82rem',
                    }}
                  >
                    {item.title}
                  </strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: '0.2rem',
                      color: '#6f7f95',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginTop: '1.4rem',
            }}
          >
            <Link
              to={`/workspace/${scenarioId}`}
              className="btn btn-primary"
            >
              Complete configuration
            </Link>

            <Link
              to="/workspace"
              className="btn btn-secondary"
            >
              Back to workspace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     WORKING SIMULATOR
     ======================================================= */

  return (
    <SimulationView
      title={scenario!.title}
      scenario={scenario!}
      hospitals={hospitals}
      ambulances={ambulances}
    />
  );
};

/* =========================================================
   EXPORT
   ========================================================= */

export const SimulationPage: React.FC = () => {
  const { scenarioId } = useParams<{
    scenarioId: string;
  }>();

  return (
    <SimulationErrorBoundary
      scenarioId={scenarioId}
    >
      <SimulationPageContent />
    </SimulationErrorBoundary>
  );
};