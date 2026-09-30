#!/usr/bin/env npx tsx
/**
 * scripts/headless-run.mjs
 * Run with: npx tsx scripts/headless-run.mjs
 *
 * Prints a short summary of one real-graph simulation run:
 * - Delivered / total patients
 * - Under-resourced count
 * - Simulated elapsed time
 * - Number of reroutes
 * - Hospital snap distances
 */

import { RoadGraph } from '../src/sim/graph.ts';
import { SimEngine } from '../src/sim/engine.ts';
import { buildSimInput, createRun } from '../src/sim/adapter.ts';
import roadData from '../src/data/vileparle-roads.json' with { type: 'json' };

const scenario = {
  id: 'headless-run',
  owner_id: 'script',
  title: 'Headless Run',
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

const hospitals = [
  { id: 'H1', scenario_id: 'headless-run', name: 'North Hospital', lat: 19.115, lng: 72.840, icu_beds: 3, blood_units: 2, ventilators: 2, general_beds: 3, created_at: '2026-01-01' },
  { id: 'H2', scenario_id: 'headless-run', name: 'East Hospital', lat: 19.105, lng: 72.865, icu_beds: 1, blood_units: 2, ventilators: 1, general_beds: 4, created_at: '2026-01-01' },
  { id: 'H3', scenario_id: 'headless-run', name: 'South Hospital', lat: 19.090, lng: 72.845, icu_beds: 0, blood_units: 3, ventilators: 0, general_beds: 2, created_at: '2026-01-01' },
  { id: 'H4', scenario_id: 'headless-run', name: 'West Hospital', lat: 19.095, lng: 72.830, icu_beds: 2, blood_units: 1, ventilators: 1, general_beds: 2, created_at: '2026-01-01' },
];

const ambulances = [
  { id: 'A1', scenario_id: 'headless-run', label: 'Amb 1', base_lat: 19.115, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A2', scenario_id: 'headless-run', label: 'Amb 2', base_lat: 19.105, base_lng: 72.865, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A3', scenario_id: 'headless-run', label: 'Amb 3', base_lat: 19.090, base_lng: 72.845, capacity: 2, available: true, created_at: '2026-01-01' },
  { id: 'A4', scenario_id: 'headless-run', label: 'Amb 4', base_lat: 19.095, base_lng: 72.830, capacity: 2, available: true, created_at: '2026-01-01' },
];

const graph = new RoadGraph(roadData);
const input = buildSimInput(scenario, hospitals, ambulances, graph);
const state = createRun(input);
const engine = new SimEngine(state, graph);
engine.runToCompletion();

const reroutes = state.events.filter(e => e.kind === 'reroute').length;

console.log('═══════════════════════════════════════════════');
console.log('  RESQNET Headless Simulation Run Summary');
console.log('═══════════════════════════════════════════════');
console.log(`  Status:             ${state.status}`);
console.log(`  Delivered:          ${state.deliveredCount} / ${state.totalPatients}`);
console.log(`  Under-resourced:    ${state.underResourcedCount}`);
console.log(`  Simulated time:     ${state.simSeconds}s`);
console.log(`  Ticks:              ${state.tick}`);
console.log(`  Total events:       ${state.events.length}`);
console.log(`  Reroutes:           ${reroutes}`);
console.log('');
console.log('  Hospital snap distances:');
for (const h of input.hospitals) {
  console.log(`    ${h.id} (${h.name}): ${h.snap.distanceMetres}m → node ${h.snap.nodeId}${h.snap.warning ? ' ⚠️ >300m' : ''}`);
}
console.log('');
console.log('  Incident snap:');
console.log(`    ${input.incidentSnap.distanceMetres}m → node ${input.incidentSnap.nodeId}${input.incidentSnap.warning ? ' ⚠️ >300m' : ''}`);
console.log('═══════════════════════════════════════════════');
