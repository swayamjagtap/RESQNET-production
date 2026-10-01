/**
 * src/lib/event-display.ts
 * Maps raw engine event text (with UUIDs, node ids) to human-readable display text.
 * Does NOT modify the engine's event list — used only in the log renderer.
 */
import type { SimEvent, SimInput, SimState } from '../sim/types';

export interface DisplayNameMaps {
  ambulanceLabels: Map<string, string>;  // id -> label
  hospitalNames: Map<string, string>;    // id -> name
  roadNames: Map<string, string>;        // edge id -> name
}

export function buildDisplayNameMaps(
  simInput: SimInput | null,
  state: SimState | null
): DisplayNameMaps {
  const ambulanceLabels = new Map<string, string>();
  const hospitalNames = new Map<string, string>();
  const roadNames = new Map<string, string>();

  if (simInput) {
    for (const a of simInput.ambulances) {
      ambulanceLabels.set(a.id, a.label);
    }
    for (const h of simInput.hospitals) {
      hospitalNames.set(h.id, h.name);
    }
  }
  if (state) {
    for (const a of state.ambulances) {
      ambulanceLabels.set(a.id, a.label);
    }
    for (const h of state.hospitals) {
      hospitalNames.set(h.id, h.name);
    }
  }

  return { ambulanceLabels, hospitalNames, roadNames };
}

/** Replace known IDs in event text with display names. */
export function formatEventText(text: string, maps: DisplayNameMaps): string {
  let result = text;

  // Replace ambulance IDs with labels
  for (const [id, label] of maps.ambulanceLabels) {
    result = result.split(id).join(label);
  }

  // Replace hospital IDs with names
  for (const [id, name] of maps.hospitalNames) {
    result = result.split(id).join(name);
  }

  // Replace node id patterns like n1913053660 with shorter form
  result = result.replace(/\bn(\d{7,})\b/g, (match) => {
    return `node…${match.slice(-4)}`;
  });

  // Replace edge id patterns like e-<hash> with road name or "road"
  result = result.replace(/\be-[a-f0-9]{6,}\b/gi, 'road segment');

  return result;
}

/** Which event kinds to show by default (key decisions). */
export const KEY_EVENT_KINDS = new Set([
  'start', 'dispatch', 'hospital_select', 'arrival', 'pickup',
  'delivery', 'reroute', 'stuck', 'road_change', 'resolved',
]);

export function isKeyEvent(e: SimEvent): boolean {
  return KEY_EVENT_KINDS.has(e.kind);
}
