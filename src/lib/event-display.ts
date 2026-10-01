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

  // Replace node id patterns like n1913053660 with road names
  result = result.replace(/\bn(\d{7,})\b/g, (match) => {
    return maps.nodeNames.get(match) || 'junction';
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
