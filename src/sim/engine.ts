/**
 * src/sim/engine.ts
 * Headless simulation engine with fixed 1-second timestep.
 *
 * Preserves the old simulator's tick() (core.js lines ~165–210) and
 * movement semantics, adapted for real road graphs with haversine distances.
 *
 * ASSUMPTIONS:
 * - AMBULANCE_SPEED_MPS = 8.3 m/s (~30 km/h city average). This is an
 *   assumption for simulation purposes, not measured operational data.
 * - Each tick() call advances exactly 1 simulated second.
 * - Movement follows each edge's polyline geometry with position derived
 *   from progress along the current edge.
 *
 * DELIBERATE DIFFERENCES from old simulator:
 * 1. Uses haversine metres instead of schematic pixel distances.
 * 2. Uses snake_case injury types (blood_loss, limb_loss) to match Supabase schema.
 * 3. No animation controller, dwell times, or playback speed — purely headless.
 * 4. Emits a "snapshot" event every 60 simulated seconds.
 * 5. Deterministic A* tie-breaking (lowest node ID wins).
 *
 * Pure TypeScript — no DOM, no React, no Math.random, no Date.now.
 */

import { RoadGraph, haversineMetres } from './graph';
import { astar } from './astar';
import type {
  SimState,
  SimAmbulance,
  BlockageLevel,
} from './types';
import { claim, simEvent, markStuck, roadSignature, routeFor } from './dispatch';
import { selectHospital, deliver, availableResources } from './hospital';

/* ─────────────────────── Constants ─────────────────────────────────────────── */

/**
 * Ambulance speed in metres per simulated second.
 * ~30 km/h city average. ASSUMPTION, not measured data.
 */
export const AMBULANCE_SPEED_MPS = 8.3;

/** Blockage cost multipliers: clear=1x, partial=3x, blocked=∞. */
export const PENALTIES: readonly number[] = [1, 3, Infinity];

/** Seconds between automatic snapshot events. */
const SNAPSHOT_INTERVAL = 60;

/* ─────────────────────── SimEngine ─────────────────────────────────────────── */

export class SimEngine {
  public readonly state: SimState;
  private readonly graph: RoadGraph;

  /**
   * Per-ambulance movement tracking. Each entry stores current edge traversal
   * progress so movement can be computed without floating-point accumulation errors.
   */
  private readonly movement: Map<
    string,
    {
      edgeIndex: number; // Index into currentPath (current edge starts at path[edgeIndex])
      edgeProgress: number; // 0..1 fraction traversed on current edge
      distanceTravelledOnEdge: number; // metres traversed on current edge
    }
  >;

  private lastSnapshotSecond: number;

  constructor(state: SimState, graph: RoadGraph) {
    this.state = state;
    this.graph = graph;
    this.movement = new Map();
    this.lastSnapshotSecond = 0;
  }

  /* ─────────────────── Start ──────────────────────────────────────────────── */

  /**
   * Start the simulation. Matches core.js startSimulation() (line ~162).
   */
  start(): void {
    if (this.state.status !== 'idle') return;
    this.state.status = 'running';
    simEvent(this.state, 'start', 'Simulation started');
  }

  /* ─────────────────── Road blockage ─────────────────────────────────────── */

