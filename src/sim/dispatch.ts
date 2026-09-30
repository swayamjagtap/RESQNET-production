/**
 * src/sim/dispatch.ts
 * Deterministic priority dispatch and capacity-sized batch splitting.
 *
 * Preserves core.js claim() semantics (lines ~113–130):
 * - Picks the highest-priority waiting group (lowest PRIORITY value).
 * - Ties broken by group sequence number (first declared wins).
 * - If group.count > ambulance.capacity, splits off a capacity-sized batch
 *   with a new group ID; the remainder keeps the original group entry.
 * - Assigns the batch to the ambulance and routes to the incident node.
 *
 * Pure TypeScript — no DOM, no React.
 */

import { astar } from './astar';
import { RoadGraph } from './graph';
import { PRIORITY } from './adapter';
import type {
  SimState,
  SimAmbulance,
  VictimGroup,
  SimEvent,
} from './types';

/* ─────────────────────── Internal helpers ──────────────────────────────────── */

/** Compute a signature of all road blockage levels for stuck-retry detection. */
export function roadSignature(_state: SimState, graph: RoadGraph): string {
  return graph.edges.map((e) => `${e.id}:${graph.getBlockage(e.id)}`).join('|');
}

/** Push an event onto the event list. Matches core.js event() (line ~103). */
export function simEvent(
  state: SimState,
  kind: SimEvent['kind'],
  text: string,
  details: Record<string, unknown> = {},
): void {
  state.events.push({
    id: state.events.length + 1,
    tick: state.tick,
    simSeconds: state.simSeconds,
    kind,
    text,
    ...details,
  });
}

/** Mark an ambulance stuck. Matches core.js markStuck() (line ~108). */
export function markStuck(
  state: SimState,
  a: SimAmbulance,
  resumeStatus: SimAmbulance['status'],
  reason: string,
  graph: RoadGraph,
): void {
  a.status = 'stuck';
  a.resumeStatus = resumeStatus;
  a.stuckReason = reason;
  a.stuckRoadSignature = roadSignature(state, graph);
  simEvent(state, 'stuck', `${a.id}: ${reason}`, { ambulanceId: a.id });
}

/** Route from ambulance's current node to a destination. */
export function routeFor(
  graph: RoadGraph,
  a: SimAmbulance,
  destination: string,
) {
  return astar(graph, a.currentNode, destination);
}

/* ─────────────────────── claim() ───────────────────────────────────────────── */

/**
 * Claim the highest-priority waiting victim group for ambulance `a`.
 * Implements core.js claim() (lines ~113–130).
 *
 * Returns true if a group was claimed, false if no waiting groups remain.
 */
export function claim(
  state: SimState,
  a: SimAmbulance,
  graph: RoadGraph,
): boolean {
  const waitingGroups = state.victimGroups
    .filter((g) => g.status === 'waiting')
    .sort(
      (x, y) =>
        PRIORITY[x.type] - PRIORITY[y.type] || x.sequence - y.sequence,
    );

  const group = waitingGroups[0];
  if (!group) return false;

  let batch: VictimGroup = group;

  // Split oversized group into a capacity-sized batch (core.js lines ~120–125).
  if (group.count > a.capacity) {
    const ids = group.patientIds.splice(0, a.capacity);
    group.count -= a.capacity;
    batch = {
      ...group,
      id: `G${++state.nextGroupId}`,
      count: ids.length,
      patientIds: ids,
      // These are fresh for the split batch:
      status: 'waiting',
      assignedAmbulanceId: null,
      deliveredHospitalId: null,
      underResourced: false,
    };
    state.victimGroups.push(batch);
  }

  batch.status = 'reserved';
  batch.assignedAmbulanceId = a.id;
  a.claimedGroups = [batch];
  a.destination = state.incidentNode;
  a.status = 'to_incident';

  const route = routeFor(graph, a, a.destination);
  a.currentPath = route ? route.path : [];

  simEvent(state, 'dispatch', `${a.id} claimed ${batch.count} ${batch.type} patients`, {
    ambulanceId: a.id,
    groupId: batch.id,
    patientIds: [...batch.patientIds],
    route: [...a.currentPath],
    reassignment: a.trips > 0,
    reason:
      'Highest-priority waiting group; stable fleet order; capacity-sized batch; A* route',
  });

  if (!route) {
    markStuck(state, a, 'to_incident', 'No reachable route to incident', graph);
  }

  return true;
}
