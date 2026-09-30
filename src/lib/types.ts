/**
 * Shared TypeScript types for RESQNET domain entities.
 * These mirror the Supabase public schema; keep in sync with migrations.
 */

export const DISASTER_TYPES = [
  'building_collapse',
  'flood',
  'fire',
  'road_accident',
  'earthquake',
  'other',
] as const;

export type DisasterType = (typeof DISASTER_TYPES)[number];

export interface Scenario {
  id: string;
  owner_id: string;
  title: string;
  disaster_type: DisasterType;
  incident_lat: number | null;
  incident_lng: number | null;
  updated_at: string;
  created_at: string;
  // Synthetic / illustrative casualty counts – NOT real patient records
  fracture: number;
  blood_loss: number;
  unconscious: number;
  limb_loss: number;
}

/** Fields writable by the user when editing a scenario. */
export type ScenarioUpdate = Partial<
  Pick<
    Scenario,
    | 'title'
    | 'disaster_type'
    | 'incident_lat'
    | 'incident_lng'
    | 'fracture'
    | 'blood_loss'
    | 'unconscious'
    | 'limb_loss'
  >
>;

/** Synthetic / illustrative hospital resource record. */
export interface Hospital {
  id: string;
  scenario_id: string;
  name: string;
  lat: number;
  lng: number;
  icu_beds: number;
  blood_units: number;
  ventilators: number;
  general_beds: number;
  created_at: string;
}

export type HospitalInsert = Omit<Hospital, 'id' | 'created_at'>;
export type HospitalUpdate = Partial<Omit<Hospital, 'id' | 'scenario_id' | 'created_at'>>;

/** Synthetic / illustrative ambulance record. */
export interface Ambulance {
  id: string;
  scenario_id: string;
  label: string;
  base_lat: number;
  base_lng: number;
  capacity: number;
  available: boolean;
  created_at: string;
}

export type AmbulanceInsert = Omit<Ambulance, 'id' | 'created_at'>;
export type AmbulanceUpdate = Partial<Omit<Ambulance, 'id' | 'scenario_id' | 'created_at'>>;
