// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SimulationPage Style Variables', () => {
  it('source contains the layout variable --sim-h', () => {
    const pagePath = path.join(__dirname, '../src/pages/SimulationView.tsx');
    const sourceCode = fs.readFileSync(pagePath, 'utf8');
    
    // Assert that the clamp height is used for the map container
    expect(sourceCode).toMatch(/clamp\(460px,\s*72vh,\s*700px\)/);
  });
});
