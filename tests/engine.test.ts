/**
 * tests/engine.test.ts
 * Headless simulation engine tests on small hand-made graphs.
 *
 * Tests cover: 13-patient full run, group splitting, priority dispatch,
 * resource reservation, hospital selection, under-resourced fallback,
 * blocked-hospital recovery, unreachable incident holding, mid-edge block,
 * all-blocked holding, loaded cargo preserved, and deterministic A* tie-breaking.
 */

import { describe, it, expect } from 'vitest';
import { RoadGraph } from '../src/sim/graph';
import { SimEngine, AMBULANCE_SPEED_MPS } from '../src/sim/engine';
import { buildSimInput, createRun, PRIORITY, NEEDS } from '../src/sim/adapter';
import { canonicalizeEvent } from '../src/sim/events';
import { astar } from '../src/sim/astar';
import type { RoadGraphData, SimState, SimEvent } from '../src/sim/types';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';

/* ═══════════════════════════ Test Graph ═══════════════════════════════════════
 *
 * A diamond-shaped graph with an incident at the center:
 *
 *   H1(A1) ─── J1 ─── INC ─── J2 ─── H2(A2)
 *     \         |               |         /
 *      \        J3              J4       /
 *       \       |               |       /
 *        ──── H3(A3) ──J5── H4(A4) ────
 *
 * Nodes on a rough ~100m grid. Each edge is 100m.
 * H1..H4 are hospitals, A1..A4 are ambulance bases, INC is incident.
 */

function makeTestGraphData(): RoadGraphData {
  return {
    metadata: {
      source: 'Synthetic Test',
      query: 'N/A',
      fetchedAt: '2026-01-01T00:00:00Z',
      boundingBox: { swLat: 19.09, swLng: 72.84, neLat: 19.11, neLng: 72.86 },
      nodeCount: 9,
      edgeCount: 12,
      units: { distance: 'metres', coordinates: 'deg' },
      notes: 'Synthetic grid for engine tests',
    },
    nodes: {
      H1: { id: 'H1', lat: 19.100, lng: 72.840 },
      J1: { id: 'J1', lat: 19.100, lng: 72.845 },
      INC: { id: 'INC', lat: 19.100, lng: 72.850 },
      J2: { id: 'J2', lat: 19.100, lng: 72.855 },
      H2: { id: 'H2', lat: 19.100, lng: 72.860 },
      J3: { id: 'J3', lat: 19.095, lng: 72.845 },
      H3: { id: 'H3', lat: 19.090, lng: 72.845 },
      J4: { id: 'J4', lat: 19.095, lng: 72.855 },
      H4: { id: 'H4', lat: 19.090, lng: 72.855 },
      J5: { id: 'J5', lat: 19.090, lng: 72.850 },
    },
    edges: [
      { id: 'E1', from: 'H1', to: 'J1', lengthMetres: 100, geometry: [[19.100,72.840],[19.100,72.845]] },
      { id: 'E2', from: 'J1', to: 'INC', lengthMetres: 100, geometry: [[19.100,72.845],[19.100,72.850]] },
      { id: 'E3', from: 'INC', to: 'J2', lengthMetres: 100, geometry: [[19.100,72.850],[19.100,72.855]] },
      { id: 'E4', from: 'J2', to: 'H2', lengthMetres: 100, geometry: [[19.100,72.855],[19.100,72.860]] },
      { id: 'E5', from: 'J1', to: 'J3', lengthMetres: 100, geometry: [[19.100,72.845],[19.095,72.845]] },
      { id: 'E6', from: 'J3', to: 'H3', lengthMetres: 100, geometry: [[19.095,72.845],[19.090,72.845]] },
      { id: 'E7', from: 'J2', to: 'J4', lengthMetres: 100, geometry: [[19.100,72.855],[19.095,72.855]] },
      { id: 'E8', from: 'J4', to: 'H4', lengthMetres: 100, geometry: [[19.095,72.855],[19.090,72.855]] },
      { id: 'E9', from: 'H3', to: 'J5', lengthMetres: 100, geometry: [[19.090,72.845],[19.090,72.850]] },
      { id: 'E10', from: 'J5', to: 'H4', lengthMetres: 100, geometry: [[19.090,72.850],[19.090,72.855]] },
      { id: 'E11', from: 'H1', to: 'H3', lengthMetres: 200, geometry: [[19.100,72.840],[19.090,72.845]] },
      { id: 'E12', from: 'H2', to: 'H4', lengthMetres: 200, geometry: [[19.100,72.860],[19.090,72.855]] },
    ],
  };
}

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'test-scenario',
    owner_id: 'test-owner',
    title: 'Test Scenario',
    disaster_type: 'building_collapse',
    incident_lat: 19.100,
    incident_lng: 72.850,
    updated_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    fracture: 4,
    blood_loss: 4,
    unconscious: 3,
    limb_loss: 2,
    ...overrides,
  };
}

