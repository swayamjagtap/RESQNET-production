import type { Scenario, Hospital, Ambulance } from './types';

export const demoScenario: Scenario = {
  id: 'demo-scenario',
  owner_id: 'public',
  title: 'Demo Synthetic Scenario',
  disaster_type: 'building_collapse',
  incident_lat: 19.0985,
  incident_lng: 72.8500,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  fracture: 4,
  blood_loss: 4,
  unconscious: 3,
  limb_loss: 2,
};

export const demoHospitals: Hospital[] = [
  { id: 'DH1', scenario_id: 'demo-scenario', name: 'Demo Hospital 1 (No Blood)', lat: 19.115, lng: 72.840, icu_beds: 3, blood_units: 0, ventilators: 2, general_beds: 3, created_at: '2026-01-01' },
  { id: 'DH2', scenario_id: 'demo-scenario', name: 'Demo Hospital 2 (No ICU)', lat: 19.105, lng: 72.865, icu_beds: 0, blood_units: 3, ventilators: 1, general_beds: 4, created_at: '2026-01-01' },
  { id: 'DH3', scenario_id: 'demo-scenario', name: 'Demo Hospital 3 (Plenty)', lat: 19.090, lng: 72.845, icu_beds: 5, blood_units: 6, ventilators: 4, general_beds: 10, created_at: '2026-01-01' },
  { id: 'DH4', scenario_id: 'demo-scenario', name: 'Demo Hospital 4 (Small)', lat: 19.095, lng: 72.830, icu_beds: 1, blood_units: 1, ventilators: 1, general_beds: 2, created_at: '2026-01-01' },
];

export const demoAmbulances: Ambulance[] = [
  { id: 'A1', scenario_id: 'demo-scenario', label: 'Synthetic A1', capacity: 2, base_lat: 19.115, base_lng: 72.840, created_at: '2026-01-01', available: true },
  { id: 'A2', scenario_id: 'demo-scenario', label: 'Synthetic A2', capacity: 2, base_lat: 19.105, base_lng: 72.865, created_at: '2026-01-01', available: true },
  { id: 'A3', scenario_id: 'demo-scenario', label: 'Synthetic A3', capacity: 2, base_lat: 19.090, base_lng: 72.845, created_at: '2026-01-01', available: true },
  { id: 'A4', scenario_id: 'demo-scenario', label: 'Synthetic A4', capacity: 2, base_lat: 19.095, base_lng: 72.830, created_at: '2026-01-01', available: true },
];
