// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SimulationPage Layout', () => {
  it('gives the map wrapper an explicit clamp height to prevent collapsing', () => {
    const pagePath = path.join(__dirname, '../src/pages/SimulationPage.tsx');
    const sourceCode = fs.readFileSync(pagePath, 'utf8');
    
    // Assert that the clamp height is used for the map container
    expect(sourceCode).toMatch(/clamp\(420px,\s*62vh,\s*640px\)/);
  });
});
