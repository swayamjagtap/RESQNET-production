/**
 * src/sim/graph.ts
 * Road graph loading, adjacency construction, and spatial snapping helpers.
 * Pure TypeScript — no React or DOM dependencies.
 */

import type {
  RoadGraphData,
  RoadNode,
  RoadEdge,
  SnapResult,
  BlockageLevel,
} from './types';
import defaultRoadData from '../data/vileparle-roads.json';

/** Haversine formula to compute distance in metres between two lat/lng points */
export function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class RoadGraph {
  public readonly metadata: RoadGraphData['metadata'];
  public readonly nodes: Record<string, RoadNode>;
  public readonly edges: RoadEdge[];
  private readonly blockageMap: Map<string, BlockageLevel>;
  private readonly adjacencyMap: Map<string, { to: string; edgeId: string; length: number }[]>;

  constructor(data: RoadGraphData = defaultRoadData as unknown as RoadGraphData) {
    this.metadata = data.metadata;
    this.nodes = data.nodes;
    this.edges = data.edges.map((e) => ({ ...e, blockage: e.blockage ?? 0 }));
    this.blockageMap = new Map();
    this.adjacencyMap = new Map();

    for (const nodeKey of Object.keys(this.nodes)) {
      this.adjacencyMap.set(nodeKey, []);
    }

    for (const edge of this.edges) {
      this.blockageMap.set(edge.id, edge.blockage ?? 0);

      if (this.adjacencyMap.has(edge.from)) {
        this.adjacencyMap.get(edge.from)!.push({
          to: edge.to,
          edgeId: edge.id,
          length: edge.lengthMetres,
        });
      }

      if (this.adjacencyMap.has(edge.to)) {
        this.adjacencyMap.get(edge.to)!.push({
          to: edge.from,
          edgeId: edge.id,
          length: edge.lengthMetres,
        });
      }
    }
  }

  public getBlockage(edgeId: string): BlockageLevel {
    return this.blockageMap.get(edgeId) ?? 0;
  }

  public setBlockage(edgeId: string, blockage: BlockageLevel): void {
    if (![0, 1, 2].includes(blockage)) {
      throw new Error(`Invalid blockage level: ${blockage}`);
    }
    this.blockageMap.set(edgeId, blockage);
    const edge = this.edges.find((e) => e.id === edgeId);
    if (edge) {
      edge.blockage = blockage;
    }
  }

  public getNeighbors(nodeId: string): { to: string; edgeId: string; length: number }[] {
    return this.adjacencyMap.get(nodeId) ?? [];
  }

  /**
   * Find the nearest node in the graph to a given lat/lng coordinate.
   * Emits warning: true if the nearest node is further than `warningThresholdMetres` (default 300 m).
   */
  public snapToNearestNode(
    lat: number,
    lng: number,
    warningThresholdMetres = 300
  ): SnapResult {
    let nearestId = '';
    let minDistance = Infinity;

    for (const node of Object.values(this.nodes)) {
      const dist = haversineMetres(lat, lng, node.lat, node.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestId = node.id;
      }
    }

    if (!nearestId) {
      throw new Error('Graph contains no nodes to snap to.');
    }

    return {
      nodeId: nearestId,
      distanceMetres: Math.round(minDistance * 100) / 100,
      warning: minDistance > warningThresholdMetres,
    };
  }
}
