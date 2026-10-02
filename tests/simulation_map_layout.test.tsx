// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SimulationPage Layout Guards', () => {
  it('source has explicit height, div wrapper, and leaflet css import', () => {
    const pagePath = path.join(__dirname, '../src/pages/SimulationView.tsx');
    const sourceCode = fs.readFileSync(pagePath, 'utf8');
    
    // 1. Explicit clamp height for the map container wrapper
    expect(sourceCode).toMatch(/clamp\(460px,\s*72vh,\s*700px\)/);
    // 2. Uses a plain div with flex direction to avoid Card body collapsing height to 0
    expect(sourceCode).toMatch(/<div[^>]*className="[^"]*sim-map-col[^"]*"[^>]*>/);
    expect(sourceCode).not.toMatch(/<Card[^>]*className="[^"]*sim-map-col[^"]*"[^>]*>/);
    // 3. Leaflet CSS is imported
    expect(sourceCode).toMatch(/import\s+['"]leaflet\/dist\/leaflet\.css['"]/);
  });
});
