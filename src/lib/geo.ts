/**
 * src/lib/geo.ts
 * Pure geographic helpers for RESQNET.
 * No side effects; safe to import in Vitest.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Approximate map view limits for the Vile Parle area demo.
 * These are the bounds used to initialise and soft-warn in LocationPicker.
 * They are NOT administrative boundaries — just a convenient viewing window
 * that keeps both Vile Parle East and Vile Parle West visible at zoom ~14.
 */
export const VILE_PARLE_BOUNDS = {
  swLat: 19.085,
  swLng: 72.825,
  neLat: 19.125,
  neLng: 72.875,
} as const;

/** Centre of the Vile Parle viewing window. */
export const VILE_PARLE_CENTER: LatLng = {
  lat: (VILE_PARLE_BOUNDS.swLat + VILE_PARLE_BOUNDS.neLat) / 2,
  lng: (VILE_PARLE_BOUNDS.swLng + VILE_PARLE_BOUNDS.neLng) / 2,
};

/** Default zoom level for the LocationPicker. */
export const DEFAULT_ZOOM = 14;

/**
 * Round a coordinate value to 6 decimal places (~0.11 m precision).
 */
export function roundCoord(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Returns true if the point is inside the Vile Parle approximate viewing bounds.
 * Inclusive on all edges.
 */
export function isInsideVileParleBounds(lat: number, lng: number): boolean {
  return (
    lat >= VILE_PARLE_BOUNDS.swLat &&
    lat <= VILE_PARLE_BOUNDS.neLat &&
    lng >= VILE_PARLE_BOUNDS.swLng &&
    lng <= VILE_PARLE_BOUNDS.neLng
  );
}

/**
 * Parse a raw coordinate string/number to a number, or null if invalid.
 * Returns null for empty string, null, undefined, or non-finite result.
 */
export function parseCoord(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}
