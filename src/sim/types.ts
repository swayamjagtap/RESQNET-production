/**
 * src/sim/types.ts
 * Type definitions for RESQNET simulation road graph and pathfinding core.
 * Pure TypeScript — no React or DOM dependencies.
 */

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
