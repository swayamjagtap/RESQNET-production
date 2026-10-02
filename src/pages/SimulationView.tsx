import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Scenario, Hospital, Ambulance } from '../lib/types';
import { buildSimInput, createRun } from '../sim/adapter';
import { SimEngine, AMBULANCE_SPEED_MPS } from '../sim/engine';
import type { SimState } from '../sim/types';
import { accumulatePlayback } from '../lib/playback';
import { computeCollocationOffset, getMapPoints } from '../lib/map-utils';
import { buildDisplayNameMaps, describeEvent, isKeyEvent, replaceRawNodeIds } from '../lib/event-display';
import { RoadLayer } from '../components/RoadLayer';
import { createLedger, verifyChain, failureReport, time, type Ledger, type LedgerEntry, type VerifyResult } from '../lib/audit';
import { drainEventsToLedger } from '../lib/ledger-feed';
import { extractLiveView, type LiveView } from '../lib/live-view';
import { buildDashboardView, groupCoLocatedAmbulances, type DashboardView } from '../lib/dashboard-view';
import { Card } from '../components/Card';
import { SvgStepChart } from '../components/SvgStepChart';
import { buildComparisonNote } from '../lib/compare-note';

const PLAYBACK_RATE_NORMAL = 20;

/* ─────────────────── Icon Helpers ───────────────────────────────────────── */

