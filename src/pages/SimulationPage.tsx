import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Scenario, Hospital, Ambulance } from '../lib/types';
import { ConfigNotice } from '../components/ConfigNotice';
import { SimulationView } from './SimulationView';

class SimulationErrorBoundary extends React.Component<{children: React.ReactNode, scenarioId?: string}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="main-content">
          <div className="card" style={{ borderLeft: '4px solid var(--error)' }}>
            <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>The simulation could not be displayed</h2>
            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1rem', whiteSpace: 'pre-wrap', color: 'var(--error)' }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <Link to={this.props.scenarioId ? `/workspace/${this.props.scenarioId}` : '/'} className="btn btn-secondary">
              ← Back to scenario
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SimulationPageContent: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, loading: authLoading, isConfigured } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!supabase || !scenarioId) return;
      try {
        setLoading(true);
        const [scRes, hsRes, amRes] = await Promise.all([
          supabase.from('scenarios').select('*').eq('id', scenarioId).single(),
          supabase.from('hospitals').select('*').eq('scenario_id', scenarioId).order('created_at'),
          supabase.from('ambulances').select('*').eq('scenario_id', scenarioId).order('created_at')
        ]);
        if (scRes.error) throw new Error(scRes.error.message);
        setScenario(scRes.data as Scenario);
        setHospitals((hsRes.data ?? []) as Hospital[]);
        setAmbulances((amRes.data ?? []) as Ambulance[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load simulation data');
      } finally {
        setLoading(false);
      }
    }
    if (user && isConfigured) loadData();
  }, [user, isConfigured, scenarioId]);

  if (authLoading || loading) return <div className="main-content"><div className="spinner-center"><div className="spinner spinner-lg"/></div></div>;
  if (!isConfigured) return <div className="main-content"><ConfigNotice /></div>;
  if (error) return <div className="main-content"><div className="alert alert-error">{error}</div></div>;

  const totalCasualties =
    (scenario?.fracture || 0) + (scenario?.blood_loss || 0) +
    (scenario?.unconscious || 0) + (scenario?.limb_loss || 0);

  const missingItems: string[] = [];
  if (!scenario?.incident_lat || !scenario?.incident_lng) missingItems.push('Missing incident location.');
  if (hospitals.length === 0) missingItems.push('Missing hospitals (need at least 1).');
  if (ambulances.length === 0) missingItems.push('Missing ambulances (need at least 1).');
  if (totalCasualties === 0) missingItems.push('Missing casualties (need at least 1).');

  if (missingItems.length > 0) {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Simulation Not Ready</h2>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
            {missingItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
          <Link to={`/workspace/${scenarioId}`} className="btn btn-secondary">← Back to Scenario</Link>
        </div>
      </div>
    );
  }

  return (
    <SimulationView 
      title={scenario!.title}
      scenario={scenario!} 
      hospitals={hospitals} 
      ambulances={ambulances} 
    />
  );
};

export const SimulationPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  return (
    <SimulationErrorBoundary scenarioId={scenarioId}>
      <SimulationPageContent />
    </SimulationErrorBoundary>
  );
};
