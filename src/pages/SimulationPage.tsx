import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Scenario, Hospital, Ambulance } from '../lib/types';
import { buildSimInput, createRun } from '../sim/adapter';
import { SimEngine, AMBULANCE_SPEED_MPS } from '../sim/engine';
import type { SimState } from '../sim/types';
import { accumulatePlayback } from '../lib/playback';
import { computeCollocationOffset, getMapPoints } from '../lib/map-utils';
import { buildDisplayNameMaps, describeEvent, isKeyEvent } from '../lib/event-display';
import { RoadLayer } from '../components/RoadLayer';
import { ConfigNotice } from '../components/ConfigNotice';
import { createLedger, verifyChain, failureReport, time, type Ledger, type LedgerEntry, type VerifyResult } from '../lib/audit';
import { getAmbulanceStatus } from '../lib/fleet-status';
import { drainEventsToLedger } from '../lib/ledger-feed';
import { extractLiveView, type LiveView } from '../lib/live-view';

const PLAYBACK_RATE_NORMAL = 20;

/* ─────────────────── Icon Helpers ───────────────────────────────────────── */

function getAmbulanceIcon(label: string, count: number, capacity: number, bearing: number, dx = 0, dy = 0) {
  const short = label.length > 8 ? label.slice(0, 8) + '…' : label;
  const isWest = bearing > 180 && bearing < 360;
  const svg = `<svg width="28" height="28" viewBox="0 0 64 64" style="background: white; border-radius: 50%; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">
    <path d="M 6 42 L 6 22 L 34 22 L 44 22 L 54 30 L 58 30 L 58 42 Z" fill="white" stroke="#374151" stroke-width="2"/>
    <path d="M 38 22 L 38 32 L 58 32" fill="none" stroke="#374151" stroke-width="2"/>
    <circle cx="16" cy="44" r="5" fill="#1f2937" />
    <circle cx="46" cy="44" r="5" fill="#1f2937" />
    <path d="M 14 32 L 26 32 M 20 26 L 20 38" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
  </svg>`;
  
  const html = `<div class="amb-wrapper" style="transform:translate(${dx}px,${dy}px); display: flex; align-items: center; gap: 4px; pointer-events: none; width: max-content;">
    <div class="amb-svg-container" style="transform: scaleX(${isWest ? -1 : 1}); display: flex; justify-content: center; align-items: center; transform-origin: center;">
      ${svg}
    </div>
    <div class="amb-text-container" style="background:#3b82f6;color:white;padding:2px 6px;border-radius:12px;font-size:0.75rem;font-weight:600;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.4);border:1.5px solid white;cursor:default;">
      ${short}&nbsp;·&nbsp;${count}/${capacity}
    </div>
  </div>`;
  return L.divIcon({ html, className: '', iconSize: [160, 28], iconAnchor: [14, 14] });
}

function getHospitalIcon() {
  const html = `<div style="background:white;border:2px solid #16a34a;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#16a34a;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:default;">H</div>`;
  return L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
}

function getIncidentIcon() {
  const html = `<div style="background:#ef4444;border:2px solid white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:default;">🔥</div>`;
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
}

/* ─────────────────── MapRefit component ─────────────────────────────────── */

function MapRefit({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30] });
  }, [bounds, map]);

  // Fix map grey area: invalidate size on container resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

/* ─────────────────── Imperative Ambulance Layer ───────────────────────────── */

