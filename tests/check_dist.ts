import { loadVileParleGraph } from '../src/sim/graph';
import { astar } from '../src/sim/astar';
import { demoHospitals } from '../src/lib/demoScenario';

async function checkDistances() {
  const graph = await loadVileParleGraph();
  const incidentSnap = graph.snapToNearestNode(19.0985, 72.8500);
  
  for (const h of demoHospitals) {
    const hSnap = graph.snapToNearestNode(h.lat, h.lng);
    const route = astar(graph, incidentSnap.nodeId, hSnap.nodeId);
    console.log(`Hospital ${h.id} at ${h.lat}, ${h.lng}: route cost ${route?.totalCost}`);
  }
}
checkDistances();
