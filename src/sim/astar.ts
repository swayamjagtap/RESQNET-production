/**
 * src/sim/astar.ts
 * A* pathfinding implementation with Haversine distance heuristic,
 * blockage cost multipliers (0=1x, 1=3x, 2=Infinity/Blocked),
 * and full support for mid-edge starts ({from, to, progress, traversalPenalty}).
 *
 * Preserves the exact semantics of the old simulator's core.js A* engine.
 * Pure TypeScript — no React or DOM dependencies.
 */

import { RoadGraph, haversineMetres } from './graph';
import type { MidEdgePosition, AStarResult, BlockageLevel } from './types';

const PENALTIES: Record<BlockageLevel, number> = {
  0: 1,
  1: 3,
  2: Infinity,
};

/**
 * Perform A* pathfinding on a RoadGraph.
 *
 * @param graph RoadGraph instance
 * @param start Node ID string OR MidEdgePosition
 * @param destination Target Node ID string
 * @returns AStarResult or null if no valid path exists
 */
export function astar(
  graph: RoadGraph,
  start: string | MidEdgePosition,
  destination: string
): AStarResult | null {
  const { nodes, edges } = graph;

  if (!nodes[destination]) {
    throw new Error(`Unknown destination node: ${destination}`);
  }

  let origin: string;
  let startPos: [number, number] | null = null;
  let remainingEdgeCost = 0;
  let initialEdgeId: string | undefined = undefined;

  if (typeof start === 'string') {
    if (!nodes[start]) {
      throw new Error(`Unknown start node: ${start}`);
    }
    origin = start;
    startPos = [nodes[start].lat, nodes[start].lng];
  } else {
    const { from, to, progress, traversalPenalty = 1, edgeId } = start;
    if (!nodes[from] || !nodes[to]) {
      throw new Error(`Invalid mid-edge node reference: ${from} -> ${to}`);
    }
    if (progress < 0 || progress > 1 || !Number.isFinite(progress)) {
      throw new Error(`Invalid mid-edge progress: ${progress}`);
    }

    const matchingEdge = edges.find(
      (e) =>
        (e.id === edgeId) ||
        (e.from === from && e.to === to) ||
        (e.from === to && e.to === from)
    );

    if (!matchingEdge) {
      throw new Error(`Mid-edge position does not match any existing edge: ${from} <-> ${to}`);
    }

    initialEdgeId = matchingEdge.id;

    // Interpolate exact starting lat/lng along edge geometry if available, or direct linear
    const fromNode = nodes[from];
    const toNode = nodes[to];
    startPos = [
      fromNode.lat + (toNode.lat - fromNode.lat) * progress,
      fromNode.lng + (toNode.lng - fromNode.lng) * progress,
    ];

    if (progress === 0) {
      origin = from;
    } else if (progress === 1) {
      origin = to;
    } else {
      origin = to;
      remainingEdgeCost = matchingEdge.lengthMetres * (1 - progress) * traversalPenalty;
    }
  }

  // Handle case where start and destination are identical
  if (origin === destination && (typeof start === 'string' || start.progress === 1)) {
    return {
      path: [destination],
      points: [[nodes[destination].lat, nodes[destination].lng]],
      edgeIds: [],
      totalCost: 0,
    };
  }

  // Build adjacency lookup considering current blockage levels
  // A blocked edge (blockage = 2) has cost = Infinity and is excluded from open set exploration.
  const openSet = new Set<string>([origin]);
  const gScore = new Map<string, number>([[origin, 0]]);
  const cameFrom = new Map<string, { prevNode: string; edgeId: string }>();

  const destNode = nodes[destination];
  const heuristic = (nodeId: string): number => {
    const n = nodes[nodeId];
    return haversineMetres(n.lat, n.lng, destNode.lat, destNode.lng);
  };

  while (openSet.size > 0) {
    let current: string | null = null;
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      const g = gScore.get(nodeId)!;
      const f = g + heuristic(nodeId);
      if (f < lowestF) {
        lowestF = f;
        current = nodeId;
      }
    }

    if (current === null) break;

    if (current === destination) {
      // Reconstruct path
      const pathNodes: string[] = [current];
      const pathEdgeIds: string[] = [];

      let curr = current;
      while (cameFrom.has(curr)) {
        const step = cameFrom.get(curr)!;
        pathNodes.unshift(step.prevNode);
        pathEdgeIds.unshift(step.edgeId);
        curr = step.prevNode;
      }

      if (typeof start !== 'string' && start.progress > 0 && start.progress < 1) {
        pathNodes.unshift(start.from);
        if (initialEdgeId) {
          pathEdgeIds.unshift(initialEdgeId);
        }
      }

      // Collect lat/lng points along path
      const points: [number, number][] = [];
      if (startPos) {
        points.push(startPos);
      }
      for (const nid of pathNodes) {
        if (!startPos || points.length === 0 || nid !== pathNodes[0]) {
          points.push([nodes[nid].lat, nodes[nid].lng]);
        }
      }

      const pathCost = gScore.get(destination)! + remainingEdgeCost;

      return {
        path: pathNodes,
        points,
        edgeIds: pathEdgeIds,
        totalCost: Math.round(pathCost * 100) / 100,
        remainingEdgeCost: Math.round(remainingEdgeCost * 100) / 100,
      };
    }

    openSet.delete(current);

    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      const blockage = graph.getBlockage(neighbor.edgeId);
      const penalty = PENALTIES[blockage];

      if (!Number.isFinite(penalty)) {
        // Blocked road (level 2) — cannot enter
        continue;
      }

      const edgeCost = neighbor.length * penalty;
      const candidateG = gScore.get(current)! + edgeCost;

      if (candidateG < (gScore.get(neighbor.to) ?? Infinity)) {
        cameFrom.set(neighbor.to, { prevNode: current, edgeId: neighbor.edgeId });
        gScore.set(neighbor.to, candidateG);
        openSet.add(neighbor.to);
      }
    }
  }

  // Unreachable
  return null;
}