function AmbulanceLayer({ 
  simInput, stateRef, roadGraph, playingRef, accRef, speedRef 
}: { 
  simInput: any; stateRef: React.MutableRefObject<SimState | null>; roadGraph: any; 
  playingRef: React.MutableRefObject<boolean>; accRef: React.MutableRefObject<number>; 
  speedRef: React.MutableRefObject<number>; 
}) {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const reqRef = useRef<number>();

  useEffect(() => {
    // Create markers ONCE
    if (simInput && simInput.ambulances) {
      simInput.ambulances.forEach((aInput: any) => {
        const icon = getAmbulanceIcon(aInput.label, 0, aInput.capacity, 0, 0, 0);
        const marker = L.marker([0, 0], { icon, zIndexOffset: 1000 }).addTo(map);
        marker.setOpacity(0); // hide until first update
        markersRef.current[aInput.id] = marker;
      });
    }
    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
    };
  }, [map, simInput]);

  useEffect(() => {
    function renderLoop() {
      const st = stateRef.current;
      if (st && roadGraph && simInput) {
        const isResolved = st.status === 'resolved';
        const msPerTick = 1000 / (PLAYBACK_RATE_NORMAL * speedRef.current);
        const interpolationFraction = (playingRef.current && !isResolved) ? Math.min(1, accRef.current / msPerTick) : 0;
        
        const mapPoints = getMapPoints(simInput, st, roadGraph, interpolationFraction);
        
        mapPoints.ambulances.forEach(item => {
           const marker = markersRef.current[item.ambulance.id];
           if (marker) {
              marker.setOpacity(1);
              marker.setLatLng([item.point.lat, item.point.lng]);
              
              const el = marker.getElement();
              if (el) {
                 const svgContainer = el.querySelector('.amb-svg-container') as HTMLElement;
                 if (svgContainer) {
                   const isWest = item.bearing > 180 && item.bearing < 360;
                   svgContainer.style.transform = `scaleX(${isWest ? -1 : 1})`;
                 }
                 
                 const textContainer = el.querySelector('.amb-text-container') as HTMLElement;
                 if (textContainer) {
                    const onboard = item.ambulance.cargo.reduce((sum: number, g: any) => sum + g.count, 0);
                    const label = item.ambulance.label;
                    const short = label.length > 8 ? label.slice(0, 8) + '…' : label;
                    textContainer.innerHTML = `${short}&nbsp;·&nbsp;${onboard}/${item.ambulance.capacity}`;
                 }

                 const wrapper = el.querySelector('.amb-wrapper') as HTMLElement;
                 if (wrapper) {
                    const collocated = mapPoints.ambulances.filter(o =>
                      o.ambulance.currentNode === item.ambulance.currentNode
                    ).sort((x, y) => x.id.localeCompare(y.id));
                    const idx = collocated.findIndex(x => x.id === item.ambulance.id);
                    let edgeDirX = 1, edgeDirY = 0;
                    if (item.ambulance.currentPath.length >= 2 && roadGraph?.nodes) {
                      const n1 = roadGraph.nodes[item.ambulance.currentPath[0]];
                      const n2 = roadGraph.nodes[item.ambulance.currentPath[1]];
                      if (n1 && n2) { edgeDirX = n2.lng - n1.lng; edgeDirY = n2.lat - n1.lat; }
                    }
                    const offset = computeCollocationOffset(idx, edgeDirX, edgeDirY);
                    wrapper.style.transform = `translate(${offset.dx}px,${offset.dy}px)`;
                 }
              }
           }
        });
      }
      reqRef.current = requestAnimationFrame(renderLoop);
    }
    reqRef.current = requestAnimationFrame(renderLoop);
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
  }, [map, simInput, roadGraph, stateRef, accRef, playingRef, speedRef]);

  return null;
}

/* ─────────────────── Error Boundary ─────────────────────────────────────── */

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

/* ─────────────────── Readiness logic ────────────────────────────────────── */

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
  if (inputs.authLoading || inputs.loading) return { mode: 'loading', missingItems: [] };
  if (!inputs.isConfigured) return { mode: 'not_configured', missingItems: [] };
  if (inputs.error) return { mode: 'error', missingItems: [] };

  const scenario = inputs.scenario;
  const totalCasualties =
    (scenario?.fracture || 0) + (scenario?.blood_loss || 0) +
    (scenario?.unconscious || 0) + (scenario?.limb_loss || 0);

  const missingItems: string[] = [];
  if (!scenario?.incident_lat || !scenario?.incident_lng) missingItems.push('Missing incident location.');
  if (inputs.hospitals.length === 0) missingItems.push('Missing hospitals (need at least 1).');
  if (inputs.ambulances.length === 0) missingItems.push('Missing ambulances (need at least 1).');
  if (totalCasualties === 0) missingItems.push('Missing casualties (need at least 1).');

  if (missingItems.length > 0) return { mode: 'not_ready', missingItems };
  if (!inputs.simInput || !inputs.state || !inputs.engine || !inputs.roadGraph) return { mode: 'initializing', missingItems: [] };
  return { mode: 'ready', missingItems: [] };
}

