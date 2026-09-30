/**
 * src/sim/hospital.ts
 * Hospital selection and delivery logic.
 *
 * Preserves core.js selectHospital() (lines ~132–165) and deliver() (lines ~167–190):
 * - Considers reachability (A* can reach hospital) and available resources.
 * - If sufficient hospitals exist: pick the one with shortest route cost.
 * - Fallback: pick the hospital with highest min(available resources across needs),
 *   then shortest route, then lexicographic hospital ID.
 * - Resource reservations prevent two ambulances overcommitting the same stock.
 * - Delivery consumes reserved resources and marks groups delivered.
 * - Under-resourced deliveries are tracked.
 *
 * Pure TypeScript — no DOM, no React.
 */

import { astar } from './astar';
import { RoadGraph } from './graph';
import { NEEDS, emptyResources } from './adapter';
import { simEvent, markStuck } from './dispatch';
import type {
  SimState,
  SimAmbulance,
  SimHospital,
  ResourceKey,
  AStarResult,
} from './types';

/* ─────────────────────── availableResources ───────────────────────────────── */

/**
 * Available = stock minus reserved. Matches core.js availableResources() (line ~35).
 */
export function availableResources(h: SimHospital): Record<ResourceKey, number> {
  return {
    icu: h.stock.icu - h.reserved.icu,
    blood: h.stock.blood - h.reserved.blood,
    vent: h.stock.vent - h.reserved.vent,
    beds: h.stock.beds - h.reserved.beds,
  };
}

/* ─────────────────────── selectHospital ────────────────────────────────────── */

/**
 * Select the best hospital for ambulance `a` based on:
 * 1. Available resources covering the cargo's needs.
 * 2. Route cost (shortest reachable path).
 * 3. Hospital ID (lexicographic tiebreak).
 *
 * Implements core.js selectHospital() (lines ~132–165).
 * Returns true if a hospital was selected, false if none reachable.
 */
export function selectHospital(
  state: SimState,
  a: SimAmbulance,
  graph: RoadGraph,
): boolean {
  const count = a.cargo.reduce((n, g) => n + g.count, 0);
  const needs = NEEDS[a.cargo[0].type];

  const considered = state.hospitals.map((h) => {
    const route = astar(graph, a.currentNode, h.node);
    const available = availableResources(h);
    const coverage = Math.max(0, Math.min(...needs.map((k) => available[k])));
    return {
      hospital: h,
      route: route as AStarResult | null,
      available,
      coverage,
      sufficient: coverage >= count,
    };
  });

  const candidates = considered.filter((c) => c.route !== null);

  if (!candidates.length) {
    a.destination = null;
    a.currentPath = [];
    simEvent(state, 'hospital_select', `${a.id}: no reachable hospital`, {
      ambulanceId: a.id,
      needs: [...needs],
      count,
      candidates: considered.map((c) => ({
        hospitalId: c.hospital.id,
        available: { ...c.available },
        coverage: c.coverage,
        cost: null,
        sufficient: c.sufficient,
        reachable: false,
      })),
      reason: 'All hospitals unreachable; holding cargo',
    });
    markStuck(state, a, 'hospital_select', 'No reachable hospital', graph);
    return false;
  }

  const sufficient = candidates.filter((c) => c.sufficient);

  // Fully resourced: shortest reachable route. Fallback: most complete resource
  // bundles (min across both resources), then shortest route, then hospital ID.
  // Matches core.js lines ~155–157.
  const pool = sufficient.length ? sufficient : candidates;
  const ranked = [...pool].sort((x, y) => {
    if (sufficient.length) {
      // Among sufficient: sort by cost, then by hospital ID.
      return (
        x.route!.totalCost - y.route!.totalCost ||
        x.hospital.id.localeCompare(y.hospital.id)
      );
    }
    // Fallback: highest coverage, then lowest cost, then hospital ID.
    return (
      y.coverage - x.coverage ||
      x.route!.totalCost - y.route!.totalCost ||
      x.hospital.id.localeCompare(y.hospital.id)
    );
  });

  const chosen = ranked[0];
  const h = chosen.hospital;
  const amounts = emptyResources();

  for (const k of needs) {
    amounts[k] = Math.max(0, Math.min(count, chosen.available[k]));
    h.reserved[k] += amounts[k];
  }

  a.hospitalReservation = {
    hospitalId: h.id,
    amounts,
    underResourced: !chosen.sufficient,
  };
  a.destination = h.node;
  a.currentPath = chosen.route!.path;
  a.status = 'to_hospital';
  a.stuckReason = null;
  a.resumeStatus = null;

  simEvent(
    state,
    'hospital_select',
    `${a.id} selected ${h.id}${chosen.sufficient ? '' : ' (under-resourced)'}`,
    {
      ambulanceId: a.id,
      hospitalId: h.id,
      underResourced: !chosen.sufficient,
      reason: chosen.sufficient
        ? 'Shortest reachable route with sufficient available resources'
        : 'Highest available complete-resource coverage; route cost breaks ties',
      needs: [...needs],
      count,
      route: [...chosen.route!.path],
      reserved: { ...amounts },
      candidates: considered.map((c) => ({
        hospitalId: c.hospital.id,
        available: { ...c.available },
        coverage: c.coverage,
        cost: c.route ? c.route.totalCost : null,
        sufficient: c.sufficient,
        reachable: !!c.route,
      })),
    },
  );

  return true;
}

/* ─────────────────────── deliver ───────────────────────────────────────────── */

/**
 * Deliver cargo at hospital, consume resources, and immediately reassign.
 * Implements core.js deliver() (lines ~167–190).
 */
export function deliver(
  state: SimState,
  a: SimAmbulance,
  graph: RoadGraph,
  claimFn: (state: SimState, a: SimAmbulance, graph: RoadGraph) => boolean,
): void {
  const reservation = a.hospitalReservation!;
  const h = state.hospitals.find((h) => h.id === reservation.hospitalId)!;
  const before = { ...h.stock };
  const consumed = emptyResources();
  const needs = NEEDS[a.cargo[0].type];
  const count = a.cargo.reduce((n, g) => n + g.count, 0);

  for (const k of Object.keys(reservation.amounts) as ResourceKey[]) {
    const own = reservation.amounts[k];
    const others = h.reserved[k] - own;
    consumed[k] = Math.max(0, Math.min(own, h.stock[k] - others));
    h.stock[k] -= consumed[k];
    h.reserved[k] -= own;
  }

  const underResourced = needs.some((k) => consumed[k] < count);
  const patientIds = a.cargo.flatMap((g) => g.patientIds);

  for (const group of a.cargo) {
    group.status = 'delivered';
    group.deliveredHospitalId = h.id;
    group.underResourced = underResourced;
  }

  a.trips++;
  state.deliveredCount += count;
  if (underResourced) state.underResourcedCount += count;

  simEvent(
    state,
    'delivery',
    `${a.id} delivered ${count} patients to ${h.id}${underResourced ? ' — under-resourced delivery' : ''}`,
    {
      ambulanceId: a.id,
      hospitalId: h.id,
      patientIds,
      count,
      underResourced,
      before,
      after: { ...h.stock },
      consumed,
    },
  );

  // Reset ambulance state after delivery.
  a.cargo = [];
  a.claimedGroups = [];
  a.hospitalReservation = null;
  a.currentPath = [];
  a.destination = null;
  a.status = 'idle';
  a.stuckReason = null;
  a.resumeStatus = null;

  // Reassign immediately; otherwise idle at the delivery node.
  // Matches core.js deliver() line ~189.
  claimFn(state, a, graph);
}
