// @vitest-environment jsdom
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SimulationView } from '../src/pages/SimulationView';
import { demoScenario, demoHospitals, demoAmbulances } from '../src/lib/demoScenario';
import { loadVileParleGraph } from '../src/sim/graph';

// Mock the canvas/leaflet stuff
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

test('clicking Compare policies', async () => {
  await loadVileParleGraph();
  
  // Create a wrapper component to pass the roadGraph which is usually set asynchronously
  render(
    <SimulationView
      title={demoScenario.title}
      scenario={demoScenario}
      hospitals={demoHospitals}
      ambulances={demoAmbulances}
    />
  );
  
  // SimulationView fetches road graph internally in a useEffect, we need to wait for it.
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /Compare policies/i }).length).toBeGreaterThan(0);
  }, { timeout: 2000 });
  
  const compareBtn = screen.getAllByRole('button', { name: /Compare policies/i })[0];
  
  // mock window.alert
  vi.spyOn(window, 'alert').mockImplementation(() => {});

  await act(async () => {
    fireEvent.click(compareBtn);
  });
  
  console.log("Button clicked!");
  
  await waitFor(() => {
    const isComparing = screen.queryByText('Comparing...');
    const hasTable = screen.queryByText('Policy Comparison');
    
    if (isComparing) console.log("Still Comparing...");
    else if (hasTable) console.log("Has Table!");
    
    expect(!isComparing).toBe(true);
    expect(hasTable).toBeTruthy();
  }, { timeout: 15000 });
}, 20000);