/* ─────────────────── Main component ─────────────────────────────────────── */

const SimulationPageContent: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, loading: authLoading, isConfigured } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [roadGraph, setRoadGraph] = useState<any>(null);
  const [simInput, setSimInput] = useState<any>(null);

  const [engine, setEngine] = useState<SimEngine | null>(null);
  const [state, setState] = useState<SimState | null>(null);
  const [liveView, setLiveView] = useState<LiveView | null>(null);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [verifyResult, setVerifyResult] = useState<(VerifyResult & { verifiedCount?: number }) | null>(null);
  const ledgerRef = useRef<Ledger | null>(null);
  const cursorRef = useRef({ current: 0 });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [autoScrollLog, setAutoScrollLog] = useState(true);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [refitCounter, setRefitCounter] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const accRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const engineRef = useRef<SimEngine | null>(null);
  const stateRef = useRef<SimState | null>(null);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = playbackSpeed; }, [playbackSpeed]);
  
  useEffect(() => {
    setIsDemoMode(window.location.hash === '#audit-dev');
    const handleHash = () => setIsDemoMode(window.location.hash === '#audit-dev');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // ──── Load data ────
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
    if (user && isConfigured) loadData();
  }, [user, isConfigured, scenarioId]);

  // ──── Build sim input ────
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
      setLiveView(extractLiveView(initialRun));
      setPlaying(false);
      
      // Initialize Ledger
      cursorRef.current = { current: 0 };
      setLedgerEntries([]);
      setVerifyResult(null);
      ledgerRef.current = createLedger((entry) => {
        setLedgerEntries(prev => [...prev, entry]);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to initialize simulation engine');
    }
  }, [scenario, hospitals, ambulances, roadGraph]);

  // ──── Reset ────
  const handleReset = useCallback(() => {
    if (!simInput || !roadGraph) return;
    setPlaying(false);
    const freshRun = createRun(simInput);
    const freshEngine = new SimEngine(freshRun, roadGraph);
    setEngine(freshEngine);
    setState(freshRun);
    setLiveView(extractLiveView(freshRun));
    accRef.current = 0;
    lastTimeRef.current = undefined;
    
    // Fresh Ledger
    cursorRef.current = { current: 0 };
    setLedgerEntries([]);
    setVerifyResult(null);
    ledgerRef.current = createLedger((entry) => {
      setLedgerEntries(prev => [...prev, entry]);
    });
  }, [simInput, roadGraph]);

  // ──── Animation loop ────
  const updateFrame = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaMs = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const eng = engineRef.current;
    const st = stateRef.current;
    if (eng && st && playingRef.current && st.status !== 'resolved') {
      if (st.status === 'idle') eng.start();

      accRef.current = accumulatePlayback(accRef.current, deltaMs, speedRef.current, PLAYBACK_RATE_NORMAL, () => {
        eng.tick();
      });
      
      // Drain events to ledger
      if (ledgerRef.current && cursorRef.current) {
        drainEventsToLedger(st.events, ledgerRef.current, cursorRef.current);
      }

      // Throttle UI updates to ~10fps
      if (time - lastUpdateRef.current > 100) {
        setLiveView(extractLiveView(st));
        lastUpdateRef.current = time;
      }

      if ((st.status as string) === 'resolved') {
        setPlaying(false);
        setLiveView(extractLiveView(st)); // final update
        if (autoScrollLog) {
          setTimeout(() => {
            if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
          }, 0);
        }
      }
    }
    reqRef.current = requestAnimationFrame(updateFrame);
  }, []);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(updateFrame);
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
  }, [updateFrame]);

  // ──── Auto-scroll log ────
  useEffect(() => {
    if (autoScrollLog && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [ledgerEntries.length, autoScrollLog]);

  const handleLogScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    setAutoScrollLog(scrollHeight - scrollTop - clientHeight < 35);
  };

  const handleVerify = async () => {
    if (ledgerRef.current) {
      const result = await ledgerRef.current.verify();
      setVerifyResult({ ...result, verifiedCount: ledgerEntries.length });
    }
  };

  useEffect(() => {
    if (liveView?.status === 'resolved' && ledgerRef.current && !verifyResult) {
      handleVerify();
    }
  }, [liveView?.status]);

  const handleCorruptDemo = async () => {
    if (ledgerRef.current) {
      try {
        await ledgerRef.current.corrupt(2);
        setVerifyResult(null); // Clear previous verification
        setLedgerEntries(prev => {
          const arr = [...prev];
          if (arr[1]) arr[1] = { ...arr[1], data: { ...arr[1].data, text: arr[1].data.text + ' [DEMO ALTERATION]' } };
          return arr;
        });
      } catch (err: any) {
        console.error('Corruption demo failed:', err.message);
      }
    }
  };

  const handleExportLog = () => {
    if (!ledgerEntries.length) return;
    const blob = new Blob([JSON.stringify(ledgerEntries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resqnet-log-${scenarioId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHeadHash = () => {
    if (ledgerRef.current) {
      navigator.clipboard.writeText(ledgerRef.current.head());
    }
  };

  const handleVerifyExport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const entries = JSON.parse(text);
        if (!Array.isArray(entries)) throw new Error('File does not contain an array of entries');
        const res = await verifyChain(entries);
        setVerifyResult({ ...res, verifiedCount: entries.length });
      } catch (err: any) {
        alert('Invalid log file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  // ──── Readiness gate ────
  const renderInfo = getSimulationRenderMode({
    authLoading, loading, isConfigured, error, scenario,
    hospitals, ambulances, roadGraph, simInput, state, engine,
  });

  if (renderInfo.mode === 'loading' || renderInfo.mode === 'initializing' || !liveView) {
    return <div className="main-content"><div className="spinner-center"><div className="spinner spinner-lg"/></div></div>;
  }
  if (renderInfo.mode === 'not_configured') return <div className="main-content"><ConfigNotice /></div>;
  if (renderInfo.mode === 'error') return <div className="main-content"><div className="alert alert-error">{error}</div></div>;
  if (renderInfo.mode === 'not_ready') {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Simulation Not Ready</h2>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
            {renderInfo.missingItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
          <Link to={`/workspace/${scenarioId}`} className="btn btn-secondary">← Back to Scenario</Link>
        </div>
      </div>
    );
  }

  // ──── Ready: build map data ────
  const isResolved = liveView.status === 'resolved';
  const msPerTick = 1000 / (PLAYBACK_RATE_NORMAL * speedRef.current);
  const interpolationFraction = (playing && !isResolved) ? Math.min(1, accRef.current / msPerTick) : 0;
  const mapPoints = getMapPoints(simInput, state, roadGraph, interpolationFraction);
  const displayMaps = buildDisplayNameMaps(simInput, state, roadGraph);

  // Filtered events for log display
  const displayEntries = showSnapshots 
    ? ledgerEntries 
    : ledgerEntries.filter(e => e.data.kind !== 'snapshot' && isKeyEvent(e.data));

  // Deduplicate pre-start road changes
  const preStartRoadChangeSeen = new Set<string>();

  // Play/Pause button label
  const playLabel = isResolved ? '✓ Done' : playing ? '⏸ Pause' : (liveView.status === 'running' && !playing) ? '▶ Resume' : '▶ Start';
  
  const headHash = ledgerRef.current?.head() || '0'.repeat(64);

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 80px)' }}>
      {/* ──── Header ──── */}
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '1.15rem', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scenario?.title} — Simulation</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            OpenStreetMap roads · one-way tags ignored · speed assumed {AMBULANCE_SPEED_MPS} m/s
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[0.1, 1, 4].map(s => (
            <button key={s} className="btn btn-secondary" onClick={() => setPlaybackSpeed(s)}
              style={{ fontWeight: playbackSpeed === s ? 700 : 400, outline: playbackSpeed === s ? '2px solid var(--primary)' : 'none', outlineOffset: '1px', minWidth: '40px' }}>
              {s}x
            </button>
          ))}
          <button className="btn btn-primary" onClick={() => setPlaying(!playing)} disabled={isResolved}
            style={{ minWidth: '80px' }}>
            {playLabel}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn btn-secondary" onClick={() => setRefitCounter(c => c + 1)} title="Re-centre map">⊕</button>
        </div>
      </header>

      {/* ──── Warnings ──── */}
      {mapPoints.warnings.length > 0 && (
        <div className="alert alert-warning" style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
          ⚠️ {mapPoints.warnings.join(' ')}
        </div>
      )}
      {simInput?.incidentSnap?.warning && (
        <div className="alert alert-warning" style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
          Incident snapped {simInput.incidentSnap.distanceMetres} m to nearest road (&gt;300 m).
        </div>
      )}
      {liveView.ambulances.some(a => a.status === 'stuck') && (
        <div className="alert alert-error" style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
          ⚠️ Ambulance stuck: {state?.ambulances.find(a => a.status === 'stuck')?.stuckReason}
        </div>
      )}

      {/* ──── Main layout ──── */}
      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minHeight: 0 }}>

        {/* ──── Map & Legend Column ──── */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0, gap: '8px' }}>
          {/* ──── Map ──── */}
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', height: 'clamp(420px, 62vh, 640px)', width: '100%' }}>
            <MapContainer
              bounds={mapPoints.bounds || undefined}
              center={!mapPoints.bounds && mapPoints.incident ? [mapPoints.incident.lat, mapPoints.incident.lng] : undefined}
              zoom={!mapPoints.bounds ? 14 : undefined}
              style={{ width: '100%', height: '100%', background: '#e8e8e8' }}
              zoomAnimation={true}
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {roadGraph && engine && <RoadLayer graph={roadGraph} engine={engine} />}
              <MapRefit bounds={refitCounter > 0 ? mapPoints.bounds : null} key={refitCounter} />

              {/* Active routes */}
              {mapPoints.activeRoutes.map(route => (
                <Polyline key={route.id} positions={route.positions}
                  pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} />
              ))}

              {/* Incident */}
              {mapPoints.incident && (
                <Marker position={[mapPoints.incident.lat, mapPoints.incident.lng]} icon={getIncidentIcon()} />
              )}

              {/* Hospitals */}
              {mapPoints.hospitals.map(h => {
                return (
                  <Marker key={h.id} position={[h.point.lat, h.point.lng]} icon={getHospitalIcon()} />
                );
              })}

              {/* Ambulances rendered imperatively via component */}
              <AmbulanceLayer 
                simInput={simInput} stateRef={stateRef} roadGraph={roadGraph} 
                playingRef={playingRef} accRef={accRef} speedRef={speedRef} 
              />
            </MapContainer>
          </div>

          {/* Map Legend (Below Map) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '0 4px', fontSize: '0.75rem', color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', background: 'white', border: '2px solid #16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '9px', fontWeight: 'bold' }}>H</div> Scenario hospital</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', background: '#ef4444', border: '1px solid white', borderRadius: '50%' }}></div> Incident</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '8px', background: 'white', border: '1px solid black', borderRadius: '2px' }}></div> Ambulance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '3px', background: '#dc2626', borderTop: '1px dashed white' }}></div> Blocked road</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '3px', background: '#d97706' }}></div> Partial road</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto' }}>Red crosses on the basemap are OpenStreetMap places, not scenario hospitals.</div>
          </div>
        </div>

        {/* ──── Dashboard ──── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '280px', maxWidth: '400px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.75rem', height: '100%' }}>
            {/* Fleet Status */}
            <h3 style={{ marginBottom: '0.4rem', fontSize: '0.95rem', flexShrink: 0 }}>Fleet Status</h3>
            <div style={{
              display: 'grid', 
              gridTemplateColumns: liveView.ambulances.length > 8 ? '1fr 1fr' : '1fr',
              gap: '0.35rem', 
              marginBottom: '0.5rem', 
              flexShrink: 0
            }}>
              {liveView.ambulances.map(a => {
                const { text, icon, color } = getAmbulanceStatus(a, liveView.simSeconds > 0, displayMaps);
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-elevated)', padding: '0.35rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>{a.label}</strong> {text}</span>
                  </div>
                );
              })}
            </div>

            {/* Counters + Log header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.3rem', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Decision Log</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {time(liveView.simSeconds)} · {liveView.deliveredCount} delivered · {liveView.waiting} waiting
              </span>
            </div>
            
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span>{ledgerEntries.length} entries · head {headHash.slice(0, 8)}…</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.3rem', flexShrink: 0 }}>
              <button onClick={handleVerify} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Verify</button>
              <button onClick={handleCopyHeadHash} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Copy hash</button>
              <button onClick={handleExportLog} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Export JSON</button>
              <label className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                Verify file
                <input type="file" accept=".json" onChange={handleVerifyExport} style={{ display: 'none' }} />
              </label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '4px', flexShrink: 0 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSnapshots} onChange={e => setShowSnapshots(e.target.checked)} style={{ width: '12px', height: '12px' }} />
                Show minute snapshots
              </label>
              
              {isDemoMode && (
                <button onClick={handleCorruptDemo} style={{ fontSize: '0.7rem', background: '#fecaca', color: '#991b1b', border: '1px solid #f87171', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>
                  Corrupt entry 2
                </button>
              )}
            </div>
            
            {verifyResult && (
              <pre style={{ margin: '0 0 0.5rem 0', padding: '0.4rem', background: verifyResult.ok ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: verifyResult.ok ? 'var(--success)' : 'var(--error)', border: `1px solid ${verifyResult.ok ? 'var(--success)' : 'var(--error)'}`, borderRadius: '4px', fontSize: '0.7rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {verifyResult.ok ? ((verifyResult as any).verifiedCount !== ledgerEntries.length ? `Verified ${(verifyResult as any).verifiedCount} of ${ledgerEntries.length} entries. Verify again.` : `✓ ${verifyResult.count} entries verified, chain intact`) : failureReport(verifyResult)}
              </pre>
            )}

            {/* Event log */}
            <div
              ref={logContainerRef}
              onScroll={handleLogScroll}
              style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-elevated)', borderRadius: '4px', padding: '0.4rem', fontSize: '0.78rem', position: 'relative', minHeight: '260px' }}
            >
              {displayEntries.map(e => {
                const evData = e.data.details || e.data;
                // Deduplicate pre-start road changes
                if (evData.kind === 'road_change' && evData.simSeconds === 0) {
                  const edgeId = evData.edgeId ?? e.data.text;
                  if (preStartRoadChangeSeen.has(edgeId)) return null;
                  preStartRoadChangeSeen.add(edgeId);
                }
                return (
                  <div key={e.hash} style={{ marginBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem', lineHeight: 1.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)', marginRight: '0.4rem', fontWeight: 600 }}>T+{e.data.simTime || time(e.data.simSeconds || 0)}</span>
                        <span style={{ 
                          fontWeight: 600, 
                          color: 'var(--primary)', 
                          fontSize: '0.65rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          padding: '1px 4px',
                          borderRadius: '4px'
                        }}>
                          {e.data.kind.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        #{e.data.id} · {e.hash.slice(0, 8)}
                      </div>
                    </div>
                    <div style={{ paddingLeft: '0.2rem' }}>
                      {describeEvent(evData, displayMaps)}
                    </div>
                  </div>
                );
              })}
              <div style={{ paddingBottom: '30px' }} />
              {!autoScrollLog && (
                <button
                  onClick={() => setAutoScrollLog(true)}
                  style={{ position: 'sticky', bottom: '6px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', zIndex: 10 }}
                >
                  Jump to latest
                </button>
              )}
            </div>
            
            <details style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
              <summary style={{ cursor: 'pointer', outline: 'none' }}>Tamper-evident, not tamper-proof. What does this mean?</summary>
              <div style={{ marginTop: '0.3rem', paddingLeft: '0.8rem', borderLeft: '2px solid var(--border-color)' }}>
                Each entry's hash includes the previous entry's hash, so editing an old entry breaks every later link and Verify log reports the first broken entry. The chain is stored in this browser with no outside witness: someone who can rewrite the whole chain can recompute every hash. It is not immutable and not a blockchain.
              </div>
            </details>
          </div>

          {/* Completion summary */}
          {liveView.status === 'resolved' && (
            <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)', padding: '0.75rem' }}>
              <h3 style={{ color: 'var(--success)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Simulation Complete</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                Delivered: {liveView.deliveredCount}. Of these, {liveView.underResourcedCount} arrived at a hospital short of required resources.
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                Elapsed: {time(liveView.simSeconds)}
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                Completed trips: {liveView.ambulances.reduce((acc, a) => acc + a.trips, 0)}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Synthetic scenario. Speed assumed {AMBULANCE_SPEED_MPS} m/s. Not medical advice.
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
