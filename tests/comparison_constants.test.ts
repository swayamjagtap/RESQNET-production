import { describe, test, expect, beforeAll } from 'vitest';
import { runPolicyComparison } from '../src/lib/compare';
import { COMPARISON_CONSTANTS } from '../src/lib/comparison-constants';
import { 
  demoScenario, demoHospitals, demoAmbulances,
  stressScenario, stressHospitals, stressAmbulances 
} from '../src/lib/demoScenario';
import { loadVileParleGraph, RoadGraph } from '../src/sim/graph';
import { formatTime } from '../src/lib/compare-note';

describe('Comparison Constants', () => {
  let graph: RoadGraph;

  beforeAll(async () => {
    graph = await loadVileParleGraph();
  });

  test('Balanced demo scenario matches constants', () => {
    const res = runPolicyComparison(demoScenario, demoHospitals, demoAmbulances, graph);
    expect(res.ok).toBeTruthy();
    if (!res.ok) return;
    
    expect(formatTime(res.resource_aware.meanHighPriorityDeliverySeconds)).toBe(COMPARISON_CONSTANTS.demo.raHighPriorityMean);
    expect(formatTime(res.baseline.meanHighPriorityDeliverySeconds)).toBe(COMPARISON_CONSTANTS.demo.baselineHighPriorityMean);
  });

  test('Resource-stress demo scenario matches constants', () => {
    const res = runPolicyComparison(stressScenario, stressHospitals, stressAmbulances, graph);
    expect(res.ok).toBeTruthy();
    if (!res.ok) return;
    
    expect(formatTime(res.baseline.meanHighPriorityDeliverySeconds)).toBe(COMPARISON_CONSTANTS.stress.baselineHighPriorityMean);
    expect(formatTime(res.resource_aware.meanHighPriorityDeliverySeconds)).toBe(COMPARISON_CONSTANTS.stress.raHighPriorityMean);
    
    expect(formatTime(res.baseline.simulatedSeconds)).toBe(COMPARISON_CONSTANTS.stress.baselineElapsed);
    expect(formatTime(res.resource_aware.simulatedSeconds)).toBe(COMPARISON_CONSTANTS.stress.raElapsed);
    
    expect(res.baseline.underResourcedCount).toBe(COMPARISON_CONSTANTS.stress.baselineShortOfStock);
    expect(res.resource_aware.underResourcedCount).toBe(COMPARISON_CONSTANTS.stress.raShortOfStock);
  });
});
