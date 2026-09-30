/**
 * Client-side validators for RESQNET forms.
 * Each function returns null (valid) or a string error message.
 * These mirror database constraints in the SQL migration exactly.
 * They are pure functions with no side effects – safe to import in tests.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

// ─── Scenario ────────────────────────────────────────────────────────────────

export function validateScenarioTitle(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Title cannot be blank.';
  if (value.length > 255) return 'Title must be 255 characters or fewer.';
  return null;
}

export function validateDisasterType(value: string): string | null {
  if (value.trim().length === 0) return 'Disaster type cannot be blank.';
  return null;
}

export function validateLat(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null; // nullable
  const n = Number(value);
  if (isNaN(n)) return 'Latitude must be a number.';
  if (n < -90 || n > 90) return 'Latitude must be between -90 and 90.';
  return null;
}

export function validateLng(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null; // nullable
  const n = Number(value);
  if (isNaN(n)) return 'Longitude must be a number.';
  if (n < -180 || n > 180) return 'Longitude must be between -180 and 180.';
  return null;
}

/** Validates a synthetic casualty count (non-negative integer, max 200). */
export function validateCasualtyCount(
  value: string | number,
  fieldName: string,
): string | null {
  const n = Number(value);
  if (isNaN(n)) return `${fieldName} must be a whole number.`;
  if (!isInteger(n)) return `${fieldName} must be a whole number (no decimals).`;
  if (n < 0) return `${fieldName} cannot be negative.`;
  if (n > 200) return `${fieldName} cannot exceed 200.`;
  return null;
}

// ─── Hospital ────────────────────────────────────────────────────────────────

export function validateHospitalName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Hospital name cannot be blank.';
  if (value.length > 255) return 'Hospital name must be 255 characters or fewer.';
  return null;
}

/** Validates a required hospital lat/lng (not nullable). */
export function validateRequiredLat(value: string | number): string | null {
  const n = Number(value);
  if (value === '' || value === null || value === undefined) return 'Latitude is required.';
  if (isNaN(n)) return 'Latitude must be a number.';
  if (n < -90 || n > 90) return 'Latitude must be between -90 and 90.';
  return null;
}

export function validateRequiredLng(value: string | number): string | null {
  const n = Number(value);
  if (value === '' || value === null || value === undefined) return 'Longitude is required.';
  if (isNaN(n)) return 'Longitude must be a number.';
  if (n < -180 || n > 180) return 'Longitude must be between -180 and 180.';
  return null;
}

/** Validates a non-negative integer inventory count. */
export function validateInventory(
  value: string | number,
  fieldName: string,
): string | null {
  const n = Number(value);
  if (isNaN(n)) return `${fieldName} must be a whole number.`;
  if (!isInteger(n)) return `${fieldName} must be a whole number (no decimals).`;
  if (n < 0) return `${fieldName} cannot be negative.`;
  return null;
}

// ─── Ambulance ───────────────────────────────────────────────────────────────

export function validateAmbulanceLabel(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Label cannot be blank.';
  if (value.length > 64) return 'Label must be 64 characters or fewer.';
  return null;
}

export function validateAmbulanceCapacity(value: string | number): string | null {
  const n = Number(value);
  if (isNaN(n)) return 'Capacity must be a whole number.';
  if (!isInteger(n)) return 'Capacity must be a whole number (no decimals).';
  if (n <= 0) return 'Capacity must be at least 1.';
  if (n > 20) return 'Capacity cannot exceed 20.';
  return null;
}
