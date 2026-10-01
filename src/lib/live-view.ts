import type { SimState } from '../sim/types';

export interface LiveAmbulance {
  id: string;
  label: string;
  status: string;
  onboard: number;
  capacity: number;
  destinationName: string;
}

export interface LiveView {
  simSeconds: number;
  deliveredCount: number;
  underResourcedCount: number;
  waiting: number;
  status: 'idle' | 'running' | 'resolved';
  eventCount: number;
  ambulances: LiveAmbulance[];
}

export function extractLiveView(state: SimState | null): LiveView {
  if (!state) {
    return {
      simSeconds: 0,
      deliveredCount: 0,
      underResourcedCount: 0,
      waiting: 0,
      status: 'idle',
      eventCount: 0,
      ambulances: []
    };
  }

  const waiting = state.victimGroups
    .filter(g => g.status === 'waiting')
    .reduce((sum, g) => sum + g.count, 0);

  const ambulances = state.ambulances.map(a => {
    let destinationName = a.destination || 'none';
    return {
      id: a.id,
      label: a.label,
      status: a.status,
      onboard: a.cargo.reduce((sum, g) => sum + g.count, 0),
      capacity: a.capacity,
      destinationName
    };
  });

  return {
    simSeconds: state.simSeconds,
    deliveredCount: state.deliveredCount,
    underResourcedCount: state.underResourcedCount,
    waiting,
    status: state.status,
    eventCount: state.events.length,
    ambulances
  };
}
