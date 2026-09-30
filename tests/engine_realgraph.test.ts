/**
 * tests/engine_realgraph.test.ts
 * Full simulation run on the real Vile Parle road graph.
 * Runs twice with identical input and asserts identical event lists.
 */

import { describe, it, expect } from 'vitest';
import { RoadGraph } from '../src/sim/graph';
import { SimEngine } from '../src/sim/engine';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { canonicalizeEvent } from '../src/sim/events';
import type { RoadGraphData } from '../src/sim/types';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';

// Load the real road data. Only tests import this (code-split on purpose).
import roadData from '../src/data/vileparle-roads.json';

/** Fixed scenario for reproducible runs. */
const scenario: Scenario = {
  id: 'real-graph-test',
  owner_id: 'test',
  title: 'Vile Parle Full Run',
  disaster_type: 'building_collapse',
  incident_lat: 19.0985,
  incident_lng: 72.8500,
  updated_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  fracture: 4,
  blood_loss: 4,
  unconscious: 3,
  limb_loss: 2,
};

/** Four hospitals at diverse positions within the Vile Parle road graph. */
const hospitals: Hospital[] = [
  { id: 'H1', scenario_id: 'real-graph-test', name: 'North Hospital', lat: 19.115, lng: 72.840, icu_beds: 3, blood_units: 2, ventilators: 2, general_beds: 3, created_at: '2026-01-01' },
  { id: 'H2', scenario_id: 'real-graph-test', name: 'East Hospital', lat: 19.105, lng: 72.865, icu_beds: 1, blood_units: 2, ventilators: 1, general_beds: 4, created_at: '2026-01-01' },
  { id: 'H3', scenario_id: 'real-graph-test', name: 'South Hospital', lat: 19.090, lng: 72.845, icu_beds: 0, blood_units: 3, ventilators: 0, general_beds: 2, created_at: '2026-01-01' },
  { id: 'H4', scenario_id: 'real-graph-test', name: 'West Hospital', lat: 19.095, lng: 72.830, icu_beds: 2, blood_units: 1, ventilators: 1, general_beds: 2, created_at: '2026-01-01' },
];

/** Four ambulances at diverse positions. */
const ambulances: Ambulance[] = [
  { id: 'A1', scenario_id: 'real-graph-test', label: 'Amb 1', base_lat: 19.115, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A2', scenario_id: 'real-graph-test', label: 'Amb 2', base_lat: 19.105, base_lng: 72.865, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A3', scenario_id: 'real-graph-test', label: 'Amb 3', base_lat: 19.090, base_lng: 72.845, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A4', scenario_id: 'real-graph-test', label: 'Amb 4', base_lat: 19.095, base_lng: 72.830, capacity: 2, available: true, created_at: '2026-01-01' },
];

function doRun() {
  const graph = new RoadGraph(roadData as unknown as RoadGraphData);
  const input = buildSimInput(scenario, hospitals, ambulances, graph);
  const state = createRun(input);
  const engine = new SimEngine(state, graph);
  engine.runToCompletion();
  return state;
}

describe('Real Vile Parle graph full simulation', () => {
  it('delivers all 13 patients', () => {
    const state = doRun();
    expect(state.status).toBe('resolved');
    expect(state.deliveredCount).toBe(13);
  });

  it('produces dispatch and delivery events', () => {
    const state = doRun();
    const dispatches = state.events.filter(e => e.kind === 'dispatch');
    const deliveries = state.events.filter(e => e.kind === 'delivery');
    expect(dispatches.length).toBeGreaterThanOrEqual(4);
    expect(deliveries.length).toBeGreaterThanOrEqual(1);
  });

  it('produces identical event lists on two runs (deterministic)', () => {
    const state1 = doRun();
    const state2 = doRun();

    expect(state1.events.length).toBe(state2.events.length);
    for (let i = 0; i < state1.events.length; i++) {
      expect(canonicalizeEvent(state1.events[i])).toBe(
        canonicalizeEvent(state2.events[i]),
      );
    }
  });

  it('reports hospital snap distances', () => {
    const graph = new RoadGraph(roadData as unknown as RoadGraphData);
    const input = buildSimInput(scenario, hospitals, ambulances, graph);
    for (const h of input.hospitals) {
      expect(h.snap.distanceMetres).toBeGreaterThanOrEqual(0);
      expect(typeof h.snap.warning).toBe('boolean');
    }
  });
});
