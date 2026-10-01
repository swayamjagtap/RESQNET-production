import type { SimInput, SimState, SimAmbulance } from '../sim/types';
import type { RoadGraph } from '../sim/graph';

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
  graph: RoadGraph | null
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
  for (const a of ambList) {
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
      });
      allPoints.push([node.lat, node.lng]);
    } else {
      warnings.push(`Ambulance ${a.id} current node ${nodeId} not found in road graph.`);
    }
  }

  // 4. Active Routes
  const activeRoutes: ValidatedActiveRoute[] = [];
  for (const a of ambList) {
    if ((a.status === 'to_incident' || a.status === 'to_hospital') && a.currentPath && a.currentPath.length > 0) {
      const positions: [number, number][] = [];
      for (const nodeId of a.currentPath) {
        const node = graph.nodes[nodeId];
        if (node && isFinitePoint(node.lat, node.lng)) {
          positions.push([node.lat, node.lng]);
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

