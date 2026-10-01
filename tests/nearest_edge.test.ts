import { describe, it, expect } from 'vitest';
import { EdgeSpatialGrid, findNearestEdge, pointToSegmentDistSq } from '../src/lib/nearest-edge';
import type { RoadEdge } from '../src/sim/types';

describe('pointToSegmentDistSq', () => {
  it('returns 0 when point is on the segment', () => {
    expect(pointToSegmentDistSq(5, 5, 0, 0, 10, 10)).toBeCloseTo(0, 5);
  });

  it('returns correct distance for perpendicular offset', () => {
    // Segment (0,0)-(10,0), point at (5,3): distance should be 3, distSq = 9
    expect(pointToSegmentDistSq(5, 3, 0, 0, 10, 0)).toBeCloseTo(9, 5);
  });

  it('returns distance to endpoint for a degenerate segment', () => {
    expect(pointToSegmentDistSq(3, 4, 0, 0, 0, 0)).toBeCloseTo(25, 5);
  });
});

describe('EdgeSpatialGrid', () => {
  const edges: RoadEdge[] = [
    {
      id: 'edge-a',
      from: 'n1',
      to: 'n2',
      lengthMetres: 100,
      geometry: [[19.10, 72.85], [19.10, 72.851]],
    },
    {
      id: 'edge-b',
      from: 'n3',
      to: 'n4',
      lengthMetres: 100,
      geometry: [[19.10, 72.855], [19.10, 72.856]],
    },
  ];

  const grid = new EdgeSpatialGrid(edges, 0.001);

  it('finds candidate near edge-a', () => {
    const candidates = grid.getCandidates(19.10, 72.8505);
    expect(candidates.some(s => s.edgeId === 'edge-a')).toBe(true);
  });

  it('does not find edge-b far away', () => {
    const candidates = grid.getCandidates(19.10, 72.8505, 0);
    expect(candidates.some(s => s.edgeId === 'edge-b')).toBe(false);
  });
});

describe('findNearestEdge', () => {
  const edges: RoadEdge[] = [
    {
      id: 'road-1',
      from: 'n1',
      to: 'n2',
      lengthMetres: 100,
      geometry: [[19.10, 72.85], [19.10, 72.851]],
    },
    {
      id: 'road-2',
      from: 'n3',
      to: 'n4',
      lengthMetres: 100,
      geometry: [[19.10, 72.855], [19.10, 72.856]],
    },
  ];

  const grid = new EdgeSpatialGrid(edges, 0.001);

  // Mock latLngToPixel: 1 degree = 10000 px for simplicity
  const latLngToPixel = (lat: number, lng: number) => ({
    x: lng * 10000,
    y: lat * 10000,
  });

  it('hits road-1 within tolerance', () => {
    // Click right on road-1
    const result = findNearestEdge(19.10, 72.8505, latLngToPixel, grid, 14);
    expect(result).not.toBeNull();
    expect(result!.edgeId).toBe('road-1');
  });

  it('misses when click is far outside tolerance', () => {
    // Click far from any road
    const result = findNearestEdge(19.20, 72.90, latLngToPixel, grid, 14);
    expect(result).toBeNull();
  });

  it('picks the nearest of two close edges', () => {
    // Click closer to road-2
    const result = findNearestEdge(19.10, 72.8555, latLngToPixel, grid, 200);
    expect(result).not.toBeNull();
    expect(result!.edgeId).toBe('road-2');
  });
});
