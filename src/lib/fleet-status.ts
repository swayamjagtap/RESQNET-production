import type { LiveAmbulance } from './live-view';
import type { DisplayNameMaps } from './event-display';

export interface FleetStatusInfo {
  text: string;
  icon: string;
  color: string;
}

export function getAmbulanceStatus(a: LiveAmbulance, hasStarted: boolean, maps: DisplayNameMaps): FleetStatusInfo {
  let text = '';
  let icon = '🚑';
  let color = 'inherit';

  const locName = maps.hospitalNames.get(a.currentNode) || maps.nodeNames.get(a.currentNode) || 'a junction';

  if (a.status === 'idle') {
    text = hasStarted ? `: idle at ${locName}` : `: ready at ${locName}`;
    icon = '⏸️';
    color = 'var(--text-muted)';
  } else if (a.status === 'to_incident') {
    text = `→ Incident`;
    icon = '🚨';
  } else if (a.status === 'to_hospital') {
    const destNodeName = maps.hospitalNames.get(a.destinationId || '') || a.destinationName;
    const destName = destNodeName !== 'none' ? destNodeName : (maps.nodeNames.get(a.destinationId || '') || 'unknown road');
    const patientsStr = a.onboard === 1 ? '1 patient' : `${a.onboard} patients`;
    text = `→ ${destName} (carrying ${patientsStr})`;
    icon = '🏥';
    color = 'var(--primary)';
  } else if (a.status === 'stuck') {
    text = `: stuck — ${a.stuckReason || 'unknown reason'}`;
    icon = '⚠️';
    color = 'var(--error)';
  } else if (a.status === 'loading') {
    text = `: loading patients at incident`;
    icon = '⏳';
    color = 'var(--warning)';
  } else if (a.status === 'delivering') {
    text = `: unloading patients at hospital`;
    icon = '🏥';
    color = 'var(--success)';
  } else if (a.status === 'hospital_select') {
    text = `: selecting a destination hospital`;
    icon = '🤔';
    color = 'var(--warning)';
  } else {
    text = `: ${a.status}`;
    icon = '🚑';
  }

  return { text, icon, color };
}