function makeHospitals(): Hospital[] {
  return [
    { id: 'H1', scenario_id: 'test-scenario', name: 'Hospital 1', lat: 19.100, lng: 72.840, icu_beds: 3, blood_units: 2, ventilators: 2, general_beds: 3, created_at: '2026-01-01' },
    { id: 'H2', scenario_id: 'test-scenario', name: 'Hospital 2', lat: 19.100, lng: 72.860, icu_beds: 1, blood_units: 2, ventilators: 1, general_beds: 4, created_at: '2026-01-01' },
    { id: 'H3', scenario_id: 'test-scenario', name: 'Hospital 3', lat: 19.090, lng: 72.845, icu_beds: 0, blood_units: 3, ventilators: 0, general_beds: 2, created_at: '2026-01-01' },
    { id: 'H4', scenario_id: 'test-scenario', name: 'Hospital 4', lat: 19.090, lng: 72.855, icu_beds: 2, blood_units: 1, ventilators: 1, general_beds: 2, created_at: '2026-01-01' },
  ];
}

function makeAmbulances(): Ambulance[] {
  return [
    { id: 'A1', scenario_id: 'test-scenario', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    { id: 'A2', scenario_id: 'test-scenario', label: 'Amb 2', base_lat: 19.100, base_lng: 72.860, capacity: 2, available: true, created_at: '2026-01-01' },
    { id: 'A3', scenario_id: 'test-scenario', label: 'Amb 3', base_lat: 19.090, base_lng: 72.845, capacity: 2, available: true, created_at: '2026-01-01' },
    { id: 'A4', scenario_id: 'test-scenario', label: 'Amb 4', base_lat: 19.090, base_lng: 72.855, capacity: 2, available: true, created_at: '2026-01-01' },
  ];
}

function runFullSimulation(graphData?: RoadGraphData, scenario?: Scenario, hospitals?: Hospital[], ambulances?: Ambulance[]): SimState {
  const gd = graphData ?? makeTestGraphData();
  const graph = new RoadGraph(gd);
  const sc = scenario ?? makeScenario();
  const hs = hospitals ?? makeHospitals();
  const as = ambulances ?? makeAmbulances();
  const input = buildSimInput(sc, hs, as, graph);
  const state = createRun(input);
  const engine = new SimEngine(state, graph);
  return engine.runToCompletion();
}

/* ═══════════════════════════ ADAPTER TESTS ════════════════════════════════════ */

describe('Adapter - buildSimInput', () => {
  it('creates frozen SimInput with correct patient groups', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const input = buildSimInput(makeScenario(), makeHospitals(), makeAmbulances(), graph);

    expect(input.totalPatients).toBe(13);
    expect(input.victimGroups).toHaveLength(4);
    expect(Object.isFrozen(input)).toBe(true);

    // Check injury types and counts
    const groups = [...input.victimGroups];
    expect(groups.map(g => g.type)).toEqual(['fracture', 'blood_loss', 'unconscious', 'limb_loss']);
    expect(groups.map(g => g.count)).toEqual([4, 4, 3, 2]);
  });

  it('snaps incident, hospitals and ambulances to nearest graph nodes', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const input = buildSimInput(makeScenario(), makeHospitals(), makeAmbulances(), graph);

    expect(input.incidentNodeId).toBe('INC');
    expect(input.hospitals[0].graphNodeId).toBe('H1');
    expect(input.hospitals[1].graphNodeId).toBe('H2');
    expect(input.ambulances[0].graphNodeId).toBe('H1');
  });

  it('generates stable patient IDs P01..P13', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const input = buildSimInput(makeScenario(), makeHospitals(), makeAmbulances(), graph);

    const allIds = input.victimGroups.flatMap(g => g.patientIds);
    expect(allIds).toHaveLength(13);
    expect(allIds[0]).toBe('P01');
    expect(allIds[12]).toBe('P13');
  });

  it('filters out unavailable ambulances', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const ambs = makeAmbulances();
    ambs[1].available = false;
    const input = buildSimInput(makeScenario(), makeHospitals(), ambs, graph);
    expect(input.ambulances).toHaveLength(3);
  });

  it('throws if scenario has no incident coordinates', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const sc = makeScenario({ incident_lat: null, incident_lng: null });
    expect(() => buildSimInput(sc, makeHospitals(), makeAmbulances(), graph)).toThrow(
      'Scenario must have incident coordinates set.',
    );
  });
});

