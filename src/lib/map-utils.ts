import type { SimInput, SimState, SimAmbulance } from '../sim/types';
import type { RoadGraph } from '../sim/graph';
import { haversineMetres } from '../sim/graph';

export function computeCollocationOffset(
  collocatedIndex: number,
  edgeDirX: number,
  edgeDirY: number
): { dx: number; dy: number } {
  if (collocatedIndex === 0) return { dx: 0, dy: 0 };
  
  const len = Math.sqrt(edgeDirX * edgeDirX + edgeDirY * edgeDirY);
  const px = len === 0 ? 1 : -edgeDirY / len;
  const py = len === 0 ? 0 : edgeDirX / len;
  
  // Alternate sides and spread out: +3px, -3px, +6px, -6px
  const sign = collocatedIndex % 2 === 1 ? 1 : -1;
  const magnitude = Math.min(6, Math.ceil(collocatedIndex / 2) * 3);
  
  return {
    dx: (px * sign * magnitude) + 0,
    dy: (py * sign * magnitude) + 0,
  };
}

/**
 * Computes a coordinate along a polyline given a distance in metres from the start.
 * If progressMetres <= 0, returns the first point.
 * If progressMetres >= total length, returns the last point.
 */
export function positionAlongPolyline(
  geometry: [number, number][],
  progressMetres: number
): [number, number] {
  if (geometry.length === 0) return [0, 0];
  if (geometry.length === 1) return geometry[0];
  if (progressMetres <= 0) return geometry[0];

  let accumulated = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const p1 = geometry[i];
    const p2 = geometry[i + 1];
    const segLen = haversineMetres(p1[0], p1[1], p2[0], p2[1]);
    
    if (accumulated + segLen >= progressMetres) {
      // It falls on this segment
      const overflow = progressMetres - accumulated;
      const fraction = segLen === 0 ? 0 : overflow / segLen;
      const lat = p1[0] + (p2[0] - p1[0]) * fraction;
      const lng = p1[1] + (p2[1] - p1[1]) * fraction;
      return [lat, lng];
    }
    accumulated += segLen;
  }
  return geometry[geometry.length - 1];
}

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface ValidatedHospitalPoint {
  id: string;
  name: string;
  graphNodeId: string;
  point: MapPoint;
}

export interface ValidatedAmbulancePoint {
  id: string;
  label: string;
  capacity: number;
  currentNode: string;
  point: MapPoint;
  ambulance: SimAmbulance;
  bearing: number;
}

export interface ValidatedActiveRoute {
  id: string;
  positions: [number, number][];
}

export interface ValidatedMapPoints {
  incident: MapPoint | null;
  hospitals: ValidatedHospitalPoint[];
  ambulances: ValidatedAmbulancePoint[];
  activeRoutes: ValidatedActiveRoute[];
  bounds: [number, number][] | null;
  warnings: string[];
}

export function isFinitePoint(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng);
}

