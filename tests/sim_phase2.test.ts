/**
 * tests/sim_phase2.test.ts
 * Vitest suite porting old Phase 2 pathfinding test requirements onto synthetic test graphs.
 * Tests path cost, partial road penalty (3x), detours around blocked edges, mid-edge starts,
 * unreachable graph splits, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { RoadGraph } from '../src/sim/graph';
import { astar } from '../src/sim/astar';
import type { RoadGraphData } from '../src/sim/types';

// Small synthetic test graph:
// N1 --- (E1, 100m) --- N2 --- (E2, 100m) --- N3
//  |                     |                     |
// (E3, 100m)           (E4, 100m)            (E5, 100m)
//  |                     |                     |
// N4 --- (E6, 100m) --- N5 --- (E7, 100m) --- N6
const syntheticData: RoadGraphData = {
  metadata: {
    source: 'Synthetic Test',
    query: 'N/A',
    fetchedAt: new Date().toISOString(),
    boundingBox: { swLat: 0, swLng: 0, neLat: 1, neLng: 1 },
    nodeCount: 6,
    edgeCount: 7,
    units: { distance: 'metres', coordinates: 'deg' },
    notes: 'Synthetic grid for Vitest',
  },
  nodes: {
    N1: { id: 'N1', lat: 19.100, lng: 72.850 },
    N2: { id: 'N2', lat: 19.100, lng: 72.851 },
    N3: { id: 'N3', lat: 19.100, lng: 72.852 },
    N4: { id: 'N4', lat: 19.099, lng: 72.850 },
    N5: { id: 'N5', lat: 19.099, lng: 72.851 },
    N6: { id: 'N6', lat: 19.099, lng: 72.852 },
  },
  edges: [
    { id: 'E1', from: 'N1', to: 'N2', lengthMetres: 100, geometry: [[19.100, 72.850], [19.100, 72.851]] },
    { id: 'E2', from: 'N2', to: 'N3', lengthMetres: 100, geometry: [[19.100, 72.851], [19.100, 72.852]] },
    { id: 'E3', from: 'N1', to: 'N4', lengthMetres: 100, geometry: [[19.100, 72.850], [19.099, 72.850]] },
    { id: 'E4', from: 'N2', to: 'N5', lengthMetres: 100, geometry: [[19.100, 72.851], [19.099, 72.851]] },
    { id: 'E5', from: 'N3', to: 'N6', lengthMetres: 100, geometry: [[19.100, 72.852], [19.099, 72.852]] },
    { id: 'E6', from: 'N4', to: 'N5', lengthMetres: 100, geometry: [[19.099, 72.850], [19.099, 72.851]] },
    { id: 'E7', from: 'N5', to: 'N6', lengthMetres: 100, geometry: [[19.099, 72.851], [19.099, 72.852]] },
  ],
};

describe('A* Simulation Core - Synthetic Phase 2 Tests', () => {
  it('computes shortest path and exact cost on clear graph', () => {
    const graph = new RoadGraph(syntheticData);
    const result = astar(graph, 'N1', 'N3');

    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['N1', 'N2', 'N3']);
    expect(result!.totalCost).toBe(200);
    expect(result!.edgeIds).toEqual(['E1', 'E2']);
  });

  it('applies 3x cost multiplier on partial road (blockage=1)', () => {
    const graph = new RoadGraph(syntheticData);
    graph.setBlockage('E1', 1); // Cost of E1 becomes 300m

    // Direct path N1->N2->N3 cost = 300 + 100 = 400
    // Detour path N1->N4->N5->N2->N3 cost = 100 + 100 + 100 + 100 = 400
    // Detour path N1->N4->N5->N6->N3 cost = 100 + 100 + 100 + 100 = 400
    const result = astar(graph, 'N1', 'N3');
    expect(result).not.toBeNull();
    expect(result!.totalCost).toBe(400);
  });

  it('detours around a blocked edge (blockage=2)', () => {
    const graph = new RoadGraph(syntheticData);
    graph.setBlockage('E1', 2); // Fully blocked

    const result = astar(graph, 'N1', 'N3');
    expect(result).not.toBeNull();
    expect(result!.edgeIds).not.toContain('E1');
    expect(result!.totalCost).toBe(400);
  });

  it('handles mid-edge start positions correctly', () => {
    const graph = new RoadGraph(syntheticData);

    // Halfway along E1 (from N1 to N2, progress 0.5)
    const result = astar(
      graph,
      { edgeId: 'E1', from: 'N1', to: 'N2', progress: 0.5 },
      'N3'
    );

    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['N1', 'N2', 'N3']);
    // Remaining on E1 is 50m, then E2 is 100m -> total 150m
    expect(result!.totalCost).toBe(150);
    expect(result!.remainingEdgeCost).toBe(50);
  });

  it('preserves entry traversal penalty on mid-edge start even if newly blocked', () => {
    const graph = new RoadGraph(syntheticData);
    graph.setBlockage('E1', 2); // E1 gets blocked while vehicle is on it

    // Vehicle mid-edge on E1 with initial penalty = 1
    const result = astar(
      graph,
      { edgeId: 'E1', from: 'N1', to: 'N2', progress: 0.4, traversalPenalty: 1 },
      'N3'
    );

    // Vehicle completes current edge E1 (60m remaining), then proceeds to N3 (100m)
    expect(result).not.toBeNull();
    expect(result!.totalCost).toBe(160);
  });

  it('returns null when destination is completely unreachable', () => {
    const graph = new RoadGraph(syntheticData);
    // Block all edges leading to N3: E2 and E5
    graph.setBlockage('E2', 2);
    graph.setBlockage('E5', 2);

    const result = astar(graph, 'N1', 'N3');
    expect(result).toBeNull();
  });

  it('handles same node start and destination', () => {
    const graph = new RoadGraph(syntheticData);
    const result = astar(graph, 'N1', 'N1');

    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['N1']);
    expect(result!.totalCost).toBe(0);
  });

  it('throws error on unknown start or destination node', () => {
    const graph = new RoadGraph(syntheticData);
    expect(() => astar(graph, 'UNKNOWN_START', 'N3')).toThrow();
    expect(() => astar(graph, 'N1', 'UNKNOWN_DEST')).toThrow();
  });
});
