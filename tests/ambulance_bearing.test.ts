import { describe, it, expect } from 'vitest';
import { getMapPoints } from '../src/lib/map-utils';
import type { SimAmbulance } from '../src/sim/types';

describe('Ambulance bearing and flip logic', () => {
  it('correctly calculates bearing when moving east and west', () => {
    // We can simulate an ambulance on an edge to see its bearing
    const graphData = {
      metadata: { source: '', query: '', fetchedAt: '', boundingBox: { swLat: 0, swLng: 0, neLat: 0, neLng: 0 }, nodeCount: 2, edgeCount: 1, units: { distance: 'm', coordinates: 'latlng' }, notes: '' },
      nodes: {
        'W': { id: 'W', lat: 0, lng: 0 },
        'E': { id: 'E', lat: 0, lng: 1 }, // E is east of W
      },
      edges: [
        { id: 'E1', from: 'W', to: 'E', lengthMetres: 111000, geometry: [[0,0], [0,1]] as [number, number][] }
      ]
    };
    
    // Create mock state and simInput
    const aEast = {
      id: 'a1', label: 'A1', capacity: 2, status: 'to_incident', trips: 0,
      currentNode: 'W', destination: 'E', currentPath: ['W', 'E'],
      currentEdgeProgress: { from: 'W', to: 'E', distanceTravelledOnEdge: 50000, edgeLength: 111000 },
      cargo: [], claimedGroups: [], hospitalReservation: null, stuckReason: null, resumeStatus: null
    } as unknown as SimAmbulance;
    const aWest = {
      id: 'a2', label: 'A2', capacity: 2, status: 'to_incident', trips: 0,
      currentNode: 'E', destination: 'W', currentPath: ['E', 'W'],
      currentEdgeProgress: { from: 'E', to: 'W', distanceTravelledOnEdge: 50000, edgeLength: 111000 },
      cargo: [], claimedGroups: [], hospitalReservation: null, stuckReason: null, resumeStatus: null
    } as unknown as SimAmbulance;
    const aIdle = {
      id: 'a3', label: 'A3', capacity: 2, status: 'idle', trips: 0,
      currentNode: 'W', destination: null, currentPath: [],
      currentEdgeProgress: null,
      cargo: [], claimedGroups: [], hospitalReservation: null, stuckReason: null, resumeStatus: null
    } as unknown as SimAmbulance;

    const state = {
      status: 'running', tick: 1, simSeconds: 1, events: [], deliveredCount: 0, underResourcedCount: 0, policy: 'resource_aware',
      hospitals: [], victimGroups: [], ambulances: [aEast, aWest, aIdle]
    } as any;

    const points = getMapPoints({ hospitals: [] } as any, state, { edges: graphData.edges, nodes: graphData.nodes } as any, 0);

    const eastPoint = points.ambulances.find(a => a.id === 'a1')!;
    const westPoint = points.ambulances.find(a => a.id === 'a2')!;
    const idlePoint = points.ambulances.find(a => a.id === 'a3')!;

    // East bearing should be > 0 (actually ~90 degrees)
    expect(eastPoint.bearing).toBeGreaterThan(0);
    expect(eastPoint.bearing).toBeLessThan(180);

    // West bearing should be < 0
    expect(westPoint.bearing).toBeLessThan(0);
    
    // Idle bearing should be 0
    expect(idlePoint.bearing).toBe(0);
  });
});
