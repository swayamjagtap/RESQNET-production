import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, Scenario } from '../lib/supabase';
import { ConfigNotice } from '../components/ConfigNotice';

export const WorkspacePage: React.FC = () => {
  const { user, loading: authLoading, isConfigured } = useAuth();

  const [titleInput, setTitleInput] = useState<string>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    if (!supabase || !user) return;
    setFetching(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMessage(`Failed to fetch scenarios: ${error.message}`);
      } else {
        setScenarios(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while loading scenarios.';
      setErrorMessage(msg);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isConfigured) {
      fetchScenarios();
    } else {
      setFetching(false);
    }
  }, [user, isConfigured, fetchScenarios]);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedTitle = titleInput.trim();

    if (!trimmedTitle) {
      setErrorMessage('Scenario title cannot be empty.');
      return;
    }

    if (trimmedTitle.length > 255) {
      setErrorMessage('Scenario title must be 255 characters or fewer.');
      return;
    }

    if (!supabase || !user) {
      setErrorMessage('User session or Supabase client unavailable.');
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from('scenarios')
        .insert([
          {
            owner_id: user.id,
            title: trimmedTitle,
          },
        ]);

      if (error) {
        setErrorMessage(`Failed to create scenario draft: ${error.message}`);
      } else {
        setSuccessMessage(`Scenario draft "${trimmedTitle}" successfully created.`);
        setTitleInput('');
        await fetchScenarios();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while creating scenario.';
      setErrorMessage(msg);
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="main-content">
        <ConfigNotice />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You must be signed in to access the RESQNET Workspace and manage scenario drafts.
          </p>
          <Link to="/login" className="btn btn-primary">
            Sign In to Continue →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>
          Disaster Scenario Workspace
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Create and manage response scenario drafts backed by RLS-protected database tables.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Create Scenario Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>➕</span> Create Draft Scenario
          </h2>

          {errorMessage && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateScenario}>
            <div className="form-group">
              <label className="form-label" htmlFor="scenario-title">Scenario Title</label>
              <input
                id="scenario-title"
                type="text"
                className="form-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g., Vile Parle East Flood Relief & Evacuation Route A"
                maxLength={255}
                required
                disabled={creating}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                {titleInput.trim().length} / 255 characters
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating || !titleInput.trim()}>
              {creating ? (
                <>
                  <span className="spinner"></span>
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <span>Save Draft Scenario</span>
              )}
            </button>
          </form>
        </div>

        {/* Saved Scenarios List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📂</span> Saved Draft Scenarios
            </h2>
            <button 
              onClick={fetchScenarios} 
              className="btn btn-secondary" 
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              disabled={fetching}
            >
              {fetching ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {fetching ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
            </div>
          ) : scenarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No scenario drafts found.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Enter a title above and save your first draft scenario.
              </p>
            </div>
          ) : (
            <div className="scenarios-list">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="scenario-item">
                  <div className="scenario-info">
                    <span className="scenario-title">{scenario.title}</span>
                    <span className="scenario-meta">
                      ID: {scenario.id} • Created: {new Date(scenario.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>Draft</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
