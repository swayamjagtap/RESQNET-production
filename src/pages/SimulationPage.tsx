import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Scenario, Hospital, Ambulance } from '../lib/types';
import { buildSimInput, createRun } from '../sim/adapter';
import { SimEngine, AMBULANCE_SPEED_MPS } from '../sim/engine';
import type { SimState } from '../sim/types';
import { accumulatePlayback } from '../lib/playback';
import { computeCollocationOffset, getMapPoints } from '../lib/map-utils';
import { RoadLayer } from '../components/RoadLayer';
import { ConfigNotice } from '../components/ConfigNotice';

const PLAYBACK_RATE_NORMAL = 20; // 20 sim seconds per real second

function getAmbulanceIcon(label: string, count: number, capacity: number, dx = 0, dy = 0) {
  const html = `<div style="transform:translate(${dx}px,${dy}px);background:var(--primary);color:white;padding:2px 6px;border-radius:12px;font-size:0.75rem;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);border:1px solid white;">
    ${label} &middot; ${count}/${capacity}
  </div>`;
  return L.divIcon({ html, className: '', iconSize: [40, 20], iconAnchor: [20, 10] });
}

function getHospitalIcon(name: string, icu: number, blood: number, vent: number, beds: number) {
  const html = `<div style="background:white;color:var(--text-color);padding:4px 6px;border-radius:4px;font-size:0.75rem;box-shadow:0 2px 4px rgba(0,0,0,0.3);border:1px solid var(--border-color);white-space:nowrap;">
    <strong>${name}</strong><br/>
    <span style="font-size:0.65rem;color:var(--text-muted)">ICU:${icu} Bld:${blood} Vnt:${vent} Bed:${beds}</span>
  </div>`;
  return L.divIcon({ html, className: '', iconSize: [80, 40], iconAnchor: [40, 20] });
}

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

export interface SimPageInputs {
  authLoading: boolean;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  scenario: Scenario | null;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  roadGraph: any;
  simInput: any;
  state: SimState | null;
  engine: SimEngine | null;
}

export type SimPageRenderMode =
  | 'loading'
  | 'not_configured'
  | 'error'
  | 'not_ready'
  | 'initializing'
  | 'ready';

export function getSimulationRenderMode(inputs: SimPageInputs): {
  mode: SimPageRenderMode;
  missingItems: string[];
} {
  if (inputs.authLoading || inputs.loading) {
    return { mode: 'loading', missingItems: [] };
  }
  if (!inputs.isConfigured) {
    return { mode: 'not_configured', missingItems: [] };
  }
  if (inputs.error) {
    return { mode: 'error', missingItems: [] };
  }

  const scenario = inputs.scenario;
  const totalCasualties =
    (scenario?.fracture || 0) +
    (scenario?.blood_loss || 0) +
    (scenario?.unconscious || 0) +
    (scenario?.limb_loss || 0);

  const missingItems: string[] = [];
  if (!scenario?.incident_lat || !scenario?.incident_lng) {
    missingItems.push('Missing incident location.');
  }
  if (inputs.hospitals.length === 0) {
    missingItems.push('Missing hospitals (need at least 1).');
  }
  if (inputs.ambulances.length === 0) {
    missingItems.push('Missing ambulances (need at least 1).');
  }
  if (totalCasualties === 0) {
    missingItems.push('Missing casualties (need at least 1).');
  }

  if (missingItems.length > 0) {
    return { mode: 'not_ready', missingItems };
  }

  if (!inputs.simInput || !inputs.state || !inputs.engine || !inputs.roadGraph) {
    return { mode: 'initializing', missingItems: [] };
  }

  return { mode: 'ready', missingItems: [] };
}

