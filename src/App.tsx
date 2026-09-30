import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ScenarioDetailPage } from './pages/ScenarioDetailPage';
import { SimulationPage } from './pages/SimulationPage';
import { GraphPreviewPage } from './pages/GraphPreviewPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/workspace/:scenarioId" element={<ScenarioDetailPage />} />
            <Route path="/workspace/:scenarioId/simulate" element={<SimulationPage />} />
            <Route path="/graph-preview" element={<GraphPreviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <footer className="footer">
            <p>RESQNET Prototype • Problem Statement EL-02 • Team No Free Lunch</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
