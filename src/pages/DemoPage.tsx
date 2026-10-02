import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SimulationView } from './SimulationView';
import { demoScenario, demoHospitals, demoAmbulances, stressScenario, stressHospitals, stressAmbulances } from '../lib/demoScenario';

export const DemoPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'demo' | 'stress'>('demo');

  const currentScenario = selectedScenario === 'demo' ? demoScenario : stressScenario;
  const currentHospitals = selectedScenario === 'demo' ? demoHospitals : stressHospitals;
  const currentAmbulances = selectedScenario === 'demo' ? demoAmbulances : stressAmbulances;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
        <span><strong>Demo scenario.</strong> All hospitals, ambulances and patients are synthetic. <Link to="/login" style={{ color: 'white', textDecoration: 'underline' }}>Sign in</Link> to build your own scenario.</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={selectedScenario} 
            onChange={e => setSelectedScenario(e.target.value as 'demo' | 'stress')}
            style={{ color: '#000', padding: '0.2rem', borderRadius: '4px' }}
          >
            <option value="demo">Balanced scenario</option>
            <option value="stress">Resource-stress scenario</option>
          </select>
          <Link to="/workspace" style={{ color: 'white', textDecoration: 'underline' }}>Workspace</Link>
          <a href="https://amolewmjw.github.io/RESQNET/" target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Original schematic simulator</a>
        </div>
      </div>
      {selectedScenario === 'stress' && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.35rem 1rem', fontSize: '0.8rem', textAlign: 'center' }}>
          Resource-stress scenario: designed so the nearest hospital lacks critical stock, forcing a trade-off.
        </div>
      )}
      <SimulationView 
        key={selectedScenario}
        title={currentScenario.title}
        scenario={currentScenario}
        hospitals={currentHospitals}
        ambulances={currentAmbulances}
      />
    </div>
  );
};