const SimulationPageContent: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, loading: authLoading, isConfigured } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [roadGraph, setRoadGraph] = useState<any>(null); // RoadGraph
  const [simInput, setSimInput] = useState<any>(null);
  
  const [engine, setEngine] = useState<SimEngine | null>(null);
  const [state, setState] = useState<SimState | null>(null);
  
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [autoScrollLog, setAutoScrollLog] = useState(true);
  
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const accRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase || !scenarioId) return;
      try {
        setLoading(true);
        const [scRes, hsRes, amRes, graphModule] = await Promise.all([
          supabase.from('scenarios').select('*').eq('id', scenarioId).single(),
          supabase.from('hospitals').select('*').eq('scenario_id', scenarioId).order('created_at'),
          supabase.from('ambulances').select('*').eq('scenario_id', scenarioId).order('created_at'),
          import('../sim/graph').then(m => m.loadVileParleGraph())
        ]);
        
        if (scRes.error) throw new Error(scRes.error.message);
        
        setScenario(scRes.data as Scenario);
        setHospitals((hsRes.data ?? []) as Hospital[]);
        setAmbulances((amRes.data ?? []) as Ambulance[]);
        setRoadGraph(graphModule);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load simulation data');
      } finally {
        setLoading(false);
      }
    }
    if (user && isConfigured) {
      loadData();
    }
  }, [user, isConfigured, scenarioId]);

  useEffect(() => {
    if (!scenario || !hospitals.length || !ambulances.length || !roadGraph) return;
    
    const totalCasualties = (scenario.fracture||0) + (scenario.blood_loss||0) + (scenario.unconscious||0) + (scenario.limb_loss||0);
    if (!scenario.incident_lat || !scenario.incident_lng || totalCasualties === 0) return;
    
    try {
      const input = buildSimInput(scenario, hospitals, ambulances, roadGraph);
      setSimInput(input);
      const initialRun = createRun(input);
      const simEngine = new SimEngine(initialRun, roadGraph);
      setEngine(simEngine);
      setState(initialRun);
      setPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize simulation engine');
    }
  }, [scenario, hospitals, ambulances, roadGraph]);

  const handleReset = useCallback(() => {
    if (!simInput || !roadGraph) return;
    setPlaying(false);
    const freshRun = createRun(simInput);
    const freshEngine = new SimEngine(freshRun, roadGraph);
    setEngine(freshEngine);
    setState(freshRun);
    accRef.current = 0;
    lastTimeRef.current = undefined;
  }, [simInput, roadGraph]);

  const updateFrame = useCallback((time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    const deltaMs = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (engine && state && playing && state.status !== 'resolved') {
      if (state.status === 'idle') {
        engine.start();
      }

      accRef.current = accumulatePlayback(accRef.current, deltaMs, playbackSpeed, PLAYBACK_RATE_NORMAL, () => {
        engine.tick();
      });
      setState({ ...state }); // trigger re-render
      
      if ((state.status as string) === 'resolved') {
        setPlaying(false);
      }
    }

    reqRef.current = requestAnimationFrame(updateFrame);
  }, [engine, state, playing, playbackSpeed]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [updateFrame]);

  useEffect(() => {
    if (autoScrollLog && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [state?.events, autoScrollLog]);

  const handleLogScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setAutoScrollLog(isAtBottom);
  };

  const renderInfo = getSimulationRenderMode({
    authLoading,
    loading,
    isConfigured,
    error,
    scenario,
    hospitals,
    ambulances,
    roadGraph,
    simInput,
    state,
    engine,
  });

  if (renderInfo.mode === 'loading' || renderInfo.mode === 'initializing') {
    return <div className="main-content"><div className="spinner-center"><div className="spinner spinner-lg"/></div></div>;
  }
  if (renderInfo.mode === 'not_configured') {
    return <div className="main-content"><ConfigNotice /></div>;
  }
  if (renderInfo.mode === 'error') {
    return <div className="main-content"><div className="alert alert-error">{error}</div></div>;
  }
  if (renderInfo.mode === 'not_ready') {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Simulation Not Ready</h2>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
            {renderInfo.missingItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <Link to={`/workspace/${scenarioId}`} className="btn btn-secondary">← Back to Scenario</Link>
        </div>
      </div>
    );
  }

  const mapPoints = getMapPoints(simInput, state, roadGraph);

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 100px)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{scenario?.title} - Simulation</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Routing uses OpenStreetMap roads; one-way tags ignored; speeds are assumed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setPlaybackSpeed(0.1)} style={{ fontWeight: playbackSpeed === 0.1 ? 'bold' : 'normal', background: playbackSpeed === 0.1 ? 'var(--bg-elevated)' : '' }}>0.1x</button>
          <button className="btn btn-secondary" onClick={() => setPlaybackSpeed(1)} style={{ fontWeight: playbackSpeed === 1 ? 'bold' : 'normal', background: playbackSpeed === 1 ? 'var(--bg-elevated)' : '' }}>1x</button>
          <button className="btn btn-secondary" onClick={() => setPlaybackSpeed(4)} style={{ fontWeight: playbackSpeed === 4 ? 'bold' : 'normal', background: playbackSpeed === 4 ? 'var(--bg-elevated)' : '' }}>4x</button>
          
          <button className="btn btn-primary" onClick={() => setPlaying(!playing)} disabled={state?.status === 'resolved'}>
            {playing ? '⏸ Pause' : '▶️ Start'}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>🔄 Reset</button>
        </div>
      </header>

      {mapPoints.warnings.length > 0 && (
        <div className="alert alert-warning">
          ⚠️ Map Warning: {mapPoints.warnings.join(' ')}
        </div>
      )}

      {simInput?.incidentSnap?.warning && (
        <div className="alert alert-warning">
          Incident snapped {simInput.incidentSnap.distanceMetres}m to nearest road (warning: &gt;300m).
        </div>
      )}

      {state?.ambulances.some(a => a.status === 'stuck') && (
        <div className="alert alert-error">
          ⚠️ Ambulance stuck! {state.ambulances.find(a => a.status === 'stuck')?.stuckReason}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Map Area */}
        <div className="card" style={{ flex: 2, padding: 0, overflow: 'hidden', position: 'relative' }}>
          <MapContainer 
            bounds={mapPoints.bounds || undefined}
            center={!mapPoints.bounds && mapPoints.incident ? [mapPoints.incident.lat, mapPoints.incident.lng] : undefined}
            zoom={!mapPoints.bounds ? 14 : undefined}
            style={{ width: '100%', height: '100%', background: '#0f172a' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {roadGraph && engine && <RoadLayer graph={roadGraph} engine={engine} />}

            {/* Active routes */}
            {mapPoints.activeRoutes.map(route => (
              <Polyline 
                key={route.id} 
                positions={route.positions} 
                color="var(--primary)" 
                weight={3} 
                opacity={0.8} 
              />
            ))}

            {/* Incident */}
            {mapPoints.incident && (
              <Marker position={[mapPoints.incident.lat, mapPoints.incident.lng]} 
                icon={L.divIcon({ html: '🔥', className: '', iconSize: [24,24], iconAnchor: [12,12] })} 
              />
            )}

            {/* Hospitals */}
            {mapPoints.hospitals.map(h => {
              const stock = state?.hospitals.find(sh => sh.id === h.id)?.stock || { icu: 0, blood: 0, vent: 0, beds: 0 };
              return (
                <Marker key={h.id} position={[h.point.lat, h.point.lng]} 
                  icon={getHospitalIcon(h.name, stock.icu, stock.blood, stock.vent, stock.beds)} 
                />
              );
            })}

            {/* Ambulances */}
            {mapPoints.ambulances.map(item => {
              const a = item.ambulance;
              
              // Count collocated ambulances for offset
              const collocated = mapPoints.ambulances.filter(o => 
                o.ambulance.currentNode === a.currentNode
              ).sort((x, y) => x.id.localeCompare(y.id));
              
              const idx = collocated.findIndex(x => x.id === a.id);
              let edgeDirX = 1, edgeDirY = 0; // default
              
              if (a.currentPath.length >= 2 && roadGraph?.nodes) {
                const n1 = roadGraph.nodes[a.currentPath[0]];
                const n2 = roadGraph.nodes[a.currentPath[1]];
                if (n1 && n2) {
                  edgeDirX = n2.lng - n1.lng;
                  edgeDirY = n2.lat - n1.lat;
                }
              }
              
              const offset = computeCollocationOffset(idx, edgeDirX, edgeDirY);
              
              const onboard = a.cargo.reduce((sum, g) => sum + g.count, 0);
              const icon = getAmbulanceIcon(a.id, onboard, a.capacity, offset.dx, offset.dy);
              
              return (
                <Marker key={a.id} position={[item.point.lat, item.point.lng]} icon={icon} />
              );
            })}
          </MapContainer>
        </div>

        {/* Dashboard Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Fleet Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', marginBottom: '1rem' }}>
              {state?.ambulances.map(a => {
                const onboard = a.cargo.reduce((sum, g) => sum + g.count, 0);
                return (
                  <div key={a.id} style={{ background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <strong>{a.id}</strong> - <span style={{ color: a.status === 'stuck' ? 'var(--error)' : 'inherit' }}>{a.status}</span><br/>
                    <span style={{ color: 'var(--text-muted)' }}>Onboard: {onboard}/{a.capacity} | Dest: {a.destination || 'None'}</span>
                    {a.stuckReason && <div style={{ color: 'var(--error)', marginTop: '0.25rem' }}>{a.stuckReason}</div>}
                  </div>
                );
              })}
            </div>
            
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Decision Log</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                Time: {state?.simSeconds || 0}s | Delivered: {state?.deliveredCount || 0} | Wait: {state?.victimGroups.filter(g => g.status==='waiting').reduce((s, g)=>s+g.count, 0) || 0}
              </span>
            </h3>
            
            <div 
              ref={logContainerRef} 
              onScroll={handleLogScroll}
              style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-elevated)', borderRadius: '4px', padding: '0.5rem', fontSize: '0.85rem', position: 'relative' }}
            >
              {state?.events.map(e => (
                <div key={e.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-dim)', marginRight: '0.5rem' }}>[{e.simSeconds}s]</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{e.kind.toUpperCase()}</span>: {e.text}
                </div>
              ))}
              {!autoScrollLog && (
                <button 
                  onClick={() => setAutoScrollLog(true)}
                  style={{ position: 'sticky', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  Jump to latest
                </button>
              )}
            </div>
          </div>
          
          {state?.status === 'resolved' && (
            <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)' }}>
              <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Simulation Completed</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Delivered: {state.deliveredCount}. Of these, {state.underResourcedCount} arrived at a hospital short of required resources.</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Elapsed Time: {state.simSeconds}s</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Trips: {state.ambulances.reduce((s, a) => s + a.trips, 0)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Synthetic scenario data. Ambulance speed is an assumption ({AMBULANCE_SPEED_MPS} m/s). Not medical advice or validated dispatch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