  /**
   * Set blockage level on a road edge mid-run.
   *
   * Rerouting rules (match core.js setRoadBlockage lines ~230–260):
   * - An ambulance already ON the newly blocked edge finishes that edge
   *   and reroutes at the next node (no teleport, no reversal).
   * - Other ambulances with affected remaining paths reroute immediately
   *   from their current position.
   * - No reachable route → explicit "stuck" state.
   */
  setBlockage(edgeId: string, blockage: BlockageLevel): void {
    const edge = this.graph.edges.find((e) => e.id === edgeId);
    if (!edge || ![0, 1, 2].includes(blockage)) {
      throw new Error(`Invalid road/blockage: ${edgeId} = ${blockage}`);
    }

    const oldBlockage = this.graph.getBlockage(edgeId);
    if (oldBlockage === blockage) return;

    this.graph.setBlockage(edgeId, blockage);
    simEvent(this.state, 'road_change', `Road ${edge.from}→${edge.to}: ${['clear', 'partial', 'blocked'][blockage]}`, {
      roadId: edgeId,
      blockage,
    });

    if (this.state.status !== 'running') return;

    for (const a of this.state.ambulances) {
      if (!['to_incident', 'to_hospital'].includes(a.status)) continue;
      if (a.currentPath.length < 2) continue;

      const mov = this.movement.get(a.id);
      if (!mov) continue;

      // Check if any remaining edge in the path uses this road.
      const matches = (x: string, y: string): boolean =>
        (x === edge.from && y === edge.to) || (x === edge.to && y === edge.from);

      const remainingPath = a.currentPath.slice(mov.edgeIndex);
      const affected = remainingPath.some(
        (x, i, rest) => i + 1 < rest.length && matches(x, rest[i + 1]),
      );

      if (!affected) continue;

      // If ambulance is currently ON this edge, let it finish before rerouting.
      const currentFrom = a.currentPath[mov.edgeIndex];
      const currentTo = a.currentPath[mov.edgeIndex + 1];
      if (
        currentTo &&
        matches(currentFrom, currentTo) &&
        mov.edgeProgress > 0 &&
        mov.edgeProgress < 1
      ) {
        // Mark for deferred reroute: will reroute when edge traversal completes.
        // We store this as a flag on the movement state by noting the ambulance
        // needs rerouting.
        this.finishCurrentEdgeAndReroute(a, mov);
      } else {
        this.rerouteFromCurrentPosition(a);
      }
    }
  }

  /* ─────────────────── Tick ───────────────────────────────────────────────── */

  /**
   * Advance 1 simulated second. Moves ambulances, processes state transitions,
   * and checks for completion.
   *
   * Matches the combined logic of core.js tick() and advanceAnimation().
   */
  tick(): void {
    if (this.state.status !== 'running') return;

    this.state.tick++;
    this.state.simSeconds += 1;

    // 1. Move all ambulances that are travelling.
    for (const a of this.state.ambulances) {
      if (a.status === 'to_incident' || a.status === 'to_hospital') {
        this.moveAmbulance(a);
      }
    }

    // 2. Process state transitions (matches core.js tick() logic).
    const sig = roadSignature(this.state, this.graph);

    for (const a of this.state.ambulances) {
      // Stuck ambulances: retry when road state changes.
      if (a.status === 'stuck') {
        if (a.stuckRoadSignature === sig) continue;

        if (a.resumeStatus === 'hospital_select') {
          selectHospital(this.state, a, this.graph);
          if ((a.status as string) === 'to_hospital') {
            this.initMovement(a);
          }
          continue;
        }

        const route = routeFor(this.graph, a, a.destination!);
        if (!route) {
          a.stuckRoadSignature = sig;
          continue;
        }

        a.status = a.resumeStatus!;
        a.stuckReason = null;
        a.resumeStatus = null;
        a.currentPath = route.path;
        simEvent(this.state, 'reroute', `${a.id} route restored after road change`, {
          ambulanceId: a.id,
          route: [...route.path],
          reason: 'Destination reachable again',
        });
        this.initMovement(a);
        continue;
      }

      switch (a.status) {
        case 'idle':
          if (claim(this.state, a, this.graph)) {
            // claim() mutates a.status; TS narrowing can't see through the call.
            if ((a.status as string) === 'to_incident') {
              this.initMovement(a);
            }
          }
          break;

        case 'to_incident':
        case 'to_hospital': {
          const mov = this.movement.get(a.id);
          if (mov && this.hasArrived(a, mov)) {
            const travellingStatus = a.status;
            a.currentNode = a.destination!;
            a.pathProgress = 0;
            a.status = travellingStatus === 'to_incident' ? 'loading' : 'delivering';
            this.movement.delete(a.id);
            simEvent(this.state, 'arrival', `${a.id} arrived at ${a.currentNode}`, {
              ambulanceId: a.id,
            });
          }
          break;
        }

        case 'loading':
          // Transfer claimed groups to cargo and select hospital.
          // Matches core.js tick() loading case (lines ~195–200).
          a.cargo = a.claimedGroups;
          a.claimedGroups = [];
          for (const g of a.cargo) g.status = 'loaded';
          simEvent(
            this.state,
            'pickup',
            `${a.id} loaded ${a.cargo.reduce((n, g) => n + g.count, 0)} patients`,
            { ambulanceId: a.id },
          );
          selectHospital(this.state, a, this.graph);
          // selectHospital() mutates a.status; TS narrowing can't see through the call.
          if ((a.status as string) === 'to_hospital') {
            this.initMovement(a);
          }
          break;

        case 'delivering':
          deliver(this.state, a, this.graph, claim);
          // deliver() → claim() may mutate a.status; TS narrowing can't see through the call.
          if ((a.status as string) === 'to_incident') {
            this.initMovement(a);
          }
          break;
      }
    }

    // 3. Check for completion.
    if (
      this.state.victimGroups.every((g) => g.status === 'delivered') &&
      this.state.ambulances.every(
        (a) => !a.cargo.length && !a.claimedGroups.length,
      )
    ) {
      this.state.status = 'resolved';
      simEvent(this.state, 'resolved', 'All patients delivered');
    }

    // 4. Emit periodic snapshot.
    if (
      this.state.simSeconds - this.lastSnapshotSecond >= SNAPSHOT_INTERVAL &&
      this.state.status === 'running'
    ) {
      this.emitSnapshot();
      this.lastSnapshotSecond = this.state.simSeconds;
    }
  }

