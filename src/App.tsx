import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import { Navbar } from './components/Navbar';
import { SiteFooter } from './components/SiteFooter';

import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ScenarioDetailPage } from './pages/ScenarioDetailPage';
import { SimulationPage } from './pages/SimulationPage';
import { GraphPreviewPage } from './pages/GraphPreviewPage';
import { DemoPage } from './pages/DemoPage';

import './styles/site-shell.css';

const WhyPage = React.lazy(() =>
  import('./pages/WhyPage').then((module) => ({
    default: module.WhyPage,
  })),
);

const HowItWorksPage = React.lazy(() =>
  import('./pages/HowItWorksPage').then((module) => ({
    default: module.HowItWorksPage,
  })),
);

const EvidencePage = React.lazy(() =>
  import('./pages/EvidencePage').then((module) => ({
    default: module.EvidencePage,
  })),
);

const RoadmapPage = React.lazy(() =>
  import('./pages/RoadmapPage').then((module) => ({
    default: module.RoadmapPage,
  })),
);

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />

        <div className="app-container">
          <Navbar />

          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/login"
              element={<AuthPage />}
            />

            <Route
              path="/workspace"
              element={<WorkspacePage />}
            />

            <Route
              path="/workspace/:scenarioId"
              element={<ScenarioDetailPage />}
            />

            <Route
              path="/workspace/:scenarioId/simulate"
              element={<SimulationPage />}
            />

            <Route
              path="/graph-preview"
              element={<GraphPreviewPage />}
            />

            <Route
              path="/demo"
              element={<DemoPage />}
            />

            <Route
              path="/why"
              element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <WhyPage />
                </React.Suspense>
              }
            />

            <Route
              path="/how-it-works"
              element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <HowItWorksPage />
                </React.Suspense>
              }
            />

            <Route
              path="/evidence"
              element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <EvidencePage />
                </React.Suspense>
              }
            />

            <Route
              path="/roadmap"
              element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <RoadmapPage />
                </React.Suspense>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>

          <SiteFooter />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;