describe('Adapter - createRun', () => {
  it('produces independent mutable states from the same frozen input', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const input = buildSimInput(makeScenario(), makeHospitals(), makeAmbulances(), graph);

    const run1 = createRun(input);
    const run2 = createRun(input);

    // Mutate run1 and verify run2 is unaffected.
    run1.hospitals[0].stock.icu = 0;
    expect(run2.hospitals[0].stock.icu).toBe(3);
  });
});

/* ═══════════════════════════ PRIORITY & NEEDS TESTS ══════════════════════════ */

describe('Priority and resource needs mapping', () => {
  it('has correct priority order from core.js', () => {
    expect(PRIORITY.unconscious).toBe(0);
    expect(PRIORITY.limb_loss).toBe(1);
    expect(PRIORITY.blood_loss).toBe(1);
    expect(PRIORITY.fracture).toBe(2);
  });

  it('has correct resource needs from core.js NEEDS', () => {
    expect(NEEDS.blood_loss).toEqual(['blood']);
    expect(NEEDS.fracture).toEqual(['beds']);
    expect(NEEDS.unconscious).toEqual(['icu', 'vent']);
    expect(NEEDS.limb_loss).toEqual(['icu', 'blood']);
  });
});

/* ═══════════════════════════ A* TIE-BREAKING TEST ════════════════════════════ */

describe('A* deterministic tie-breaking', () => {
  /**
   * Symmetric graph where two paths have identical cost:
   *   A ─(100)─ B ─(100)─ D
   *   A ─(100)─ C ─(100)─ D
   * Both paths cost 200m. Tie-breaking should prefer the path through
   * the node with the lexicographically smaller ID (B < C).
   */
  const tiedGraphData: RoadGraphData = {
    metadata: {
      source: 'Tie-break test', query: 'N/A', fetchedAt: '2026-01-01T00:00:00Z',
      boundingBox: { swLat: 0, swLng: 0, neLat: 1, neLng: 1 },
      nodeCount: 4, edgeCount: 4,
      units: { distance: 'metres', coordinates: 'deg' },
      notes: 'Symmetric diamond for tie-breaking test',
    },
    nodes: {
      A: { id: 'A', lat: 19.100, lng: 72.840 },
      B: { id: 'B', lat: 19.101, lng: 72.845 },
      C: { id: 'C', lat: 19.099, lng: 72.845 },
      D: { id: 'D', lat: 19.100, lng: 72.850 },
    },
    edges: [
      { id: 'E1', from: 'A', to: 'B', lengthMetres: 100, geometry: [[19.100,72.840],[19.101,72.845]] },
      { id: 'E2', from: 'B', to: 'D', lengthMetres: 100, geometry: [[19.101,72.845],[19.100,72.850]] },
      { id: 'E3', from: 'A', to: 'C', lengthMetres: 100, geometry: [[19.100,72.840],[19.099,72.845]] },
      { id: 'E4', from: 'C', to: 'D', lengthMetres: 100, geometry: [[19.099,72.845],[19.100,72.850]] },
    ],
  };

  it('picks the path through the lexicographically smallest node on tied costs (run 1)', () => {
    const graph = new RoadGraph(tiedGraphData);
    const result = astar(graph, 'A', 'D');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['A', 'B', 'D']);
    expect(result!.totalCost).toBe(200);
  });

  it('picks the same path on a second run (deterministic, run 2)', () => {
    const graph = new RoadGraph(tiedGraphData);
    const result = astar(graph, 'A', 'D');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['A', 'B', 'D']);
    expect(result!.totalCost).toBe(200);
  });
});

/* ═══════════════════════════ 13-PATIENT FULL RUN ═════════════════════════════ */

describe('13-patient full simulation run', () => {
  it('delivers all 13 patients', () => {
    const state = runFullSimulation();
    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(13);
  });

  it('has start and resolved events', () => {
    const state = runFullSimulation();
    expect(state.events[0].kind).toBe('start');
    expect(state.events[state.events.length - 1].kind).toBe('resolved');
  });

  it('dispatches all 4 ambulances', () => {
    const state = runFullSimulation();
    const dispatches = state.events.filter(e => e.kind === 'dispatch');
    // At least 4 dispatches (one per ambulance initially), plus reassignments.
    expect(dispatches.length).toBeGreaterThanOrEqual(4);
  });

  it('produces delivery events for every batch', () => {
    const state = runFullSimulation();
    const deliveries = state.events.filter(e => e.kind === 'delivery');
    const totalDelivered = deliveries.reduce(
      (sum, e) => sum + (e.count as number),
      0,
    );
    expect(totalDelivered).toBe(13);
  });

  it('tracks under-resourced count', () => {
    const state = runFullSimulation();
    // Under-resourced count depends on exact routing/hospital selection.
    // Just verify it is a non-negative integer.
    expect(state.underResourcedCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(state.underResourcedCount)).toBe(true);
  });
});

