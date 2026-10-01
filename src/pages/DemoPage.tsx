import React from 'react';
import { Link } from 'react-router-dom';
import { SimulationView } from './SimulationView';
import { demoScenario, demoHospitals, demoAmbulances } from '../lib/demoScenario';

export const DemoPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
        <span><strong>Demo scenario.</strong> All hospitals, ambulances and patients are synthetic. <Link to="/login" style={{ color: 'white', textDecoration: 'underline' }}>Sign in</Link> to build your own scenario.</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/workspace" style={{ color: 'white', textDecoration: 'underline' }}>Workspace</Link>
          <a href="https://amolewmjw.github.io/RESQNET/" target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Original schematic simulator</a>
        </div>
      </div>
      <SimulationView 
        title={demoScenario.title}
        scenario={demoScenario}
        hospitals={demoHospitals}
        ambulances={demoAmbulances}
      />
    </div>
  );
};
