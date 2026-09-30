import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConfigNotice } from '../components/ConfigNotice';

export const HomePage: React.FC = () => {
  const { user, isConfigured } = useAuth();

  return (
    <div className="main-content">
      {!isConfigured && <ConfigNotice />}

      <section style={{ textAlign: 'center', padding: '3rem 0 2rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>
          <span>🛡️ Problem Statement EL-02</span>
          <span>•</span>
          <span>Team No Free Lunch</span>
        </div>

        <h1 className="hero-title">
          Disaster Response Coordination & <span className="gradient-text">Scenario Planning</span>
        </h1>
        
        <p className="hero-subtitle" style={{ margin: '0 auto 2rem auto' }}>
          RESQNET provides a foundation for high-efficiency emergency response simulation, custom disaster scenarios (Vile Parle East & West), resource allocation, and decision auditing.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {user ? (
            <Link to="/workspace" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
              Go to Workspace →
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
              Sign In to Access Workspace →
            </Link>
          )}
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📑</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 className="feature-title">Scenario Management</h3>
            <span className="badge badge-live">Live</span>
          </div>
          <p className="feature-desc">
            Create, store, and manage draft disaster scenarios backed by Supabase with Row-Level Security (RLS).
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 className="feature-title">Vile Parle Response Map</h3>
            <span className="badge badge-planned">Planned</span>
          </div>
          <p className="feature-desc">
            Spatial disaster mapping tailored for Vile Parle East & West emergency zones and relief corridors.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 className="feature-title">Simulation & Auditing</h3>
            <span className="badge badge-planned">Planned</span>
          </div>
          <p className="feature-desc">
            Real-time resource deployment simulator and immutable decision auditing log for emergency commanders.
          </p>
        </div>
      </section>
    </div>
  );
};
