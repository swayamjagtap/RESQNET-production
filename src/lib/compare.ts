/**
 * src/lib/compare.ts
 * Pure script to compare simulation policies.
 */

import { RoadGraph } from '../sim/graph';
import { SimEngine } from '../sim/engine';
import { buildSimInput, createRun } from '../sim/adapter';
import type { Scenario, Hospital, Ambulance } from './types';
import type { InjuryType } from '../sim/types';

export interface PolicyMetrics {
  delivered: number;
  underResourcedCount: number;
  simulatedSeconds: number;
  completedTrips: number;
  meanHighPriorityDeliverySeconds: number | null;
}

export type ComparisonResult = {
  ok: true;
  resource_aware: PolicyMetrics;
  baseline: PolicyMetrics;
} | {
  ok: false;
  reason: string;
};

export function runPolicyComparison(
  scenario: Scenario,
  hospitals: Hospital[],
  ambulances: Ambulance[],
  graph: RoadGraph
): ComparisonResult {
  const policies = ['resource_aware', 'baseline_nearest_fcfs'] as const;
  const results = {} as any;

  for (const policy of policies) {
    const input = buildSimInput(scenario, hospitals, ambulances, graph, policy);
    const state = createRun(input);
    const engine = new SimEngine(state, graph);

    engine.start();

    // Run headless to completion
    let maxTicks = 100000;
    while (state.status === 'running' && maxTicks > 0) {
      if (state.simSeconds > 6 * 3600) {
        return { ok: false, reason: `Simulation exceeded 6 simulated hours for ${policy}` };
      }
      engine.tick();
      maxTicks--;
    }

    if (state.status === 'running') {
      return { ok: false, reason: `Simulation failed to resolve in 100k ticks for ${policy}` };
    }

    const completedTrips = state.ambulances.reduce((sum, a) => sum + a.trips, 0);

    // High priority injuries
    const highPriorityTypes = new Set<InjuryType>(['unconscious', 'limb_loss', 'blood_loss']);
    const highPriorityDeliveryTimes: number[] = [];

    // Parse delivery events
    for (const ev of state.events) {
      if (ev.kind === 'delivery') {
        const details = ev as any;
        // Match patients from group
        const deliveredPatientIds = new Set<string>(details.patientIds || []);
        
        for (const g of state.victimGroups) {
          if (highPriorityTypes.has(g.type)) {
            let matches = 0;
            for (const pid of g.patientIds) {
              if (deliveredPatientIds.has(pid)) {
                matches++;
              }
            }
            for (let i = 0; i < matches; i++) {
              highPriorityDeliveryTimes.push(ev.simSeconds);
            }
          }
        }
      }
    }

    let meanHighPriority = null;
    if (highPriorityDeliveryTimes.length > 0) {
      const sum = highPriorityDeliveryTimes.reduce((s, t) => s + t, 0);
      meanHighPriority = sum / highPriorityDeliveryTimes.length;
    }

    results[policy === 'resource_aware' ? 'resource_aware' : 'baseline'] = {
      delivered: state.deliveredCount,
      underResourcedCount: state.underResourcedCount,
      simulatedSeconds: state.simSeconds,
      completedTrips,
      meanHighPriorityDeliverySeconds: meanHighPriority,
    };
  }

  return { ok: true, ...results } as ComparisonResult;
}
