/**
 * tests/real_graph.test.ts
 * Vitest suite verifying the real Vile Parle OpenStreetMap RoadGraph dataset.
 * Checks connectivity, edge integrity, spatial snapping, pathfinding across town,
 * and blockage isolation.
 */

import { describe, it, expect } from 'vitest';
import { RoadGraph } from '../src/sim/graph';
import { astar } from '../src/sim/astar';

describe('Vile Parle Real Road Graph Dataset', () => {
  const graph = new RoadGraph();

  it('loads graph dataset with valid metadata', () => {
    expect(graph.metadata).toBeDefined();
    expect(graph.metadata.source).toContain('OpenStreetMap contributors');
    expect(graph.metadata.nodeCount).toBeGreaterThan(1000);
    expect(graph.metadata.edgeCount).toBeGreaterThan(1000);
  });

  it('has no zero-length or negative-length edges', () => {
    for (const edge of graph.edges) {
      expect(edge.lengthMetres).toBeGreaterThan(0);
      expect(edge.geometry.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('contains no duplicate edge pair IDs or inverse duplicates', () => {
    const edgePairs = new Set<string>();
    for (const edge of graph.edges) {
      const pairKey =
        edge.from < edge.to
          ? `${edge.from}_${edge.to}`
          : `${edge.to}_${edge.from}`;
      expect(edgePairs.has(pairKey)).toBe(false);
      edgePairs.add(pairKey);
    }
  });

  it('snaps Vile Parle center coordinate (19.105, 72.850) cleanly to a node', () => {
    const snap = graph.snapToNearestNode(19.105, 72.85);

    expect(snap.nodeId).toBeDefined();
    expect(graph.nodes[snap.nodeId]).toBeDefined();
    expect(snap.distanceMetres).toBeLessThan(300);
    expect(snap.warning).toBe(false);
  });

  it('warns when snapping a coordinate far outside the viewing box', () => {
    // Coordinate far outside Mumbai
    const snap = graph.snapToNearestNode(0, 0);
    expect(snap.warning).toBe(true);
    expect(snap.distanceMetres).toBeGreaterThan(300);
  });

  it('finds a valid A* route between far-apart points in Vile Parle', () => {
    // Snap SW point (~19.090, 72.830) and NE point (~19.120, 72.870)
    const swSnap = graph.snapToNearestNode(19.09, 72.83);
    const neSnap = graph.snapToNearestNode(19.12, 72.87);

    const result = astar(graph, swSnap.nodeId, neSnap.nodeId);

    expect(result).not.toBeNull();
    expect(result!.path.length).toBeGreaterThan(2);
    expect(result!.totalCost).toBeGreaterThan(1000); // > 1 km
    expect(result!.points.length).toBeGreaterThan(2);
  });

  it('returns null (no route) when all outgoing edges of a node are blocked', () => {
    // Pick a test node with neighbors
    const testNodeId = Object.keys(graph.nodes)[0];
    const neighbors = graph.getNeighbors(testNodeId);

    expect(neighbors.length).toBeGreaterThan(0);

    // Block all outgoing edges from testNodeId
    for (const n of neighbors) {
      graph.setBlockage(n.edgeId, 2);
    }

    // Pick a target node different from testNodeId
    const targetNodeId = Object.keys(graph.nodes)[10];
    const result = astar(graph, testNodeId, targetNodeId);

    expect(result).toBeNull();

    // Clean up blockage resets for other tests
    for (const n of neighbors) {
      graph.setBlockage(n.edgeId, 0);
    }
  });

  it('is fully connected in its largest connected component', () => {
    const sampleStart = Object.keys(graph.nodes)[0];
    const sampleEnd = Object.keys(graph.nodes)[500];

    const result = astar(graph, sampleStart, sampleEnd);
    expect(result).not.toBeNull();
  });
});
