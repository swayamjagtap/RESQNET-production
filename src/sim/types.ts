/**
 * src/sim/types.ts
 * Type definitions for RESQNET simulation road graph, pathfinding core,
 * and headless simulation engine.
 * Pure TypeScript — no React or DOM dependencies.
 */

/* ────────────────────────────── Road Graph Types ────────────────────────────── */

/** Blockage levels for road edges: 0 = Clear (1x), 1 = Partial (3x), 2 = Blocked (Infinity) */
export type BlockageLevel = 0 | 1 | 2;

export interface RoadNode {
  id: string;
  lat: number;
  lng: number;
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  lengthMetres: number;
  geometry: [number, number][]; // Array of [lat, lng] points
  name?: string;
  highway?: string;
  blockage?: BlockageLevel;
}

export interface RoadGraphMetadata {
  source: string;
  query: string;
  fetchedAt: string;
  boundingBox: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  };
  nodeCount: number;
  edgeCount: number;
  units: {
    distance: string;
    coordinates: string;
  };
  notes: string;
  simplifiedPolyline?: boolean;
}

export interface RoadGraphData {
  metadata: RoadGraphMetadata;
  nodes: Record<string, RoadNode>;
  edges: RoadEdge[];
}

export interface MidEdgePosition {
  edgeId?: string;
  from: string;
  to: string;
  progress: number; // 0..1 fraction traversed from `from` towards `to`
  traversalPenalty?: number; // Entry penalty multiplier for the edge being completed
}

export interface SnapResult {
  nodeId: string;
  distanceMetres: number;
  warning?: boolean;
}

export interface AStarResult {
  path: string[]; // List of node IDs from origin to destination
  points: [number, number][]; // Lat/lng coordinates along the resulting path
  edgeIds: string[]; // Edge IDs along the path
  totalCost: number; // Total path cost in metres (including blockage multipliers)
  remainingEdgeCost?: number;
}

/* ──────────────────────────── Injury & Resource Types ───────────────────────── */

/**
 * Injury types matching the old simulator's core.js NEEDS mapping (core.js lines 6–8).
 * Priority order from core.js PRIORITY (line ~107):
 *   unconscious=0, limb_loss=1, blood_loss=1, fracture=2
 */
export type InjuryType = 'fracture' | 'blood_loss' | 'unconscious' | 'limb_loss';

/**
 * Hospital resource keys matching core.js emptyResources() (line ~10):
 *   {icu, blood, vent, beds}
 */
export type ResourceKey = 'icu' | 'blood' | 'vent' | 'beds';

/* ──────────────────────────── Snap Info ─────────────────────────────────────── */

export interface SnapInfo {
  nodeId: string;
  distanceMetres: number;
  warning: boolean; // true when snap distance > 300 m
}

/* ──────────────────────────── SimInput (frozen snapshot) ────────────────────── */

export interface SimHospitalInput {
  id: string;
  name: string;
  graphNodeId: string;
  snap: SnapInfo;
  stock: Readonly<Record<ResourceKey, number>>;
}

export interface SimAmbulanceInput {
  id: string;
  label: string;
  graphNodeId: string;
  snap: SnapInfo;
  capacity: number;
}

export interface SimVictimGroupInput {
  id: string;
  sequence: number;
  type: InjuryType;
  count: number;
  patientIds: string[];
}

export interface SimInput {
  scenarioId: string;
  scenarioTitle: string;
  incidentNodeId: string;
  incidentSnap: SnapInfo;
  hospitals: readonly SimHospitalInput[];
  ambulances: readonly SimAmbulanceInput[];
  victimGroups: readonly SimVictimGroupInput[];
  totalPatients: number;
}

/* ──────────────────────────── Mutable Run State ────────────────────────────── */

export type GroupStatus = 'waiting' | 'reserved' | 'loaded' | 'delivered';

export type AmbulanceStatus =
  | 'idle'
  | 'to_incident'
  | 'loading'
  | 'to_hospital'
  | 'delivering'
  | 'stuck'
  | 'hospital_select';

export interface VictimGroup {
  id: string;
  sequence: number;
  type: InjuryType;
  count: number;
  patientIds: string[];
  status: GroupStatus;
  assignedAmbulanceId: string | null;
  deliveredHospitalId: string | null;
  underResourced: boolean;
}

export interface HospitalReservation {
  hospitalId: string;
  amounts: Record<ResourceKey, number>;
  underResourced: boolean;
}

export interface SimAmbulance {
  id: string;
  label: string;
  homeNode: string;
  capacity: number;
  status: AmbulanceStatus;
  claimedGroups: VictimGroup[];
  cargo: VictimGroup[];
  currentNode: string;
  currentPath: string[];
  pathProgress: number;
  currentEdgeProgress?: {
    from: string;
    to: string;
    distanceTravelledOnEdge: number;
    edgeLength: number;
  } | null;
  destination: string | null;
  stuckReason: string | null;
  hospitalReservation: HospitalReservation | null;
  trips: number;
  resumeStatus: AmbulanceStatus | null;
  stuckRoadSignature: string | null;
}

export interface SimHospital {
  id: string;
  name: string;
  node: string;
  stock: Record<ResourceKey, number>;
  reserved: Record<ResourceKey, number>;
}

/* ──────────────────────────── Events ────────────────────────────────────────── */

export type SimEventKind =
  | 'start'
  | 'dispatch'
  | 'hospital_select'
  | 'arrival'
  | 'pickup'
  | 'delivery'
  | 'reroute'
  | 'stuck'
  | 'road_change'
  | 'snapshot'
  | 'resolved';

export interface SimEvent {
  id: number;
  tick: number;
  simSeconds: number;
  kind: SimEventKind;
  text: string;
  [key: string]: unknown; // Additional details per event kind
}

/* ──────────────────────────── SimState (mutable run state) ──────────────────── */

export interface SimState {
  status: 'idle' | 'running' | 'resolved';
  tick: number;
  simSeconds: number;
  events: SimEvent[];
  deliveredCount: number;
  underResourcedCount: number;
  nextGroupId: number;
  incidentNode: string;
  victimGroups: VictimGroup[];
  ambulances: SimAmbulance[];
  hospitals: SimHospital[];
  totalPatients: number;
}