function getAmbulanceIcon(label: string, count: number, capacity: number, bearing: number, dx = 0, dy = 0) {
  const short = label.length > 8 ? label.slice(0, 8) + '…' : label;
  const isWest = bearing < 0;
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
  const svg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>`;
  const html = `<div style="background:white;border:2px solid #ef4444;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:default;">${svg}</div>`;
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
}

/* ─────────────────── MapRefit component ─────────────────────────────────── */

function MapRefit({ bounds, trigger }: { bounds: L.LatLngBoundsExpression | null, trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30] });
  }, [bounds, map, trigger]);

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
        const groups = groupCoLocatedAmbulances(mapPoints.ambulances, map.getZoom(), 14);
        
        // Map ambulance to its group for easy lookup
        const ambToGroup = new Map<string, any>();
        for (const g of groups) {
          for (let i = 0; i < g.group.length; i++) {
            ambToGroup.set(g.group[i].id, { group: g, idx: i });
          }
        }
        
        mapPoints.ambulances.forEach(item => {
           const marker = markersRef.current[item.ambulance.id];
           if (marker) {
              marker.setOpacity(1);
              marker.setLatLng([item.point.lat, item.point.lng]);
              
              const el = marker.getElement();
              if (el) {
                 const svgContainer = el.querySelector('.amb-svg-container') as HTMLElement;
                 if (svgContainer) {
                   const isWest = item.bearing < 0;
                   svgContainer.style.transform = `scaleX(${isWest ? -1 : 1})`;
                 }
                 
                 const textContainer = el.querySelector('.amb-text-container') as HTMLElement;
                 const groupInfo = ambToGroup.get(item.ambulance.id);
                 
                 if (textContainer) {
                   if (groupInfo && groupInfo.idx > 0) {
                     textContainer.style.display = 'none';
                   } else {
                     textContainer.style.display = 'block';
                     if (groupInfo && groupInfo.group.group.length > 1) {
                       const labels = groupInfo.group.group.map((gItem: any) => {
                         const onboard = gItem.ambulance.cargo.reduce((sum: number, g: any) => sum + g.count, 0);
                         const label = gItem.ambulance.label;
                         const short = label.length > 8 ? label.slice(0, 8) + '…' : label;
                         return `${short} ${onboard}/${gItem.ambulance.capacity}`;
                       });
                       textContainer.innerHTML = labels.join('&nbsp;·&nbsp;');
                     } else {
                       const onboard = item.ambulance.cargo.reduce((sum: number, g: any) => sum + g.count, 0);
                       const label = item.ambulance.label;
                       const short = label.length > 8 ? label.slice(0, 8) + '…' : label;
                       textContainer.innerHTML = `${short}&nbsp;·&nbsp;${onboard}/${item.ambulance.capacity}`;
                     }
                   }
                 }

                 const wrapper = el.querySelector('.amb-wrapper') as HTMLElement;
                 if (wrapper) {
                    let edgeDirX = 1, edgeDirY = 0;
                    if (item.ambulance.currentPath.length >= 2 && roadGraph?.nodes) {
                      const n1 = roadGraph.nodes[item.ambulance.currentPath[0]];
                      const n2 = roadGraph.nodes[item.ambulance.currentPath[1]];
                      if (n1 && n2) { edgeDirX = n2.lng - n1.lng; edgeDirY = n2.lat - n1.lat; }
                    }
                    const idx = groupInfo ? groupInfo.idx : 0;
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


/* ─────────────────── Readiness logic ────────────────────────────────────── */

export interface SimPageInputs {
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
  | 'error'
  | 'not_ready'
  | 'initializing'
  | 'ready';

export function getSimulationRenderMode(inputs: SimPageInputs): {
  mode: SimPageRenderMode;
  missingItems: string[];
} {
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

export const SimulationView: React.FC<{
  title: string;
  scenario: Scenario;
  hospitals: Hospital[];
  ambulances: Ambulance[];
}> = ({ title, scenario, hospitals, ambulances }) => {
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'log'|'comparison'|'audit'>('log');
  const [roadGraph, setRoadGraph] = useState<any>(null);
  const [simInput, setSimInput] = useState<any>(null);

  const [engine, setEngine] = useState<SimEngine | null>(null);
  const [state, setState] = useState<SimState | null>(null);
  const [liveView, setLiveView] = useState<LiveView | null>(null);
  const [dashboard, setDashboard] = useState<DashboardView | null>(null);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [verifyResult, setVerifyResult] = useState<(VerifyResult & { verifiedCount?: number }) | null>(null);
  const ledgerRef = useRef<Ledger | null>(null);
  const cursorRef = useRef({ current: 0 });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [autoScrollLog, setAutoScrollLog] = useState(true);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [refitCounter, setRefitCounter] = useState(1);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);

  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const accRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const engineRef = useRef<SimEngine | null>(null);
  const stateRef = useRef<SimState | null>(null);
  const simInputRef = useRef<any>(null);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { simInputRef.current = simInput; }, [simInput]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = playbackSpeed; }, [playbackSpeed]);
  
  useEffect(() => {
    setIsDemoMode(window.location.hash === '#audit-dev');
    const handleHash = () => setIsDemoMode(window.location.hash === '#audit-dev');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // ──── Load Graph ────
  useEffect(() => {
    async function loadGraph() {
      try {
        const graphModule = await import('../sim/graph').then(m => m.loadVileParleGraph());
        setRoadGraph(graphModule);
      } catch (err: any) {
        setError(err.message || 'Failed to load map data');
      }
    }
    loadGraph();
  }, []);

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
      setDashboard(buildDashboardView(initialRun, input));
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
    setDashboard(buildDashboardView(freshRun, simInput));
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
        if (simInputRef.current) setDashboard(buildDashboardView(st, simInputRef.current));
        lastUpdateRef.current = time;
      }

      if ((st.status as string) === 'resolved') {
        setPlaying(false);
        setLiveView(extractLiveView(st)); // final update
        if (simInputRef.current) setDashboard(buildDashboardView(st, simInputRef.current));
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
    if (liveView?.status === 'resolved') {
      setRefitCounter(c => c + 1);
      if (ledgerRef.current && !verifyResult) {
        handleVerify();
      }
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
    a.download = `resqnet-log-${scenario.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const handleCompare = async () => {
    if (!roadGraph) return;
    setComparing(true);
    setCompareResult(null);
    
    // Yield to let React render spinner
    await new Promise(r => setTimeout(r, 50));
    
    try {
      const { runPolicyComparison } = await import('../lib/compare');
      const res = await Promise.race([
        new Promise<any>((resolve, reject) => {
          setTimeout(() => {
            try {
              resolve(runPolicyComparison(scenario, hospitals, ambulances, roadGraph));
            } catch (e) {
              reject(e);
            }
          }, 0);
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Comparison timed out")), 20000))
      ]);
      
      if (!res.ok) {
        throw new Error(res.reason);
      }
      setCompareResult(res);
    } catch (e: any) {
      console.error('compare error', e);
      alert('Comparison failed: ' + (e.message || String(e)));
    } finally {
      setComparing(false);
    }
  };

  // ──── Readiness gate ────
  const renderInfo = getSimulationRenderMode({
    error, scenario,
    hospitals, ambulances, roadGraph, simInput, state, engine,
  });

  if (renderInfo.mode === 'initializing' || !liveView) {
    return <div className="main-content"><div className="spinner-center"><div className="spinner spinner-lg"/></div></div>;
  }
  if (renderInfo.mode === 'error') return <div className="main-content"><div className="alert alert-error">{error}</div></div>;
  if (renderInfo.mode === 'not_ready') {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Simulation Not Ready</h2>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
            {renderInfo.missingItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
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
  const playLabel = isResolved ? (
    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'4px', verticalAlign: 'middle'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Done</>
  ) : playing ? (
    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'4px', verticalAlign: 'middle'}}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
  ) : (liveView.status === 'running' && !playing) ? (
    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'4px', verticalAlign: 'middle'}}><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume</>
  ) : (
    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'4px', verticalAlign: 'middle'}}><polygon points="5 3 19 12 5 21 5 3"/></svg> Start</>
  );
  
  const headHash = ledgerRef.current?.head() || '0'.repeat(64);

  return (
    <div className="app-container">
      {/* 1. Command bar */}
      <header className="navbar" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="brand-title" style={{ fontSize: '1.2rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title} — Simulation</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            OpenStreetMap roads · one-way tags ignored · speed assumed {AMBULANCE_SPEED_MPS} m/s
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[0.1, 1, 4].map(s => (
            <button key={s} className="btn btn-secondary" onClick={() => setPlaybackSpeed(s)}
              style={{ padding: '0.4rem 0.8rem', fontWeight: playbackSpeed === s ? 700 : 400, borderColor: playbackSpeed === s ? 'var(--primary)' : 'var(--border-color)', minWidth: '40px' }}>
              {s}x
            </button>
          ))}
          <button className="btn btn-primary" onClick={() => setPlaying(!playing)} disabled={isResolved}
            style={{ minWidth: '100px' }}>
            {playLabel}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn btn-secondary" onClick={() => {
            setTab('comparison');
            handleCompare();
          }} disabled={comparing}>
            {comparing ? 'Comparing...' : 'Compare policies'}
          </button>
          <button className="btn btn-secondary" onClick={() => setRefitCounter(c => c + 1)} title="Re-centre map" aria-label="Re-centre map">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
        </div>
      </header>

      <div className="main-content" style={{ maxWidth: '1440px', padding: '1.5rem' }}>
        {/* Warnings */}
        {mapPoints.warnings.length > 0 && (
          <div className="alert alert-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle'}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {mapPoints.warnings.join(' ')}
          </div>
        )}
        {simInput?.incidentSnap?.warning && (
          <div className="alert alert-warning">
            Incident snapped {simInput.incidentSnap.distanceMetres} m to nearest road (&gt;300 m).
          </div>
        )}
        {liveView.ambulances.some(a => a.status === 'stuck') && (
          <div className="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle'}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {liveView.ambulances.filter(a => a.status === 'stuck').map(a => {
              const ambObj = state?.ambulances.find(st => st.id === a.id);
              const label = displayMaps.ambulanceLabels.get(a.id) || a.label || a.id;
              const rawReason = ambObj?.stuckReason || 'stuck';
              const cleanReason = replaceRawNodeIds(rawReason, displayMaps);
              return `${label} is stuck: ${cleanReason}`;
            }).join(' | ')}
          </div>
        )}

        {/* 2. KPI strip */}
        {dashboard && (
          <div className="kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: 'var(--text-muted)'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Elapsed</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{dashboard.kpis.simulatedTime}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Scenario duration</div>
            </Card>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: 'var(--text-muted)'}}><path d="M3 21h18"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Delivered</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{dashboard.kpis.delivered}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>of {dashboard.kpis.totalPatients} patients</div>
            </Card>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: 'var(--text-muted)'}}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>In Transit</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{dashboard.kpis.onboard}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>across fleet</div>
            </Card>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: 'var(--text-muted)'}}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Waiting</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{dashboard.kpis.waiting}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dashboard.kpis.assigned} assigned</div>
            </Card>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: dashboard.kpis.deliveredShort > 0 ? 'var(--error)' : 'var(--text-muted)'}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: dashboard.kpis.deliveredShort > 0 ? 'var(--error)' : 'var(--text-muted)' }}>Shortfalls</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: dashboard.kpis.deliveredShort > 0 ? 'var(--error)' : 'inherit' }}>{dashboard.kpis.deliveredShort}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>affected patients</div>
            </Card>
            <Card style={{ padding: '12px', height: '92px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{color: 'var(--text-muted)'}}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span className="kpi-label" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reroutes</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '28px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{dashboard.kpis.reroutes}</div>
              <div className="kpi-context" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dashboard.kpis.lastRerouteTime !== null ? `last: T+${time(dashboard.kpis.lastRerouteTime)}` : 'none'}</div>
            </Card>
          </div>
        )}

        {/* 3. Main row */}
        <div className="grid-12">
          {/* Map Column */}
          <div className="col-map">
            <div className="card sim-map-col" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: 'var(--sim-h, clamp(460px, 72vh, 700px))', display: 'flex', flexDirection: 'column' }}>
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
                <MapRefit bounds={mapPoints.bounds} trigger={refitCounter} />

                {mapPoints.activeRoutes.map(route => (
                  <Polyline key={route.id} positions={route.positions} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} />
                ))}

                {mapPoints.incident && (
                  <Marker position={[mapPoints.incident.lat, mapPoints.incident.lng]} icon={getIncidentIcon()} />
                )}

                {mapPoints.hospitals.map(h => {
                  const dh = dashboard?.hospitals.find(d => d.id === h.id);
                  return (
                    <Marker key={h.id} position={[h.point.lat, h.point.lng]} icon={getHospitalIcon()}>
                      <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                        <div style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                          <strong style={{ display: 'block', marginBottom: '2px' }}>{h.name}</strong>
                          {dh ? (
                            <>
                              <div>ICU: {dh.icu.remaining}</div>
                              <div>Blood: {dh.blood.remaining}</div>
                              <div>Vent: {dh.vent.remaining}</div>
                              <div>Beds: {dh.beds.remaining}</div>
                            </>
                          ) : 'Loading...'}
                        </div>
                      </Tooltip>
                    </Marker>
                  );
                })}

                <AmbulanceLayer 
                  simInput={simInput} stateRef={stateRef} roadGraph={roadGraph} 
                  playingRef={playingRef} accRef={accRef} speedRef={speedRef} 
                />
              </MapContainer>
            </div>
          </div>

          {/* Side Panel Column */}
          <div className="col-side">
            <Card fill style={{ height: 'var(--sim-h, clamp(460px, 72vh, 700px))', padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} bodyClassName="sim-dash-col" >
              {/* Compact fleet strip */}
              {dashboard && (
                <div style={{ flex: 'none', display: 'grid', gridTemplateColumns: dashboard.ambulances.length > 6 ? '1fr 1fr' : '1fr', gap: '0.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  {dashboard.ambulances.map(a => {
                    let text = 'idle';
                    if (a.statusSentence.startsWith('en route to ')) {
                      text = `→ ${a.statusSentence.replace('en route to ', '')}`;
                      if (a.onboard > 0) text += ` · ${a.onboard}/${a.capacity}`;
                    } else if (a.statusSentence.startsWith('delivering at ')) {
                      text = `→ ${a.statusSentence.replace('delivering at ', '')}`;
                    } else if (a.statusSentence.startsWith('stuck: ')) {
                      text = `stuck — ${a.statusSentence.replace('stuck: ', '')}`;
                    } else if (a.statusSentence === 'idle' && a.destinationName) {
                      text = `idle at ${a.destinationName}`;
                    } else {
                      text = a.statusSentence;
                    }
                    return (
                      <div key={a.id} title={`${a.label}: ${a.statusSentence}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem', padding: '2px 0' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink: 0}}>
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                        <strong style={{ flexShrink: 0 }}>{a.label}</strong>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabs */}
              <div 
                role="tablist" 
                className="custom-tablist" 
                aria-label="Simulation details" 
                onKeyDown={(e) => {
                  const tabOrder: Array<'log' | 'comparison' | 'audit'> = ['log', 'comparison', 'audit'];
                  const currentIndex = tabOrder.indexOf(tab);
                  if (currentIndex === -1) return;
                  let nextIndex = currentIndex;
                  if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % tabOrder.length;
                  } else if (e.key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
                  } else if (e.key === 'Home') {
                    nextIndex = 0;
                  } else if (e.key === 'End') {
                    nextIndex = tabOrder.length - 1;
                  } else {
                    return;
                  }
                  e.preventDefault();
                  const nextTab = tabOrder[nextIndex];
                  setTab(nextTab);
                  const tabEl = document.getElementById(`tab-${nextTab}`);
                  if (tabEl) tabEl.focus();
                }}
                style={{ flex: 'none', display: 'flex', overflowX: 'auto', paddingBottom: '4px' }}
              >
                <button 
                  id="tab-log"
                  role="tab" 
                  aria-controls="tabpanel-log"
                  className="custom-tab" 
                  aria-selected={tab === 'log'}
                  tabIndex={tab === 'log' ? 0 : -1}
                  onClick={() => setTab('log')}
                  style={{ whiteSpace: 'nowrap', flex: 1, fontSize: '13px', padding: '8px' }}
                >
                  Decision log
                </button>
                <button 
                  id="tab-comparison"
                  role="tab" 
                  aria-controls="tabpanel-comparison"
                  className="custom-tab" 
                  aria-selected={tab === 'comparison'}
                  tabIndex={tab === 'comparison' ? 0 : -1}
                  onClick={() => setTab('comparison')}
                  style={{ whiteSpace: 'nowrap', flex: 1, fontSize: '13px', padding: '8px' }}
                >
                  Policy comparison
                </button>
                <button 
                  id="tab-audit"
                  role="tab" 
                  aria-controls="tabpanel-audit"
                  className="custom-tab" 
                  aria-selected={tab === 'audit'}
                  tabIndex={tab === 'audit' ? 0 : -1}
                  onClick={() => setTab('audit')}
                  style={{ whiteSpace: 'nowrap', flex: 1, fontSize: '13px', padding: '8px' }}
                >
                  Ledger tools
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-panel-container overflow-y-auto" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {tab === 'log' && (
                  <div className="log-tab-wrapper">
                    <div className="log-header">
                      <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>Decision Log</h3>
                      {dashboard && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {dashboard.kpis.delivered} delivered · {dashboard.kpis.waiting} waiting
                        </span>
                      )}
                    </div>
                    
                    <div
                      ref={logContainerRef}
                      onScroll={handleLogScroll}
                      className="log-scroll-container"
                      aria-live="polite"
                    >
                      {displayEntries.map(e => {
                        const evData = e.data.details || e.data;
                        if (evData.kind === 'road_change' && evData.simSeconds === 0) {
                          const edgeId = evData.edgeId ?? e.data.text;
                          if (preStartRoadChangeSeen.has(edgeId)) return null;
                          preStartRoadChangeSeen.add(edgeId);
                        }
                        return (
                          <div key={e.hash} style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                              <div>
                                <span style={{ color: 'var(--text-dim)', marginRight: '0.5rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                  T+{e.data.simTime || time(e.data.simSeconds || 0)}
                                </span>
                                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                                  {e.data.kind}
                                </span>
                              </div>
                            </div>
                            <div style={{ color: 'var(--text-main)', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                              {describeEvent(evData, displayMaps)}
                            </div>
                          </div>
                        );
                      })}
                      {!autoScrollLog && (
                        <button
                          onClick={() => setAutoScrollLog(true)}
                          style={{ position: 'sticky', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#000', border: 'none', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                        >
                          Jump to latest
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'comparison' && (
                  <div style={{ paddingBottom: '2rem' }}>
                    {!compareResult && !comparing && (
                      <div className="empty-state">
                        Click "Compare policies" in the command bar to run a headless baseline comparison.
                      </div>
                    )}
                    {comparing && (
                      <div className="spinner-center">
                        <div className="spinner spinner-lg"></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Running baseline simulation...</p>
                      </div>
                    )}
                    {compareResult && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Differences reflect severity-first ordering and stock-aware choice.</p>
                          <button onClick={() => setCompareResult(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}>Clear</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {(() => {
                            const renderBlock = (label: string, valR: number | null, valB: number | null, fmt: (v: number) => string, invertGood = false) => {
                              if (valR === null || valB === null) return null;
                              const max = Math.max(valR, valB, 1);
                              const pctR = (valR / max) * 100;
                              const pctB = (valB / max) * 100;
                              const betterR = invertGood ? valR > valB : valR < valB;
                              const betterB = invertGood ? valB > valR : valB < valR;
                              return (
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem' }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>{label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ width: '95px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resource-aware</div>
                                      <div style={{ flex: 1, height: '6px', background: 'var(--bg-card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pctR}%`, background: betterR ? 'var(--success)' : (valR === valB ? 'var(--text-muted)' : 'var(--warning)') }}></div>
                                      </div>
                                      <div style={{ width: '45px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(valR)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ width: '95px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline</div>
                                      <div style={{ flex: 1, height: '6px', background: 'var(--bg-card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pctB}%`, background: betterB ? 'var(--success)' : (valR === valB ? 'var(--text-muted)' : 'var(--warning)') }}></div>
                                      </div>
                                      <div style={{ width: '45px', textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(valB)}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            };
                            return (
                              <>
                                {renderBlock('Mean time to hospital, high-priority patients', compareResult.resource_aware.meanHighPriorityDeliverySeconds, compareResult.baseline.meanHighPriorityDeliverySeconds, (v) => time(Math.round(v)))}
                                {renderBlock('Patients delivered to a hospital short of required stock', compareResult.resource_aware.underResourcedCount, compareResult.baseline.underResourcedCount, (v) => v.toString())}
                                {renderBlock('Simulated elapsed', compareResult.resource_aware.simulatedSeconds, compareResult.baseline.simulatedSeconds, (v) => time(Math.round(v)))}
                                {renderBlock('Completed trips', compareResult.resource_aware.completedTrips, compareResult.baseline.completedTrips, (v) => v.toString(), true)}
                              </>
                            );
                          })()}
                        </div>
                        {(() => {
                          const note = buildComparisonNote(compareResult);
                          return (
                            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem' }}>
                              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0 0 0.5rem 0', fontWeight: 600, wordBreak: 'break-word' }}>
                                {note.headline}
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {note.lines.map((line, idx) => (
                                  <p key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem', marginBottom: 0, fontStyle: 'italic', wordBreak: 'break-word' }}>
                                {note.disclosure}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'audit' && (
                  <div style={{ paddingBottom: '3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="card" style={{ padding: '1rem', background: 'var(--bg-input)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Log State</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <div>{ledgerEntries.length} entries stored</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>Head: {headHash}</div>
                        </div>
                      </div>

                      <div className="form-actions" style={{ flexWrap: 'wrap', gap: '0.5rem', display: 'flex' }}>
                        <button onClick={handleVerify} className="btn btn-primary" style={{ flex: '1 1 calc(50% - 0.25rem)' }}>Verify chain</button>
                        <button onClick={() => { navigator.clipboard.writeText(headHash); alert('Hash copied'); }} className="btn btn-secondary" style={{ flex: '1 1 calc(50% - 0.25rem)' }}>Copy hash</button>
                        <button onClick={handleExportLog} className="btn btn-secondary" style={{ flex: '1 1 calc(50% - 0.25rem)' }}>Export JSON</button>
                        <label className="btn btn-secondary" style={{ flex: '1 1 calc(50% - 0.25rem)', textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                          Verify file
                          <input type="file" accept=".json" onChange={handleVerifyExport} style={{ display: 'none' }} />
                        </label>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        A cryptographic chain ensures historical entries cannot be altered without changing the head hash.
                      </p>

                      <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                        <input type="checkbox" checked={showSnapshots} onChange={e => setShowSnapshots(e.target.checked)} />
                        Include minute snapshots in log
                      </label>

                      {isDemoMode && (
                        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
                          <h4 style={{ color: 'var(--error)', margin: '0 0 0.5rem 0' }}>Demo Tools</h4>
                          <button onClick={handleCorruptDemo} className="btn btn-danger" style={{ width: '100%' }}>
                            Simulate tampering (Corrupt entry 2)
                          </button>
                        </div>
                      )}

                      {verifyResult && (
                        <div className={`alert ${verifyResult.ok ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem', wordBreak: 'break-all' }}>
                          {verifyResult.ok 
                            ? ((verifyResult as any).verifiedCount !== ledgerEntries.length ? `Verified ${(verifyResult as any).verifiedCount} of ${ledgerEntries.length} entries. Verify again.` : `Verified ${verifyResult.count} entries, chain intact`) 
                            : failureReport(verifyResult)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* 4. Analytics layout */}
        {dashboard && (
          <div className="analytics-container">
            {/* Row A: Hospital Inventory (Full width) */}
            <div className="analytics-row-a">
              <Card style={{ width: '100%' }}>
                <div className="card-header">
                  <h3 className="card-title">Hospital Inventory</h3>
                </div>
                <div className="card-body">
                  <div className="hospital-subcards-grid">
                    {dashboard.hospitals.map(h => {
                      const depleted = [];
                      if (h.icu.remaining === 0 && h.icu.initial > 0) depleted.push('ICU');
                      if (h.blood.remaining === 0 && h.blood.initial > 0) depleted.push('Blood');
                      if (h.vent.remaining === 0 && h.vent.initial > 0) depleted.push('Vent');
                      if (h.beds.remaining === 0 && h.beds.initial > 0) depleted.push('Beds');
                      const summary = depleted.length > 0 ? `Depleted: ${depleted.join(', ')}` : 'All stocked';

                      return (
                        <div key={h.id} style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: '8px' }}>
                          <div className="hospital-bar-header" style={{ marginBottom: '0.75rem' }}>
                            <span className="hospital-bar-title">{h.name}</span>
                            <span style={{ fontSize: '0.75rem', color: depleted.length > 0 ? 'var(--error)' : 'var(--success)' }}>
                              {summary}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                              { key: 'ICU', r: h.icu },
                              { key: 'Blood', r: h.blood },
                              { key: 'Vent', r: h.vent },
                              { key: 'Beds', r: h.beds }
                            ].map(item => {
                              const r = item.r;
                              const pct = r.initial === 0 ? 0 : Math.max(0, Math.min(100, (r.remaining / r.initial) * 100));
                              const statusChip = r.initial === 0 ? 'none' : r.remaining === 0 ? 'Depleted' : pct <= 25 ? 'Low' : 'OK';
                              return (
                                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                    <div style={{ width: '45px', color: 'var(--text-muted)' }}>{item.key}</div>
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      {r.initial === 0 ? (
                                        <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>0 / 0</span>
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ width: '45px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.remaining} / {r.initial}</span>
                                          <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{r.reserved > 0 ? `res ${r.reserved}` : ''} {r.consumed > 0 ? `use ${r.consumed}` : ''}</span>
                                        </div>
                                      )}
                                      <span style={{ 
                                        fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)',
                                        color: statusChip === 'OK' ? 'var(--success)' : statusChip === 'Low' ? 'var(--warning)' : statusChip === 'Depleted' ? 'var(--error)' : 'var(--text-dim)'
                                      }}>
                                        {statusChip}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="hospital-bar-track" style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div className="hospital-bar-fill" style={{ height: '100%', width: `${pct}%`, background: r.initial === 0 ? 'rgba(255,255,255,0.2)' : pct <= 25 ? 'var(--warning)' : 'var(--primary)', transition: 'width 0.3s ease' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* Row B: Patients by Injury and Deliveries over Time side-by-side */}
            <div className="analytics-row-b">
              {/* Patients by Injury */}
              <div className="patients-panel">
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header">
                    <div className="card-title-area">
                      <h3 className="card-title">Patients by Injury</h3>
                      <span className="card-info-icon" title="Pipeline: Waiting for dispatch -> Assigned -> On board -> Delivered (or Delivered short of stock)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                      </span>
                    </div>
                  </div>
                  <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* One Legend for pipeline */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '2px' }}></span> Delivered</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', background: 'var(--error)', borderRadius: '2px' }}></span> Short</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '2px' }}></span> On board</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '2px' }}></span> Assigned</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', background: 'var(--warning)', borderRadius: '2px' }}></span> Waiting</div>
                      </div>
                      {dashboard.patients.map(p => {
                        if (p.total === 0) return null;
                        return (
                          <div key={p.type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                              <strong style={{ textTransform: 'capitalize' }}>{p.type.replace('_', ' ')}</strong>
                              <span style={{ color: 'var(--text-muted)' }}>{p.total} total</span>
                            </div>
                            
                            <div className="pipeline-bar-wrapper">
                              {p.delivered > 0 && <div className="pipeline-segment" style={{ width: `${(p.delivered / p.total)*100}%`, background: 'var(--success)' }} title={`Delivered: ${p.delivered}`}>{p.delivered > p.total * 0.1 ? p.delivered : ''}</div>}
                              {p.deliveredShort > 0 && <div className="pipeline-segment" style={{ width: `${(p.deliveredShort / p.total)*100}%`, background: 'var(--error)' }} title={`Delivered short: ${p.deliveredShort}`}>{p.deliveredShort > p.total * 0.1 ? p.deliveredShort : ''}</div>}
                              {p.onboard > 0 && <div className="pipeline-segment" style={{ width: `${(p.onboard / p.total)*100}%`, background: 'var(--primary)' }} title={`On board: ${p.onboard}`}>{p.onboard > p.total * 0.1 ? p.onboard : ''}</div>}
                              {p.assigned > 0 && <div className="pipeline-segment" style={{ width: `${(p.assigned / p.total)*100}%`, background: '#8b5cf6' }} title={`Assigned: ${p.assigned}`}>{p.assigned > p.total * 0.1 ? p.assigned : ''}</div>}
                              {p.waiting > 0 && <div className="pipeline-segment" style={{ width: `${(p.waiting / p.total)*100}%`, background: 'var(--warning)' }} title={`Waiting: ${p.waiting}`}>{p.waiting > p.total * 0.1 ? p.waiting : ''}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Deliveries over time */}
              <div className="deliveries-panel">
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header">
                    <h3 className="card-title">Deliveries over Time</h3>
                  </div>
                  <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                    {(() => {
                      const deliveryEvents = state?.events.filter(e => e.kind === 'delivery') || [];
                      let accumulated = 0;
                      const data = [{ x: 0, y: 0 }];
                      deliveryEvents.forEach(e => {
                        accumulated += ((e as any).patientIds?.length || 0);
                        data.push({ x: e.simSeconds, y: accumulated });
                      });
                      if (state) data.push({ x: state.simSeconds, y: accumulated });
                      
                      return (
                        <div style={{ width: '100%', flex: 1, minHeight: '220px' }}>
                          <SvgStepChart 
                            data={data} 
                            maxX={Math.max(300, state?.simSeconds || 0)} 
                            maxY={Math.max(10, dashboard.kpis.totalPatients)} 
                            color="var(--success)"
                          />
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* 5. Ambulance cards row */}
        {dashboard && (
          <div className="ambulance-grid">
            {dashboard.ambulances.map(a => {
              const stateStatus = a.statusSentence.startsWith('stuck') ? 'stuck' : a.statusSentence === 'idle' ? 'idle' : 'active';
              return (
                <div key={a.id} className="card ambulance-card" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', background: 'var(--bg-card)' }}>
                  {/* Line 1: icon + label + status chip right-aligned */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink: 0, color: stateStatus === 'stuck' ? 'var(--error)' : stateStatus === 'idle' ? 'var(--text-muted)' : 'var(--primary)'}}>
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>{a.label}</strong>
                    <span style={{ 
                      marginLeft: 'auto', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', textTransform: 'uppercase', flexShrink: 0, fontWeight: 600,
                      color: stateStatus === 'stuck' ? 'var(--error)' : stateStatus === 'idle' ? 'var(--text-muted)' : 'var(--primary)'
                    }}>
                      {stateStatus}
                    </span>
                  </div>
                  
                  {/* Line 2: ONE line with ellipsis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ flexShrink: 0 }}>Load {a.onboard}/{a.capacity}</span>
                    <div style={{ width: '36px', flexShrink: 0, background: 'var(--bg-input)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(a.onboard / a.capacity) * 100}%`, background: 'var(--primary)' }} />
                    </div>
                    <span style={{ flexShrink: 0 }}>· Trips {a.tripsCompleted}</span>
                    {a.destinationName && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>· {a.destinationName}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Legend and Summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', background: 'white', border: '2px solid #16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '9px', fontWeight: 'bold' }}>H</div> Scenario hospital</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', background: '#ef4444', border: '1px solid white', borderRadius: '50%' }}></div> Incident</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '8px', background: 'white', border: '1px solid black', borderRadius: '2px' }}></div> Ambulance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '3px', background: '#dc2626', borderTop: '1px dashed white' }}></div> Blocked road</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '3px', background: '#d97706' }}></div> Partial road</div>
        </div>

        {liveView.status === 'resolved' && (
          <div className="alert alert-success" style={{ marginTop: '1rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.1)' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Simulation Complete</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li><strong>{liveView.deliveredCount}</strong> patients delivered in <strong>{time(liveView.simSeconds)}</strong>.</li>
                <li><strong>{liveView.underResourcedCount}</strong> patients arrived at a hospital short of required resources.</li>
                <li><strong>{liveView.ambulances.reduce((acc, a) => acc + a.trips, 0)}</strong> completed trips across the fleet.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

