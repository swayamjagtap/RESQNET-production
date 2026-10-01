import { describe, it, expect } from 'vitest';
import { loadVileParleGraph } from '../src/sim/graph';
import { SimEngine } from '../src/sim/engine';
import { extractLiveView } from '../src/lib/live-view';
import { buildDisplayNameMaps } from '../src/lib/event-display';
import { getAmbulanceStatus } from '../src/lib/fleet-status';
import { createRun } from '../src/sim/adapter';
import type { SimInput } from '../src/sim/types';

describe('Fleet status with real graph', () => {
  it('never displays raw node IDs during a run', async () => {
    const graph = await loadVileParleGraph();

    const simInput: SimInput = {
      scenarioId: 'test-scenario',
      scenarioTitle: 'Test',
      incidentNodeId: 'n1913053609',
      incidentSnap: { nodeId: 'n1913053609', distanceMetres: 0, warning: false },
      hospitals: [
        {
          id: 'HOSP-1',
          name: 'Shivsena Shakha',
          graphNodeId: 'n1000',
          snap: { nodeId: 'n1000', distanceMetres: 0, warning: false },
          stock: { icu: 10, blood: 10, vent: 10, beds: 10 }
        }
      ],
      ambulances: [
        {
          id: 'AMB-1',
          label: 'Ambulance 1',
          graphNodeId: 'n1913053609',
          snap: { nodeId: 'n1913053609', distanceMetres: 0, warning: false },
          capacity: 3
        }
      ],
      victimGroups: [
        {
          id: 'vg-1',
          sequence: 1,
          type: 'fracture',
          count: 2,
          patientIds: ['p1', 'p2']
        }
      ],
      totalPatients: 2
    };

    const state = createRun(simInput);
    const engine = new SimEngine(state, graph);
    const displayMaps = buildDisplayNameMaps(simInput, engine.state, graph);

    for (let i = 0; i < 200; i++) {
      engine.tick();
      if (i % 10 === 0) {
        const liveView = extractLiveView(engine.state);
        
        for (const a of liveView.ambulances) {
          const status = getAmbulanceStatus(a, engine.state.simSeconds > 0, displayMaps);
          expect(status.text).not.toMatch(/\bn\d{6,}\b/);
        }
      }
    }
  });
});
