import { describe, it, expect } from 'vitest';
import {
  validateScenarioTitle,
  validateDisasterType,
  validateLat,
  validateLng,
  validateCasualtyCount,
  validateHospitalName,
  validateRequiredLat,
  validateRequiredLng,
  validateInventory,
  validateAmbulanceLabel,
  validateAmbulanceCapacity,
} from '../src/lib/validators';

// ─── validateScenarioTitle ────────────────────────────────────────────────────

describe('validateScenarioTitle', () => {
  it('returns null for a valid title', () => {
    expect(validateScenarioTitle('Vile Parle Flood')).toBeNull();
  });

  it('errors on blank string', () => {
    expect(validateScenarioTitle('')).not.toBeNull();
    expect(validateScenarioTitle('   ')).not.toBeNull();
  });

  it('errors when length exceeds 255', () => {
    expect(validateScenarioTitle('a'.repeat(256))).not.toBeNull();
  });

  it('allows exactly 255 characters', () => {
    expect(validateScenarioTitle('a'.repeat(255))).toBeNull();
  });
});

// ─── validateDisasterType ─────────────────────────────────────────────────────

describe('validateDisasterType', () => {
  it('accepts a non-empty string', () => {
    expect(validateDisasterType('flood')).toBeNull();
  });

  it('errors on empty string', () => {
    expect(validateDisasterType('')).not.toBeNull();
    expect(validateDisasterType('   ')).not.toBeNull();
  });
});

// ─── validateLat ─────────────────────────────────────────────────────────────

describe('validateLat', () => {
  it('accepts null/empty (nullable field)', () => {
    expect(validateLat(null)).toBeNull();
    expect(validateLat('')).toBeNull();
    expect(validateLat(undefined)).toBeNull();
  });

  it('accepts valid lat in range', () => {
    expect(validateLat(19.1136)).toBeNull();
    expect(validateLat(-90)).toBeNull();
    expect(validateLat(90)).toBeNull();
  });

  it('errors when out of range', () => {
    expect(validateLat(90.001)).not.toBeNull();
    expect(validateLat(-90.001)).not.toBeNull();
  });

  it('errors on non-numeric string', () => {
    expect(validateLat('abc')).not.toBeNull();
  });
});

// ─── validateLng ─────────────────────────────────────────────────────────────

describe('validateLng', () => {
  it('accepts null/empty (nullable field)', () => {
    expect(validateLng(null)).toBeNull();
    expect(validateLng('')).toBeNull();
  });

  it('accepts valid lng in range', () => {
    expect(validateLng(72.8697)).toBeNull();
    expect(validateLng(-180)).toBeNull();
    expect(validateLng(180)).toBeNull();
  });

  it('errors when out of range', () => {
    expect(validateLng(180.001)).not.toBeNull();
    expect(validateLng(-180.001)).not.toBeNull();
  });

  it('errors on non-numeric string', () => {
    expect(validateLng('xyz')).not.toBeNull();
  });
});

// ─── validateCasualtyCount ────────────────────────────────────────────────────

describe('validateCasualtyCount', () => {
  it('accepts zero', () => {
    expect(validateCasualtyCount(0, 'Fracture')).toBeNull();
    expect(validateCasualtyCount('0', 'Fracture')).toBeNull();
  });

  it('accepts max value 200', () => {
    expect(validateCasualtyCount(200, 'Fracture')).toBeNull();
  });

  it('errors on negative', () => {
    expect(validateCasualtyCount(-1, 'Fracture')).not.toBeNull();
  });

  it('errors above 200', () => {
    expect(validateCasualtyCount(201, 'Fracture')).not.toBeNull();
  });

  it('errors on decimal', () => {
    expect(validateCasualtyCount(1.5, 'Fracture')).not.toBeNull();
  });

  it('errors on non-numeric', () => {
    expect(validateCasualtyCount('abc', 'Fracture')).not.toBeNull();
  });
});

// ─── validateHospitalName ─────────────────────────────────────────────────────

describe('validateHospitalName', () => {
  it('accepts a valid name', () => {
    expect(validateHospitalName('VP Civic Hospital')).toBeNull();
  });

  it('errors on blank', () => {
    expect(validateHospitalName('')).not.toBeNull();
    expect(validateHospitalName('   ')).not.toBeNull();
  });

  it('errors when length exceeds 255', () => {
    expect(validateHospitalName('x'.repeat(256))).not.toBeNull();
  });
});

// ─── validateRequiredLat / validateRequiredLng ────────────────────────────────

describe('validateRequiredLat', () => {
  it('errors on empty string (required)', () => {
    expect(validateRequiredLat('')).not.toBeNull();
  });

  it('accepts 0 (equator)', () => {
    expect(validateRequiredLat(0)).toBeNull();
  });

  it('errors out of range', () => {
    expect(validateRequiredLat(91)).not.toBeNull();
    expect(validateRequiredLat(-91)).not.toBeNull();
  });
});

describe('validateRequiredLng', () => {
  it('errors on empty string (required)', () => {
    expect(validateRequiredLng('')).not.toBeNull();
  });

  it('errors out of range', () => {
    expect(validateRequiredLng(181)).not.toBeNull();
  });

  it('accepts valid longitude', () => {
    expect(validateRequiredLng(72.8697)).toBeNull();
  });
});

// ─── validateInventory ────────────────────────────────────────────────────────

describe('validateInventory', () => {
  it('accepts zero', () => {
    expect(validateInventory(0, 'ICU beds')).toBeNull();
  });

  it('errors on negative', () => {
    expect(validateInventory(-1, 'ICU beds')).not.toBeNull();
  });

  it('errors on decimal', () => {
    expect(validateInventory(2.5, 'ICU beds')).not.toBeNull();
  });

  it('accepts large integer', () => {
    expect(validateInventory(9999, 'General beds')).toBeNull();
  });
});

// ─── validateAmbulanceLabel ───────────────────────────────────────────────────

describe('validateAmbulanceLabel', () => {
  it('accepts a valid label', () => {
    expect(validateAmbulanceLabel('AMB-VP-01')).toBeNull();
  });

  it('errors on blank', () => {
    expect(validateAmbulanceLabel('')).not.toBeNull();
    expect(validateAmbulanceLabel('   ')).not.toBeNull();
  });

  it('errors when longer than 64 characters', () => {
    expect(validateAmbulanceLabel('x'.repeat(65))).not.toBeNull();
  });

  it('allows exactly 64 characters', () => {
    expect(validateAmbulanceLabel('x'.repeat(64))).toBeNull();
  });
});

// ─── validateAmbulanceCapacity ────────────────────────────────────────────────

describe('validateAmbulanceCapacity', () => {
  it('accepts valid capacity', () => {
    expect(validateAmbulanceCapacity(2)).toBeNull();
    expect(validateAmbulanceCapacity(20)).toBeNull();
  });

  it('errors on zero', () => {
    expect(validateAmbulanceCapacity(0)).not.toBeNull();
  });

  it('errors on negative', () => {
    expect(validateAmbulanceCapacity(-1)).not.toBeNull();
  });

  it('errors above 20', () => {
    expect(validateAmbulanceCapacity(21)).not.toBeNull();
  });

  it('errors on decimal', () => {
    expect(validateAmbulanceCapacity(1.5)).not.toBeNull();
  });

  it('errors on non-numeric', () => {
    expect(validateAmbulanceCapacity('two')).not.toBeNull();
  });
});