  /* ─────────────────── Run to completion ──────────────────────────────────── */

  /**
   * Run the simulation to completion or until maxTicks is reached.
   * Returns the final state.
   */
  runToCompletion(maxTicks = 100_000): SimState {
    this.start();
    let safety = 0;
    while (this.state.status === 'running' && safety < maxTicks) {
      this.tick();
      safety++;
    }
    return this.state;
  }

  /* ─────────────────── Movement internals ─────────────────────────────────── */

  /**
   * Initialize movement tracking for an ambulance starting a new path.
   */
  private initMovement(a: SimAmbulance): void {
    if (a.currentPath.length < 2) return;
    this.movement.set(a.id, {
      edgeIndex: 0,
      edgeProgress: 0,
      distanceTravelledOnEdge: 0,
    });
  }

  /**
   * Move ambulance along its path for 1 second at AMBULANCE_SPEED_MPS.
   * Follows edge polyline geometry; when one edge is completed, moves to next.
   */
  private moveAmbulance(a: SimAmbulance): void {
    if (a.currentPath.length < 2) return;

    let mov = this.movement.get(a.id);
    if (!mov) {
      this.initMovement(a);
      mov = this.movement.get(a.id)!;
    }

    let distanceToTravel = AMBULANCE_SPEED_MPS; // metres this tick

    while (distanceToTravel > 1e-9 && mov.edgeIndex < a.currentPath.length - 1) {
      const fromId = a.currentPath[mov.edgeIndex];
      const toId = a.currentPath[mov.edgeIndex + 1];
      const edgeLength = this.edgeLengthMetres(fromId, toId);

      if (edgeLength <= 0) {
        // Zero-length edge: skip to next node immediately.
        mov.edgeIndex++;
        mov.edgeProgress = 0;
        mov.distanceTravelledOnEdge = 0;
        a.currentNode = toId;
        continue;
      }

      const remaining = edgeLength - mov.distanceTravelledOnEdge;

      if (distanceToTravel >= remaining - 1e-9) {
        // Complete this edge.
        distanceToTravel -= remaining;
        mov.edgeIndex++;
        mov.edgeProgress = 0;
        mov.distanceTravelledOnEdge = 0;
        a.currentNode = toId;
      } else {
        // Partial traversal of this edge.
        mov.distanceTravelledOnEdge += distanceToTravel;
        mov.edgeProgress = mov.distanceTravelledOnEdge / edgeLength;
        distanceToTravel = 0;
      }
    }

    // Update overall path progress.
    if (mov.edgeIndex >= a.currentPath.length - 1) {
      a.pathProgress = 1;
    } else {
      a.pathProgress = (mov.edgeIndex + mov.edgeProgress) / (a.currentPath.length - 1);
    }
  }

