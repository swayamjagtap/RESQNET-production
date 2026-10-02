import { describe, it, expect } from 'vitest';
import { stressScenario, stressHospitals, stressAmbulances } from '../src/lib/demoScenario';
import { loadVileParleGraph } from '../src/sim/graph';
import { createRun, buildSimInput } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';

describe('Patient Pipeline Invariants', () => {
  it('total_patients == waiting + assigned + onboard + delivered + delivered_short', async () => {
    const graph = await loadVileParleGraph();
    const input = buildSimInput(stressScenario, stressHospitals, stressAmbulances, graph);
    const run = createRun(input);
    const engine = new SimEngine(run, graph);

    // Initial state check
    let totalPatients = 0;
    for (const g of run.victimGroups) {
      totalPatients += g.count;
    }

    // Tick the engine and sample every 10 ticks
    while (run.status !== 'resolved' && run.tick < 10000) {
      engine.tick();

      if (run.tick % 10 === 0) {
        let waiting = 0, assigned = 0, onboard = 0, delivered = 0, deliveredShort = 0;
        
        for (const g of run.victimGroups) {
          if (g.status === 'waiting') waiting += g.count;
          else if (g.status === 'reserved') assigned += g.count;
          else if (g.status === 'loaded') onboard += g.count;
          else if (g.status === 'delivered') {
            if (g.underResourced) deliveredShort += g.count;
            else delivered += g.count;
          }
        }

        expect(waiting + assigned + onboard + delivered + deliveredShort).toBe(totalPatients);
      }
    }
    
    // Ensure the simulation resolved
    expect(run.status).toBe('resolved');
  });
});
