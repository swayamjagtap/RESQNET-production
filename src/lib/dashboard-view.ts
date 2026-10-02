import type { SimState, SimInput, InjuryType, ResourceKey } from '../sim/types';

export interface DashboardKPIs {
  simulatedTime: string; // mm:ss
  totalPatients: number;
  delivered: number;
  deliveredShort: number;
  onboard: number;
  assigned: number;
  waiting: number;
  reroutes: number;
  roadsBlockedOrPartial: number;
  ledgerEntries: number;
}

export interface DashboardHospitalResource {
  initial: number;
  remaining: number;
  reserved: number;
  consumed: number;
}

export interface DashboardHospital {
  id: string;
  name: string;
  icu: DashboardHospitalResource;
  blood: DashboardHospitalResource;
  vent: DashboardHospitalResource;
  beds: DashboardHospitalResource;
  deliveriesReceived: number;
  status: 'OK' | 'LOW' | 'EMPTY'; // LOW if any remaining <= 25% of initial, EMPTY if any remaining == 0
}

export interface DashboardAmbulance {
  id: string;
  label: string;
  statusSentence: string;
  onboard: number;
  capacity: number;
  destinationName: string | null;
  tripsCompleted: number;
  distanceTravelledKm?: number; // if available, but SimAmbulance doesn't track distance in state yet
}

export interface DashboardPatientStats {
  type: InjuryType;
  total: number;
  waiting: number;       // waiting for dispatch
  assigned: number;      // reserved
  onboard: number;       // loaded
  delivered: number;     // delivered with full stock
  deliveredShort: number;// delivered short of stock
}

export interface DashboardView {
  kpis: DashboardKPIs;
  hospitals: DashboardHospital[];
  ambulances: DashboardAmbulance[];
  patients: DashboardPatientStats[];
}

function timeFmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function buildDashboardView(state: SimState | null, input: SimInput | null): DashboardView | null {
  if (!state || !input) return null;

  // KPIs & Patients Unified
  let waiting = 0;
  let assigned = 0;
  let onboard = 0;
  let delivered = 0;
  let deliveredShort = 0;
  let totalPatients = 0;

  for (const g of state.victimGroups) {
    totalPatients += g.count;
    if (g.status === 'waiting') {
      waiting += g.count;
    } else if (g.status === 'reserved') {
      assigned += g.count;
    } else if (g.status === 'loaded') {
      onboard += g.count;
    } else if (g.status === 'delivered') {
      if (g.underResourced) {
        deliveredShort += g.count;
      } else {
        delivered += g.count;
      }
    }
  }

  let reroutes = 0;
  const edgeStates = new Map<string, number>();
  for (const ev of state.events) {
    if (ev.kind === 'reroute') {
      reroutes++;
    } else if (ev.kind === 'road_change') {
      const details = ev as any;
      if (details.blockage !== undefined && details.edgeId) {
        edgeStates.set(details.edgeId, details.blockage);
      }
    }
  }
  let roadsBlockedOrPartial = 0;
  for (const blockage of edgeStates.values()) {
    if (blockage > 0) roadsBlockedOrPartial++;
  }

  const kpis: DashboardKPIs = {
    simulatedTime: timeFmt(state.simSeconds),
    totalPatients,
    delivered,
    deliveredShort,
    onboard,
    assigned,
    waiting,
    reroutes,
    roadsBlockedOrPartial,
    ledgerEntries: state.events.length,
  };

  // Hospitals
  const hospitals: DashboardHospital[] = state.hospitals.map(sh => {
    const initH = input.hospitals.find(ih => ih.id === sh.id);
    const deliveriesReceived = state.events.filter(e => e.kind === 'delivery' && (e as any).hospitalId === sh.id).reduce((sum, e: any) => sum + (e.patientIds?.length || 0), 0);

    const buildRes = (key: ResourceKey): DashboardHospitalResource => {
      const initial = initH ? initH.stock[key] : sh.stock[key] + sh.reserved[key];
      const remaining = sh.stock[key] - (sh.reserved[key] || 0); // available after reservations
      const reserved = sh.reserved[key] || 0;
      const consumed = initial - (remaining + reserved);
      return { initial, remaining, reserved, consumed };
    };

    const icu = buildRes('icu');
    const blood = buildRes('blood');
    const vent = buildRes('vent');
    const beds = buildRes('beds');

    let status: 'OK' | 'LOW' | 'EMPTY' = 'OK';
    const checkStatus = (r: DashboardHospitalResource) => {
      if (r.initial === 0) return;
      if (r.remaining === 0) status = 'EMPTY';
      else if (status !== 'EMPTY' && r.remaining <= r.initial * 0.25) status = 'LOW';
    };
    checkStatus(icu); checkStatus(blood); checkStatus(vent); checkStatus(beds);

    return {
      id: sh.id,
      name: sh.name,
      icu, blood, vent, beds,
      deliveriesReceived,
      status
    };
  });

  // Ambulances
  const ambulances: DashboardAmbulance[] = state.ambulances.map(a => {
    let destName = null;
    if (a.destination) {
      const h = input.hospitals.find(h => h.graphNodeId === a.destination || h.id === a.destination);
      if (h) destName = h.name;
      else if (a.destination === state.incidentNode) destName = 'Incident';
      else destName = a.destination;
    }
    const onboard = a.cargo.reduce((s, g) => s + g.count, 0);
    
    // basic sentence builder, matching fleet-status
    let statusSentence = 'idle';
    if (a.status === 'to_incident') statusSentence = 'en route to Incident';
    else if (a.status === 'loading') statusSentence = 'loading patients';
    else if (a.status === 'hospital_select') statusSentence = 'selecting hospital';
    else if (a.status === 'to_hospital') statusSentence = `en route to ${destName || 'Hospital'}`;
    else if (a.status === 'delivering') statusSentence = `delivering at ${destName || 'Hospital'}`;
    else if (a.status === 'stuck') statusSentence = `stuck: ${a.stuckReason}`;
    
    return {
      id: a.id,
      label: a.label,
      statusSentence,
      onboard,
      capacity: a.capacity,
      destinationName: destName,
      tripsCompleted: a.trips
    };
  });

  const pts = new Map<InjuryType, DashboardPatientStats>();
  const types: InjuryType[] = ['fracture', 'blood_loss', 'unconscious', 'limb_loss'];
  for (const t of types) {
    pts.set(t, { type: t, total: 0, waiting: 0, assigned: 0, onboard: 0, delivered: 0, deliveredShort: 0 });
  }

  for (const vg of input.victimGroups) {
    const st = pts.get(vg.type)!;
    st.total += vg.count;
  }

  for (const vg of state.victimGroups) {
    const st = pts.get(vg.type)!;
    if (vg.status === 'waiting') st.waiting += vg.count;
    else if (vg.status === 'reserved') st.assigned += vg.count;
    else if (vg.status === 'loaded') st.onboard += vg.count;
    else if (vg.status === 'delivered') {
      if (vg.underResourced) st.deliveredShort += vg.count;
      else st.delivered += vg.count;
    }
  }

  return {
    kpis,
    hospitals,
    ambulances,
    patients: Array.from(pts.values())
  };
}

export function groupCoLocatedAmbulances(ambulances: any[], zoom: number, maxPxDistance = 14) {
  if (ambulances.length <= 1) return ambulances.map(a => ({ ...a, group: [a] }));

  const latLngToPoint = (lat: number, lng: number, z: number) => {
    const scale = 256 * Math.pow(2, z);
    let sin = Math.sin(lat * Math.PI / 180);
    sin = Math.max(Math.min(sin, 0.9999), -0.9999);
    const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
    const x = lng / 360 + 0.5;
    return { x: x * scale, y: y * scale };
  };

  const points = ambulances.map(a => ({
    ...a,
    px: latLngToPoint(a.point.lat, a.point.lng, zoom)
  }));

  const groups: any[] = [];
  const used = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    if (used.has(a.id)) continue;
    
    const group = [a];
    used.add(a.id);
    
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j];
      if (used.has(b.id)) continue;
      
      const dx = a.px.x - b.px.x;
      const dy = a.px.y - b.px.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist <= maxPxDistance) {
        group.push(b);
        used.add(b.id);
      }
    }
    
    groups.push({
      // Base the main marker on the first one
      ...a,
      group: group.map(g => {
        // preserve the original object
        const orig = ambulances.find(x => x.id === g.id);
        return orig;
      })
    });
  }

  return groups;
}