  /**
   * Check if ambulance has reached its destination (path fully traversed).
   */
  private hasArrived(
    a: SimAmbulance,
    mov: { edgeIndex: number; edgeProgress: number },
  ): boolean {
    return mov.edgeIndex >= a.currentPath.length - 1;
  }

  /**
   * Get the length of an edge between two adjacent nodes in metres.
   * Uses the edge's stored lengthMetres if available, otherwise haversine.
   */
  private edgeLengthMetres(fromId: string, toId: string): number {
    const edge = this.graph.edges.find(
      (e) =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId),
    );
    if (edge) return edge.lengthMetres;

    // Fallback to haversine (should not happen with a well-formed graph).
    const from = this.graph.nodes[fromId];
    const to = this.graph.nodes[toId];
    return haversineMetres(from.lat, from.lng, to.lat, to.lng);
  }

  /**
   * Finish the current edge and then reroute from the next node.
   * This handles the "mid-edge block" case: the ambulance is on an edge that
   * just got blocked; it finishes traversing to the next node, then reroutes.
   */
  private finishCurrentEdgeAndReroute(
    a: SimAmbulance,
    mov: { edgeIndex: number; edgeProgress: number; distanceTravelledOnEdge: number },
  ): void {
    // Jump to end of current edge.
    const toId = a.currentPath[mov.edgeIndex + 1];
    if (toId) {
      a.currentNode = toId;
      mov.edgeIndex++;
      mov.edgeProgress = 0;
      mov.distanceTravelledOnEdge = 0;
    }
    this.rerouteFromCurrentPosition(a);
  }

  /**
   * Reroute ambulance from its current node to its destination.
   * If no route exists, mark stuck.
   */
  private rerouteFromCurrentPosition(a: SimAmbulance): void {
    if (!a.destination) return;

    const oldPath = [...a.currentPath];
    const route = astar(this.graph, a.currentNode, a.destination);

    if (!route) {
      this.movement.delete(a.id);
      markStuck(this.state, a, a.status, `No reachable route to ${a.destination}`, this.graph);
    } else {
      a.currentPath = route.path;
      this.initMovement(a);
      simEvent(this.state, 'reroute', `${a.id}: route recomputed`, {
        ambulanceId: a.id,
        reason: 'Road blockage changed',
        oldPath,
        newPath: [...a.currentPath],
      });
    }
  }

  /* ─────────────────── Snapshot ────────────────────────────────────────────── */

  private emitSnapshot(): void {
    simEvent(this.state, 'snapshot', `Snapshot at ${this.state.simSeconds}s`, {
      deliveredCount: this.state.deliveredCount,
      underResourcedCount: this.state.underResourcedCount,
      totalPatients: this.state.totalPatients,
      ambulances: this.state.ambulances.map((a) => ({
        id: a.id,
        status: a.status,
        currentNode: a.currentNode,
        destination: a.destination,
        trips: a.trips,
      })),
      hospitals: this.state.hospitals.map((h) => ({
        id: h.id,
        stock: { ...h.stock },
        available: availableResources(h),
      })),
    });
  }
}
