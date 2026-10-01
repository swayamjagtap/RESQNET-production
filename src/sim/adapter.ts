/**
 * src/sim/adapter.ts
 * Converts app-layer records (Scenario, Hospital[], Ambulance[]) into a
 * deep-frozen SimInput snapshot for the headless engine, and creates fresh
 * mutable SimState instances for each run.
 *
 * Pure TypeScript — no DOM, no React.
 * Takes the loaded RoadGraph as a parameter; never imports road data statically.
 */

import { RoadGraph } from './graph';
import type { Scenario, Hospital, Ambulance } from '../lib/types';
import type {
  InjuryType,
  ResourceKey,
  SimInput,
  SimHospitalInput,
  SimAmbulanceInput,
  SimVictimGroupInput,
  SnapInfo,
  SimState,
  SimAmbulance,
  SimHospital,
  VictimGroup,
} from './types';

/* ─────────────────────── Injury/Resource Mapping ──────────────────────────── */

/**
 * Priority order copied from core.js PRIORITY (line ~107):
 *   unconscious: 0, limb_loss: 1, blood_loss: 1, fracture: 2
 * Lower number = higher priority (dispatched first).
 */
export const PRIORITY: Readonly<Record<InjuryType, number>> = {
  unconscious: 0,
  limb_loss: 1,
  blood_loss: 1,
  fracture: 2,
};

/**
 * Resource needs per injury type, copied from core.js NEEDS (lines 6–8):
 *   bloodloss  → ['blood']
 *   fracture   → ['beds']
 *   unconscious → ['icu', 'vent']
 *   limbloss   → ['icu', 'blood']
 *
 * DELIBERATE DIFFERENCE from old simulator:
 * - The old sim uses camelCase keys (bloodloss, limbloss).
 *   We use snake_case (blood_loss, limb_loss) to match the Supabase schema.
 */
export const NEEDS: Readonly<Record<InjuryType, readonly ResourceKey[]>> = {
  blood_loss: ['blood'],
  fracture: ['beds'],
  unconscious: ['icu', 'vent'],
  limb_loss: ['icu', 'blood'],
};

/**
 * All injury types in priority order (stable sort key).
 */
export const INJURY_TYPES_BY_PRIORITY: readonly InjuryType[] = [
  'unconscious',
  'limb_loss',
  'blood_loss',
  'fracture',
];

/* ─────────────────────── Helper: empty resource record ────────────────────── */

export function emptyResources(): Record<ResourceKey, number> {
  return { icu: 0, blood: 0, vent: 0, beds: 0 };
}

/* ─────────────────────── buildSimInput ─────────────────────────────────────── */

function makeSnap(graph: RoadGraph, lat: number, lng: number): SnapInfo {
  const snap = graph.snapToNearestNode(lat, lng);
  return {
    nodeId: snap.nodeId,
    distanceMetres: snap.distanceMetres,
    warning: snap.warning ?? false,
  };
}

/**
 * Build a deep-frozen SimInput snapshot from app-layer records.
 * Snaps the incident, every hospital, and every ambulance base to the nearest
 * graph node. Casualty counts become synthetic patient groups by injury type.
 */
export function buildSimInput(
  scenario: Scenario,
  hospitals: Hospital[],
  ambulances: Ambulance[],
  graph: RoadGraph,
  policy: 'resource_aware' | 'baseline_nearest_fcfs' = 'resource_aware'
): SimInput {
  if (scenario.incident_lat == null || scenario.incident_lng == null) {
    throw new Error('Scenario must have incident coordinates set.');
  }

  const incidentSnap = makeSnap(graph, scenario.incident_lat, scenario.incident_lng);

  const simHospitals: SimHospitalInput[] = hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    graphNodeId: makeSnap(graph, h.lat, h.lng).nodeId,
    snap: makeSnap(graph, h.lat, h.lng),
    stock: Object.freeze({
      icu: h.icu_beds,
      blood: h.blood_units,
      vent: h.ventilators,
      beds: h.general_beds,
    }),
  }));

  const simAmbulances: SimAmbulanceInput[] = ambulances
    .filter((a) => a.available)
    .map((a) => ({
      id: a.id,
      label: a.label,
      graphNodeId: makeSnap(graph, a.base_lat, a.base_lng).nodeId,
      snap: makeSnap(graph, a.base_lat, a.base_lng),
      capacity: a.capacity,
    }));

  // Build patient groups from casualty counts, one group per injury type.
  // Patient IDs are synthetic stable strings: P01, P02, ... (matches core.js line ~23).
  let patientCounter = 1;
  const victimGroups: SimVictimGroupInput[] = [];
  let groupSeq = 0;

  const injuryEntries: [InjuryType, number][] = [
    ['fracture', scenario.fracture],
    ['blood_loss', scenario.blood_loss],
    ['unconscious', scenario.unconscious],
    ['limb_loss', scenario.limb_loss],
  ];

  for (const [type, count] of injuryEntries) {
    if (count > 0) {
      const patientIds: string[] = [];
      for (let i = 0; i < count; i++) {
        patientIds.push(`P${String(patientCounter++).padStart(2, '0')}`);
      }
      victimGroups.push({
        id: `G${groupSeq + 1}`,
        sequence: groupSeq,
        type,
        count,
        patientIds,
      });
      groupSeq++;
    }
  }

  const totalPatients = victimGroups.reduce((sum, g) => sum + g.count, 0);

  const input: SimInput = {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    policy,
    incidentNodeId: incidentSnap.nodeId,
    incidentSnap,
    hospitals: Object.freeze(simHospitals),
    ambulances: Object.freeze(simAmbulances),
    victimGroups: Object.freeze(victimGroups),
    totalPatients,
  };

  return Object.freeze(input);
}

/* ─────────────────────── createRun ─────────────────────────────────────────── */

/**
 * Build a fresh mutable SimState from a frozen SimInput snapshot.
 * Each call yields an independent run — reset never reuses depleted stock.
 * Matches core.js createState() (lines ~15–30).
 */
export function createRun(input: SimInput): SimState {
  const victimGroups: VictimGroup[] = input.victimGroups.map((g) => ({
    id: g.id,
    sequence: g.sequence,
    type: g.type,
    count: g.count,
    patientIds: [...g.patientIds],
    status: 'waiting',
    assignedAmbulanceId: null,
    deliveredHospitalId: null,
    underResourced: false,
  }));

  const ambulances: SimAmbulance[] = input.ambulances.map((a) => ({
    id: a.id,
    label: a.label,
    homeNode: a.graphNodeId,
    capacity: a.capacity,
    status: 'idle',
    claimedGroups: [],
    cargo: [],
    currentNode: a.graphNodeId,
    currentPath: [],
    pathProgress: 0,
    destination: null,
    stuckReason: null,
    hospitalReservation: null,
    trips: 0,
    resumeStatus: null,
    stuckRoadSignature: null,
  }));

  const hospitals: SimHospital[] = input.hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    node: h.graphNodeId,
    stock: { ...h.stock },
    reserved: emptyResources(),
  }));

  return {
    status: 'idle',
    policy: input.policy || 'resource_aware',
    tick: 0,
    simSeconds: 0,
    events: [],
    deliveredCount: 0,
    underResourcedCount: 0,
    nextGroupId: victimGroups.length,
    incidentNode: input.incidentNodeId,
    victimGroups,
    ambulances,
    hospitals,
    totalPatients: input.totalPatients,
  };
}
