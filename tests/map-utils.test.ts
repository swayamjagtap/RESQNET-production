import { describe, it, expect } from 'vitest';
import { positionAlongPolyline } from '../src/lib/map-utils';
import { haversineMetres } from '../src/sim/graph';

describe('positionAlongPolyline', () => {
  it('returns the first vertex at progress 0 or negative', () => {
    const geom: [number, number][] = [[10, 10], [10, 20]];
    expect(positionAlongPolyline(geom, 0)).toEqual([10, 10]);
    expect(positionAlongPolyline(geom, -10)).toEqual([10, 10]);
  });

  it('returns the last vertex if progress exceeds length', () => {
    const geom: [number, number][] = [[10, 10], [10, 10.001]];
    const length = haversineMetres(10, 10, 10, 10.001);
    expect(positionAlongPolyline(geom, length + 10)).toEqual([10, 10.001]);
  });

  it('interpolates correctly midway on a single segment', () => {
    const geom: [number, number][] = [[10, 10], [10, 20]];
    const length = haversineMetres(10, 10, 10, 20);
    const mid = positionAlongPolyline(geom, length / 2);
    expect(mid[0]).toBeCloseTo(10);
    expect(mid[1]).toBeCloseTo(15);
  });

  it('interpolates across multiple segments', () => {
    const geom: [number, number][] = [[10, 10], [10, 20], [20, 20]];
    const len1 = haversineMetres(10, 10, 10, 20);
    const len2 = haversineMetres(10, 20, 20, 20);
    
    // Middle of the second segment
    const mid = positionAlongPolyline(geom, len1 + len2 / 2);
    expect(mid[0]).toBeCloseTo(15);
    expect(mid[1]).toBeCloseTo(20);
  });
});
