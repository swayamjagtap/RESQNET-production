/**
 * src/lib/nearest-edge.ts
 * Spatial search for nearest road edge segment to a pixel coordinate.
 * Used by the map click handler to find which road the user clicked.
 */
import type { RoadEdge } from '../sim/types';

/** A segment of a road edge, used in the spatial grid. */
export interface EdgeSegment {
  edgeId: string;
  segIdx: number;
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
}

/** A grid cell key string. */
type CellKey = string;

/** Spatial grid for O(1) lookup of nearby edge segments. */
export class EdgeSpatialGrid {
  private readonly cellSize: number;
  private readonly grid = new Map<CellKey, EdgeSegment[]>();

  /**
   * @param cellSize Grid cell size in degrees (~0.001 ≈ 100m).
   */
  constructor(edges: readonly RoadEdge[], cellSize = 0.001) {
    this.cellSize = cellSize;
    for (const edge of edges) {
      const geom = edge.geometry;
      for (let i = 0; i < geom.length - 1; i++) {
        const seg: EdgeSegment = {
          edgeId: edge.id,
          segIdx: i,
          lat1: geom[i][0],
          lng1: geom[i][1],
          lat2: geom[i + 1][0],
          lng2: geom[i + 1][1],
        };
        // Insert into all cells this segment touches
        const minLat = Math.min(seg.lat1, seg.lat2);
        const maxLat = Math.max(seg.lat1, seg.lat2);
        const minLng = Math.min(seg.lng1, seg.lng2);
        const maxLng = Math.max(seg.lng1, seg.lng2);
        const r0 = Math.floor(minLat / cellSize);
        const r1 = Math.floor(maxLat / cellSize);
        const c0 = Math.floor(minLng / cellSize);
        const c1 = Math.floor(maxLng / cellSize);
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const key = `${r},${c}`;
            let bucket = this.grid.get(key);
            if (!bucket) {
              bucket = [];
              this.grid.set(key, bucket);
            }
            bucket.push(seg);
          }
        }
      }
    }
  }

  /** Get candidate segments near a point. */
  getCandidates(lat: number, lng: number, radiusCells = 1): EdgeSegment[] {
    const r0 = Math.floor(lat / this.cellSize) - radiusCells;
    const r1 = Math.floor(lat / this.cellSize) + radiusCells;
    const c0 = Math.floor(lng / this.cellSize) - radiusCells;
    const c1 = Math.floor(lng / this.cellSize) + radiusCells;
    const result: EdgeSegment[] = [];
    const seen = new Set<string>();
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const bucket = this.grid.get(`${r},${c}`);
        if (bucket) {
          for (const seg of bucket) {
            const key = `${seg.edgeId}:${seg.segIdx}`;
            if (!seen.has(key)) {
              seen.add(key);
              result.push(seg);
            }
          }
        }
      }
    }
    return result;
  }
}

/** Squared distance from point (px, py) to segment (ax, ay)-(bx, by). */
export function pointToSegmentDistSq(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  const ex = px - closestX;
  const ey = py - closestY;
  return ex * ex + ey * ey;
}

export interface NearestEdgeResult {
  edgeId: string;
  distPx: number;
}

/**
 * Find the nearest road edge to a click point in pixel coordinates.
 * @param clickLat Click latitude
 * @param clickLng Click longitude
 * @param map Leaflet map (for latLngToContainerPoint)
 * @param grid Precomputed spatial grid
 * @param tolerancePx Maximum pixel distance (14 for mouse, 24 for touch)
 * @returns The nearest edge within tolerance, or null.
 */
export function findNearestEdge(
  clickLat: number,
  clickLng: number,
  latLngToPixel: (lat: number, lng: number) => { x: number; y: number },
  grid: EdgeSpatialGrid,
  tolerancePx: number
): NearestEdgeResult | null {
  const clickPt = latLngToPixel(clickLat, clickLng);
  const candidates = grid.getCandidates(clickLat, clickLng, 2);

  let bestEdgeId: string | null = null;
  let bestDistSq = tolerancePx * tolerancePx;

  for (const seg of candidates) {
    const p1 = latLngToPixel(seg.lat1, seg.lng1);
    const p2 = latLngToPixel(seg.lat2, seg.lng2);
    const dSq = pointToSegmentDistSq(clickPt.x, clickPt.y, p1.x, p1.y, p2.x, p2.y);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestEdgeId = seg.edgeId;
    }
  }

  if (bestEdgeId === null) return null;
  return { edgeId: bestEdgeId, distPx: Math.sqrt(bestDistSq) };
}