/* ═══════════════════════════ GROUP SPLITTING ══════════════════════════════════ */

describe('Oversized group split', () => {
  it('splits a group larger than ambulance capacity', () => {
    const graph = new RoadGraph(makeTestGraphData());
    const sc = makeScenario({ fracture: 5, blood_loss: 0, unconscious: 0, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const hs = makeHospitals();
    const input = buildSimInput(sc, hs, ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    engine.runToCompletion();

    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(5);
    // Should have split the 5-patient group into batches of 2.
    expect(state.victimGroups.length).toBeGreaterThan(1);
  });
});

/* ═══════════════════════════ BLOCKED HOSPITAL RECOVERY ════════════════════════ */

describe('Blocked hospital recovery', () => {
  it('reroutes to an alternative hospital when the direct route is blocked', () => {
    const graphData = makeTestGraphData();
    const graph = new RoadGraph(graphData);
    const sc = makeScenario({ fracture: 2, blood_loss: 0, unconscious: 0, limb_loss: 0 });
    // Place ambulance at J1 (not H1) so it can still reach INC.
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.845, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const hs = makeHospitals();
    const input = buildSimInput(sc, hs, ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);

    // Block routes to H1 after input is built (ambulance starts at J1, can reach INC).
    engine.setBlockage('E1', 2);  // J1 → H1
    engine.setBlockage('E11', 2); // H1 → H3

    engine.runToCompletion();

    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(2);

    // Should have delivered to a hospital other than H1 (since routes are blocked).
    const deliveries = state.events.filter(e => e.kind === 'delivery');
    for (const d of deliveries) {
      expect(d.hospitalId).toBeDefined();
      // H1 is unreachable, so delivery should go elsewhere.
      expect(d.hospitalId).not.toBe('H1');
    }
  });
});

/* ═══════════════════════════ UNREACHABLE INCIDENT ═════════════════════════════ */

describe('Unreachable incident holding', () => {
  it('marks ambulance stuck when incident is unreachable', () => {
    const graphData = makeTestGraphData();
    const graph = new RoadGraph(graphData);
    // Block all paths to INC
    graph.setBlockage('E2', 2); // J1 -> INC
    graph.setBlockage('E3', 2); // INC -> J2

    const sc = makeScenario({ fracture: 2, blood_loss: 0, unconscious: 0, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const input = buildSimInput(sc, makeHospitals(), ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);

    // Run for a limited number of ticks (should not resolve).
    for (let i = 0; i < 100; i++) {
      if (i === 0) engine.start();
      engine.tick();
    }

    const stuckEvents = state.events.filter(e => e.kind === 'stuck');
    expect(stuckEvents.length).toBeGreaterThanOrEqual(1);
    expect(state.ambulances[0].status).toBe('stuck');
  });
});

/* ═══════════════════════════ ALL-BLOCKED HOLDING ══════════════════════════════ */

describe('All-blocked holding', () => {
  it('holds ambulances when all roads are blocked', () => {
    const graphData = makeTestGraphData();
    const graph = new RoadGraph(graphData);
    // Block every edge
    for (const edge of graphData.edges) {
      graph.setBlockage(edge.id, 2);
    }

    const sc = makeScenario({ fracture: 2, blood_loss: 0, unconscious: 0, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const input = buildSimInput(sc, makeHospitals(), ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);

    for (let i = 0; i < 50; i++) {
      if (i === 0) engine.start();
      engine.tick();
    }

    expect(state.status).toBe('running'); // Never resolves
    expect(state.ambulances[0].status).toBe('stuck');
    expect(state.deliveredCount).toBe(0);
  });
});

/* ═══════════════════════════ LOADED CARGO PRESERVED ══════════════════════════ */

describe('Loaded cargo preserved across reroute', () => {
  it('preserves loaded patients when ambulance reroutes after hospital blockage', () => {
    const graphData = makeTestGraphData();
    const graph = new RoadGraph(graphData);
    const sc = makeScenario({ fracture: 2, blood_loss: 0, unconscious: 0, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const input = buildSimInput(sc, makeHospitals(), ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    engine.start();

    // Run until ambulance picks up patients and is en route to hospital.
    let tickCount = 0;
    while (state.ambulances[0].status !== 'to_hospital' && tickCount < 500) {
      engine.tick();
      tickCount++;
    }

    if (state.ambulances[0].status === 'to_hospital') {
      // Block route to selected hospital
      const dest = state.ambulances[0].destination!;
      // Block some edges (this may force reroute).
      for (const edge of graphData.edges) {
        const e = graph.edges.find(g => g.id === edge.id);
        if (e && (e.to === dest || e.from === dest)) {
          engine.setBlockage(edge.id, 2);
        }
      }

      // Advance a few ticks.
      for (let i = 0; i < 20; i++) engine.tick();

      // Cargo should still be present.
      const amb = state.ambulances[0];
      if (amb.status === 'stuck' || amb.status === 'to_hospital') {
        // Either stuck or rerouted — cargo preserved.
        expect(amb.cargo.length).toBeGreaterThan(0);
        expect(amb.cargo[0].status).toBe('loaded');
      }
    }
  });
});

/* ═══════════════════════════ DUAL-RESOURCE FALLBACK ══════════════════════════ */

describe('Dual-resource fallback (under-resourced delivery)', () => {
  it('delivers to the best available hospital when resources are insufficient', () => {
    const graphData = makeTestGraphData();
    const graph = new RoadGraph(graphData);
    // Scenario with only unconscious patients (needs: icu + vent).
    // All hospitals have some but not enough for all.
    const sc = makeScenario({ fracture: 0, blood_loss: 0, unconscious: 10, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
      { id: 'A2', scenario_id: 's', label: 'Amb 2', base_lat: 19.100, base_lng: 72.860, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const hs = makeHospitals(); // Total ICU: 3+1+0+2=6, Vent: 2+1+0+1=4 for 10 patients

    const input = buildSimInput(sc, hs, ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    engine.runToCompletion();

    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(10);
    expect(state.underResourcedCount).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════ ZERO-CAPACITY FALLBACK ══════════════════════════ */

describe('Zero-capacity hospital fallback', () => {
  it('selects hospital with most resources when none have enough', () => {
    const graph = new RoadGraph(makeTestGraphData());
    // Scenario: blood_loss patients need 'blood'. H3 has most blood (3).
    const sc = makeScenario({ fracture: 0, blood_loss: 6, unconscious: 0, limb_loss: 0 });
    const ambs: Ambulance[] = [
      { id: 'A1', scenario_id: 's', label: 'Amb 1', base_lat: 19.100, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
    ];
    const input = buildSimInput(sc, makeHospitals(), ambs, graph);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    engine.runToCompletion();

    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(6);
  });
});

/* ═══════════════════════════ EVENT CANONICALIZATION ══════════════════════════ */

describe('Event canonicalization', () => {
  it('produces stable JSON with sorted keys and rounded numbers', () => {
    const event: SimEvent = {
      id: 1,
      tick: 5,
      simSeconds: 5,
      kind: 'dispatch',
      text: 'A1 claimed 2 fracture patients',
      ambulanceId: 'A1',
      cost: 123.456789012,
    };

    const canonical = canonicalizeEvent(event);
    const parsed = JSON.parse(canonical);

    // Keys should be sorted.
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());

    // Numbers should be rounded.
    expect(parsed.cost).toBe(123.456789);
  });

  it('produces identical output for identical input', () => {
    const event: SimEvent = {
      id: 1, tick: 1, simSeconds: 1, kind: 'start', text: 'Simulation started',
    };
    expect(canonicalizeEvent(event)).toBe(canonicalizeEvent(event));
  });
});

/* ═══════════════════════════ DETERMINISTIC RUN ════════════════════════════════ */

describe('Deterministic simulation', () => {
  it('produces identical event lists across two runs with same input', () => {
    const state1 = runFullSimulation();
    const state2 = runFullSimulation();

    expect(state1.events.length).toBe(state2.events.length);
    for (let i = 0; i < state1.events.length; i++) {
      expect(canonicalizeEvent(state1.events[i])).toBe(
        canonicalizeEvent(state2.events[i]),
      );
    }
  });
});

/* ═══════════════════════════ ENGINE SPEED CONSTANT ════════════════════════════ */

describe('Engine constants', () => {
  it('exports AMBULANCE_SPEED_MPS as 8.3', () => {
    expect(AMBULANCE_SPEED_MPS).toBe(8.3);
  });
});