export function getMapPoints(
  simInput: SimInput | null,
  state: SimState | null,
  graph: RoadGraph | null,
  interpolationFraction: number = 0
): ValidatedMapPoints {
  const warnings: string[] = [];
  if (!simInput || !graph || !graph.nodes) {
    return {
      incident: null,
      hospitals: [],
      ambulances: [],
      activeRoutes: [],
      bounds: null,
      warnings: ['Missing simulation input or road graph.'],
    };
  }

  const allPoints: [number, number][] = [];

  // 1. Incident Point
  let incident: MapPoint | null = null;
  const incidentNodeId = simInput.incidentNodeId || simInput.incidentSnap?.nodeId;
  if (incidentNodeId && graph.nodes[incidentNodeId]) {
    const node = graph.nodes[incidentNodeId];
    if (isFinitePoint(node.lat, node.lng)) {
      incident = { lat: node.lat, lng: node.lng };
      allPoints.push([node.lat, node.lng]);
    } else {
      warnings.push(`Incident node ${incidentNodeId} has invalid coordinates.`);
    }
  } else {
    warnings.push(`Incident node ${incidentNodeId} not found in road graph.`);
  }

  // 2. Hospital Points
  const hospitals: ValidatedHospitalPoint[] = [];
  for (const h of simInput.hospitals) {
    const node = graph.nodes[h.graphNodeId];
    if (node && isFinitePoint(node.lat, node.lng)) {
      hospitals.push({
        id: h.id,
        name: h.name,
        graphNodeId: h.graphNodeId,
        point: { lat: node.lat, lng: node.lng },
      });
      allPoints.push([node.lat, node.lng]);
    } else {
      warnings.push(`Hospital ${h.name} (${h.id}) node ${h.graphNodeId} not found in road graph.`);
    }
  }

  // 3. Ambulance Points
  const ambulances: ValidatedAmbulancePoint[] = [];
  const ambList = state?.ambulances || [];
  
  // Speed is 8.3 m/s from engine
  const AMBULANCE_SPEED_MPS = 8.3;
  const isRunning = state?.status === 'running';

  for (const a of ambList) {
    let bearing = 0;
    
    if (a.currentEdgeProgress) {
      // Use the exact edge progress from the engine
      let fromId = a.currentEdgeProgress.from;
      let toId = a.currentEdgeProgress.to;
      let distanceOnEdge = a.currentEdgeProgress.distanceTravelledOnEdge;
      
      const isMoving = a.status === 'to_incident' || a.status === 'to_hospital';
      let additionalMetres = (isMoving && isRunning) ? (interpolationFraction * AMBULANCE_SPEED_MPS) : 0;
      distanceOnEdge += additionalMetres;
      
      let edge = graph.edges.find(e => 
        (e.from === fromId && e.to === toId) || 
        (e.from === toId && e.to === fromId)
      );
      
      if (edge && distanceOnEdge > edge.lengthMetres) {
         distanceOnEdge = edge.lengthMetres;
      }
      
      if (edge) {
        const geom = [...edge.geometry];
        if (edge.from !== fromId) geom.reverse();
        
        const pos = positionAlongPolyline(geom, distanceOnEdge);
        
        // Calculate bearing
        if (geom.length >= 2) {
          // Find the exact segment we are on to get the correct bearing
          let accumulated = 0;
          let p1 = geom[0], p2 = geom[1];
          for (let i = 0; i < geom.length - 1; i++) {
            const segLen = haversineMetres(geom[i][0], geom[i][1], geom[i+1][0], geom[i+1][1]);
            if (accumulated + segLen >= distanceOnEdge - 1e-9 || i === geom.length - 2) {
              p1 = geom[i];
              p2 = geom[i+1];
              break;
            }
            accumulated += segLen;
          }
          const dLng = p2[1] - p1[1];
          const dLat = p2[0] - p1[0];
          bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
        }
        
        ambulances.push({
          id: a.id,
          label: a.label,
          capacity: a.capacity,
          currentNode: a.currentNode,
          point: { lat: pos[0], lng: pos[1] },
          ambulance: a,
          bearing,
        });
        allPoints.push([pos[0], pos[1]]);
        continue;
      }
    }
    
    // Fallback to current node
    const nodeId = a.currentNode;
    const node = graph.nodes[nodeId];
    if (node && isFinitePoint(node.lat, node.lng)) {
      ambulances.push({
        id: a.id,
        label: a.label,
        capacity: a.capacity,
        currentNode: nodeId,
        point: { lat: node.lat, lng: node.lng },
        ambulance: a,
        bearing: 0,
      });
      allPoints.push([node.lat, node.lng]);
    } else {
      warnings.push(`Ambulance ${a.id} current node ${nodeId} not found in road graph.`);
    }
  }

  // 4. Active Routes
  const activeRoutes: ValidatedActiveRoute[] = [];
  for (const a of ambList) {
    if ((a.status === 'to_incident' || a.status === 'to_hospital') && a.currentPath && a.currentPath.length >= 2) {
      const positions: [number, number][] = [];
      for (let i = 0; i < a.currentPath.length - 1; i++) {
        const fromId = a.currentPath[i];
        const toId = a.currentPath[i+1];
        const edge = graph.edges.find(e => 
          (e.from === fromId && e.to === toId) || 
          (e.from === toId && e.to === fromId)
        );
        if (edge) {
          const geom = [...edge.geometry];
          if (edge.from !== fromId) geom.reverse();
          // To avoid duplicating the shared node at ends of edges, pop the last point if it's not the final edge
          if (i < a.currentPath.length - 2) geom.pop();
          positions.push(...geom);
        } else {
          // Fallback to straight line
          const n1 = graph.nodes[fromId];
          const n2 = graph.nodes[toId];
          if (n1 && n2) {
            if (i === 0) positions.push([n1.lat, n1.lng]);
            positions.push([n2.lat, n2.lng]);
          }
        }
      }
      if (positions.length >= 2) {
        activeRoutes.push({ id: a.id, positions });
      }
    }
  }

  // 5. Bounds
  let bounds: [number, number][] | null = null;
  if (allPoints.length >= 2) {
    bounds = allPoints;
  } else if (allPoints.length === 1) {
    const [lat, lng] = allPoints[0];
    bounds = [
      [lat - 0.005, lng - 0.005],
      [lat + 0.005, lng + 0.005],
    ];
  }

  return {
    incident,
    hospitals,
    ambulances,
    activeRoutes,
    bounds,
    warnings,
  };
}

