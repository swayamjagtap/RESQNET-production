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
  nodeNames: Map<string, string>;        // node id -> display name
}

export function buildDisplayNameMaps(
  simInput: SimInput | null,
  state: SimState | null,
  graph: any // RoadGraph
): DisplayNameMaps {
  const ambulanceLabels = new Map<string, string>();
  const hospitalNames = new Map<string, string>();
  const roadNames = new Map<string, string>();
  const nodeNames = new Map<string, string>();

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

  if (graph && graph.nodes && graph.edges) {
    // Collect road names for each node
    const nodeRoads = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
      if (edge.name) {
        if (!nodeRoads.has(edge.from)) nodeRoads.set(edge.from, new Set());
        if (!nodeRoads.has(edge.to)) nodeRoads.set(edge.to, new Set());
        nodeRoads.get(edge.from)!.add(edge.name);
        nodeRoads.get(edge.to)!.add(edge.name);
      }
    }
    
    for (const nodeId of Object.keys(graph.nodes)) {
      const roads = nodeRoads.get(nodeId);
      if (roads && roads.size > 0) {
        const roadArr = Array.from(roads);
        if (roadArr.length === 1) {
          nodeNames.set(nodeId, `a junction on ${roadArr[0]}`);
        } else {
          nodeNames.set(nodeId, `junction of ${roadArr.join(' and ')}`);
        }
      } else {
        nodeNames.set(nodeId, 'junction');
      }
    }
  }

  return { ambulanceLabels, hospitalNames, roadNames, nodeNames };
}

/** Map a sequence of node IDs to road/junction names. */
function routeToNames(route: string[] | undefined, maps: DisplayNameMaps): string {
  if (!route || route.length === 0) return 'unreachable';
  const names = route.map(id => maps.nodeNames.get(id) || 'junction');
  // Deduplicate consecutive identical names
  const deduped: string[] = [];
  for (const n of names) {
    if (n !== deduped[deduped.length - 1]) deduped.push(n);
  }
  return deduped.join(' → ');
}

/** 
 * Port of old describe() behaviour for log rendering.
 * Takes the full event payload and returns a formatted string with display names.
 */
export function describeEvent(e: SimEvent, maps: DisplayNameMaps): string {
  const getAmb = (id?: unknown) => maps.ambulanceLabels.get(String(id)) || id;
  const getHosp = (id?: unknown) => maps.hospitalNames.get(String(id)) || id;
  const text = String(e.text || '');

  // For any text fallback, replace IDs in the raw text
  const replaceIds = (str: string) => {
    let s = str;
    for (const [id, label] of maps.ambulanceLabels) s = s.split(id).join(label);
    for (const [id, name] of maps.hospitalNames) s = s.split(id).join(name);
    s = s.replace(/\bn(\d{7,})\b/g, m => maps.nodeNames.get(m) || 'junction');
    s = s.replace(/\be-[a-f0-9]{6,}\b/gi, 'road segment');
    return s;
  };

  if (e.kind === 'dispatch') {
    const amb = getAmb(e.ambulanceId);
    const reassigned = e.reassignment ? 'reassigned' : 'dispatched';
    const pids = Array.isArray(e.patientIds) ? e.patientIds.join(', ') : '';
    const route = routeToNames(e.route as string[], maps);
    const reason = e.reason || '';
    return `${amb} ${reassigned}: ${pids}. ${replaceIds(text)}. Route: ${route}. ${reason}.`;
  }
  if (e.kind === 'hospital_select') {
    const reason = e.reason || '';
    const needs = Array.isArray(e.needs) ? e.needs : [];
    const count = e.count || 0;
    const cands = Array.isArray(e.candidates) ? e.candidates : [];
    
    const candStrings = cands.map((c: any) => {
      const hName = getHosp(c.hospitalId);
      const status = !c.reachable ? 'unreachable' : (c.sufficient ? 'eligible' : 'insufficient');
      const avail = needs.map((k: string) => `${k} ${(c.available || {})[k]}/${count}`).join(', ');
      const costStr = c.reachable && c.cost !== null ? `; cost ${c.cost.toFixed(1)}` : '';
      return `${hName}: ${status} (${avail}${costStr})`;
    }).join('; ');
    
    return `${replaceIds(text)}. ${reason}. ${candStrings}.`;
  }
  if (e.kind === 'delivery') {
    const amb = getAmb(e.ambulanceId);
    const hosp = getHosp(e.hospitalId);
    const count = e.count || 0;
    const pids = Array.isArray(e.patientIds) ? e.patientIds.join(', ') : '';
    
    const before = e.before as Record<string, number> || {};
    const after = e.after as Record<string, number> || {};
    const stockStr = Object.keys(before).map(k => `${k} ${before[k]} → ${after[k]}`).join(', ');
    
    return `${amb} delivered ${count} patients to ${hosp}; ${pids}; stock ${stockStr}.`;
  }
  if (e.kind === 'reroute') {
    const oldR = routeToNames(e.oldPath as string[], maps);
    const newR = routeToNames((e.newPath || e.route) as string[], maps);
    const reason = e.reason || '';
    return `${replaceIds(text)}. Old: ${oldR}. New: ${newR}. ${reason}`;
  }
  if (e.kind === 'stuck') {
    const reason = e.reason || '';
    return `${replaceIds(text)}. ${reason}`;
  }

  return replaceIds(text);
}

/** Which event kinds to show by default (key decisions). */
export const KEY_EVENT_KINDS = new Set([
  'start', 'dispatch', 'hospital_select', 'arrival', 'pickup',
  'delivery', 'reroute', 'stuck', 'road_change', 'resolved',
]);

export function isKeyEvent(e: SimEvent): boolean {
  return KEY_EVENT_KINDS.has(e.kind);
}
