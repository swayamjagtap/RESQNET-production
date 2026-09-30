import { describe, it, expect } from 'vitest';
import {
  roundCoord,
  isInsideVileParleBounds,
  parseCoord,
  VILE_PARLE_BOUNDS,
  VILE_PARLE_CENTER,
} from '../src/lib/geo';

// ─── roundCoord ──────────────────────────────────────────────────────────────

describe('roundCoord', () => {
  it('returns integer unchanged', () => {
    expect(roundCoord(19)).toBe(19);
  });

  it('rounds to 6 decimal places', () => {
    expect(roundCoord(19.123456789)).toBe(19.123457);
  });

  it('handles negative coords', () => {
    expect(roundCoord(-72.8697123456)).toBe(-72.869712);
  });

  it('handles zero', () => {
    expect(roundCoord(0)).toBe(0);
  });

  it('does not gain extra decimals on clean values', () => {
    expect(roundCoord(19.1)).toBe(19.1);
  });
});

// ─── isInsideVileParleBounds ──────────────────────────────────────────────────

describe('isInsideVileParleBounds', () => {
  it('accepts the center point', () => {
    expect(isInsideVileParleBounds(VILE_PARLE_CENTER.lat, VILE_PARLE_CENTER.lng)).toBe(true);
  });

  it('accepts a known Vile Parle East coordinate', () => {
    // Vile Parle East is roughly 19.098°N, 72.850°E
    expect(isInsideVileParleBounds(19.098, 72.85)).toBe(true);
  });

  it('accepts a known Vile Parle West coordinate', () => {
    // Vile Parle West is roughly 19.105°N, 72.835°E
    expect(isInsideVileParleBounds(19.105, 72.835)).toBe(true);
  });

  it('accepts exact SW corner (inclusive)', () => {
    expect(isInsideVileParleBounds(VILE_PARLE_BOUNDS.swLat, VILE_PARLE_BOUNDS.swLng)).toBe(true);
  });

  it('accepts exact NE corner (inclusive)', () => {
    expect(isInsideVileParleBounds(VILE_PARLE_BOUNDS.neLat, VILE_PARLE_BOUNDS.neLng)).toBe(true);
  });

  it('rejects a point south of bounds', () => {
    expect(isInsideVileParleBounds(19.080, 72.85)).toBe(false);
  });

  it('rejects a point north of bounds', () => {
    expect(isInsideVileParleBounds(19.130, 72.85)).toBe(false);
  });

  it('rejects a point west of bounds', () => {
    expect(isInsideVileParleBounds(19.105, 72.820)).toBe(false);
  });

  it('rejects a point east of bounds', () => {
    expect(isInsideVileParleBounds(19.105, 72.880)).toBe(false);
  });

  it('rejects Mumbai CST (clearly outside)', () => {
    expect(isInsideVileParleBounds(18.9402, 72.8357)).toBe(false);
  });
});

// ─── parseCoord ──────────────────────────────────────────────────────────────

describe('parseCoord', () => {
  it('returns null for empty string', () => {
    expect(parseCoord('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseCoord(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseCoord(undefined)).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parseCoord('abc')).toBeNull();
  });

  it('returns null for NaN string', () => {
    expect(parseCoord('NaN')).toBeNull();
  });

  it('parses a numeric string', () => {
    expect(parseCoord('19.1136')).toBe(19.1136);
  });

  it('parses a negative numeric string', () => {
    expect(parseCoord('-72.8697')).toBe(-72.8697);
  });

  it('passes a number through', () => {
    expect(parseCoord(19.1136)).toBe(19.1136);
  });

  it('parses zero', () => {
    expect(parseCoord('0')).toBe(0);
  });
});

// ─── VILE_PARLE_CENTER sanity check ──────────────────────────────────────────

describe('VILE_PARLE_CENTER', () => {
  it('is inside bounds', () => {
    expect(isInsideVileParleBounds(VILE_PARLE_CENTER.lat, VILE_PARLE_CENTER.lng)).toBe(true);
  });

  it('lat is midpoint of SW and NE lat', () => {
    const expected = (VILE_PARLE_BOUNDS.swLat + VILE_PARLE_BOUNDS.neLat) / 2;
    expect(VILE_PARLE_CENTER.lat).toBeCloseTo(expected, 10);
  });

  it('lng is midpoint of SW and NE lng', () => {
    const expected = (VILE_PARLE_BOUNDS.swLng + VILE_PARLE_BOUNDS.neLng) / 2;
    expect(VILE_PARLE_CENTER.lng).toBeCloseTo(expected, 10);
  });
});
