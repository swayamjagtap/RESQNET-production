// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { SimulationView } from '../src/pages/SimulationView';
import { demoScenario, demoHospitals, demoAmbulances } from '../src/lib/demoScenario';
import { loadVileParleGraph } from '../src/sim/graph';
import type { Ambulance } from '../src/lib/types';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div>{children}</div>,
  TileLayer: () => <div>TileLayer</div>,
  Marker: ({ children }: any) => <div>Marker {children}</div>,
  Tooltip: ({ children }: any) => <div>Tooltip {children}</div>,
  Polyline: () => <div>Polyline</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    getZoom: () => 14,
    getContainer: () => document.createElement('div'),
  }),
}));
vi.mock('leaflet', () => ({
  default: {
    marker: () => ({ addTo: () => ({ setOpacity: vi.fn(), remove: vi.fn(), setLatLng: vi.fn(), getElement: vi.fn() }) }),
    divIcon: () => ({}),
  }
}));
vi.mock('../src/components/RoadLayer', () => ({ RoadLayer: () => <div /> }));

describe('STEP 3 SimulationView verification tests in jsdom', () => {
  it('1. tablist keyboard behaviour', async () => {
    await loadVileParleGraph();
    render(
      <SimulationView
        title={demoScenario.title}
        scenario={demoScenario}
        hospitals={demoHospitals}
        ambulances={demoAmbulances}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeTruthy();
    });

    const tablist = screen.getByRole('tablist');
    const logTab = screen.getByRole('tab', { name: /Decision log/i });
    const compTab = screen.getByRole('tab', { name: /Policy comparison/i });
    const auditTab = screen.getByRole('tab', { name: /Ledger tools/i });

    expect(logTab.getAttribute('aria-selected')).toBe('true');

    // ArrowRight -> Policy comparison
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(compTab.getAttribute('aria-selected')).toBe('true');

    // ArrowRight -> Ledger tools
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(auditTab.getAttribute('aria-selected')).toBe('true');

    // ArrowLeft -> Policy comparison
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(compTab.getAttribute('aria-selected')).toBe('true');
  });

  it('2. side-panel structure (tab panel has the overflow-y auto class and min-height 0)', async () => {
    await loadVileParleGraph();
    const { container } = render(
      <SimulationView
        title={demoScenario.title}
        scenario={demoScenario}
        hospitals={demoHospitals}
        ambulances={demoAmbulances}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeTruthy();
    });

    const tabPanelContainer = container.querySelector('.tab-panel-container');
    expect(tabPanelContainer).not.toBeNull();
    expect(tabPanelContainer?.classList.contains('overflow-y-auto')).toBe(true);
    const style = (tabPanelContainer as HTMLElement).style;
    expect(style.minHeight).toBe('0px');
    expect(style.overflowY).toBe('auto');
  });

  it('3. fleet strip with 12 ambulances renders 12 rows', async () => {
    await loadVileParleGraph();
    const twelveAmbulances: Ambulance[] = Array.from({ length: 12 }, (_, i) => ({
      id: `amb-${i + 1}`,
      scenario_id: demoScenario.id,
      label: `Amb ${String(i + 1).padStart(3, '0')}`,
      base_lat: 19.0979,
      base_lng: 72.8481,
      capacity: 3,
      available: true,
      created_at: '2026-01-01',
    }));

    render(
      <SimulationView
        title={demoScenario.title}
        scenario={demoScenario}
        hospitals={demoHospitals}
        ambulances={twelveAmbulances}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Amb 001').length).toBeGreaterThan(0);
    });

    // Check that all 12 ambulance titles exist in fleet strip / side column
    for (let i = 1; i <= 12; i++) {
      const label = `Amb ${String(i).padStart(3, '0')}`;
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('4. stacked comparison blocks render computed note', async () => {
    await loadVileParleGraph();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <SimulationView
        title={demoScenario.title}
        scenario={demoScenario}
        hospitals={demoHospitals}
        ambulances={demoAmbulances}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Compare policies/i }).length).toBeGreaterThan(0);
    });

    const compareBtn = screen.getAllByRole('button', { name: /Compare policies/i })[0];
    await act(async () => {
      fireEvent.click(compareBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Differences reflect severity-first ordering/i)).toBeTruthy();
      expect(screen.getByText(/One synthetic scenario on the Vile Parle graph/i)).toBeTruthy();
    }, { timeout: 15000 });
  }, 20000);

  it('5. no emoji characters remain in simulation components', () => {
    const filesToCheck = [
      'src/pages/SimulationView.tsx',
      'src/components/Card.tsx',
      'src/components/SvgStepChart.tsx',
      'src/components/RoadLayer.tsx',
      'src/lib/audit.ts',
      'src/lib/dashboard-view.ts',
      'src/lib/event-display.ts',
      'src/lib/live-view.ts',
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    const matches: string[] = [];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(__dirname, '..', relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (emojiRegex.test(content)) {
          matches.push(relPath);
        }
      }
    }

    expect(matches).toEqual([]);
  });
});
