/**
 * src/sim/events.ts
 * Canonical event serialization for deterministic hashing.
 *
 * Events are plain, serializable objects with a fixed field order.
 * canonicalizeEvent() produces a stable JSON string with sorted keys
 * and numbers rounded to 6 decimal places, suitable for SHA-256 hashing.
 *
 * Pure TypeScript — no DOM, no React.
 */

import type { SimEvent } from './types';

/** Number of decimal places for rounding in canonical output. */
const CANONICAL_DECIMALS = 6;

/**
 * Produce a stable, canonical JSON string for a SimEvent.
 * - Keys are sorted lexicographically at every nesting level.
 * - Numbers are rounded to CANONICAL_DECIMALS decimal places.
 * - No extra whitespace.
 *
 * This enables the future hash-log module to produce identical hashes
 * for identical simulation runs regardless of JS engine key ordering.
 */
export function canonicalizeEvent(event: SimEvent): string {
  return JSON.stringify(sortKeys(roundNumbers(event)));
}

/**
 * Deep-sort all object keys lexicographically.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Deep-round all numbers to CANONICAL_DECIMALS places.
 */
function roundNumbers(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) return obj;
    return Math.round(obj * 10 ** CANONICAL_DECIMALS) / 10 ** CANONICAL_DECIMALS;
  }
  if (Array.isArray(obj)) return obj.map(roundNumbers);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = roundNumbers(value);
    }
    return result;
  }
  return obj;
}
