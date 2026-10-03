import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import type { Scenario } from '../lib/types';

import { validateScenarioTitle } from '../lib/validators';
import { ConfigNotice } from '../components/ConfigNotice';

const gradientTextStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 52%, #f43f5e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const formatDisasterType = (value: string | null | undefined) => {
  if (!value) return 'Draft';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
};

export const WorkspacePage: React.FC = () => {
  const {
    user,
    loading: authLoading,
    isConfigured,
  } = useAuth();

  const [titleInput, setTitleInput] = useState<string>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [fetching, setFetching] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [titleError, setTitleError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

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
        setErrorMessage(
          `Failed to fetch scenarios: ${error.message}`,
        );
      } else {
        setScenarios((data ?? []) as Scenario[]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while loading scenarios.';

      setErrorMessage(message);
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

  const handleCreateScenario = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);
    setTitleError(null);

    const validationError =
      validateScenarioTitle(titleInput);

    if (validationError) {
      setTitleError(validationError);
      return;
    }

    const trimmedTitle = titleInput.trim();

    if (!supabase || !user) {
      setErrorMessage(
        'User session or Supabase client unavailable.',
      );
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
        setErrorMessage(
          `Failed to create scenario draft: ${error.message}`,
        );
      } else {
        setSuccessMessage(
          `Scenario draft "${trimmedTitle}" created.`,
        );

        setTitleInput('');

        await fetchScenarios();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while creating scenario.';

      setErrorMessage(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteScenario = async (
    id: string,
    title: string,
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete draft scenario "${title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    if (!supabase || !user) {
      setErrorMessage(
        'User session or Supabase client unavailable.',
      );
      return;
    }

    setDeletingId(id);

    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);

      if (error) {
        setErrorMessage(
          `Failed to delete scenario: ${error.message}`,
        );
      } else {
        setSuccessMessage(
          `Scenario "${title}" deleted.`,
        );

        await fetchScenarios();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting scenario.';

      setErrorMessage(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="workspace-loading">
        <div className="spinner workspace-loading-spinner" />
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
      <main className="workspace-page">
        <div className="workspace-auth-required">
          <div className="workspace-auth-icon">
            <span>R</span>
          </div>

          <h1>Workspace access requires sign in.</h1>

          <p>
            Sign in to create, save and manage your own RESQNET
            disaster-response scenarios.
          </p>

          <Link
            to="/login"
            className="btn btn-primary"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  const firstName =
    user.email?.split('@')[0] ?? 'operator';

  return (
    <main className="workspace-page">
      <style>
        {`
          .workspace-page {
            width: min(100% - 3rem, 1180px);
            margin: 0 auto;
            padding: 3.4rem 0 5rem;
          }

          .workspace-loading {
            min-height: 420px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .workspace-loading-spinner {
            width: 32px;
            height: 32px;
          }

          .workspace-top {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;

            gap: 2rem;

            margin-bottom: 2.4rem;
          }

          .workspace-eyebrow {
            margin-bottom: 0.7rem;

            color: #38bdf8;

            font-size: 0.72rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .workspace-title {
            margin: 0;

            color: #f8fafc;

            font-size: 2.75rem;
            line-height: 1.06;
            letter-spacing: -0.04em;
          }

          .workspace-title span {
            ${Object.entries(gradientTextStyle)
            .map(([key, value]) => {
              const cssKey = key
                .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
                .replace('webkit-', '-webkit-');

              return `${cssKey}: ${String(value)};`;
            })
            .join('\n')}
          }

          .workspace-subtitle {
            max-width: 640px;

            margin: 0.8rem 0 0;

            color: #8fa0b6;

            font-size: 1rem;
            line-height: 1.7;
          }

          .workspace-summary {
            display: flex;
            align-items: center;

            gap: 0.7rem;

            flex-wrap: wrap;
          }

          .workspace-summary-chip {
            min-height: 38px;

            display: inline-flex;
            align-items: center;

            gap: 0.45rem;

            padding: 0 0.85rem;

            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 999px;

            background: rgba(15, 23, 42, 0.44);

            color: #aebbd0;

            font-size: 0.75rem;
            font-weight: 700;
          }

          .workspace-summary-chip strong {
            color: #f8fafc;
          }

          .workspace-alert {
            margin-bottom: 1.25rem;

            padding: 0.9rem 1rem;

            border-radius: 11px;

            font-size: 0.82rem;
            line-height: 1.5;
          }

          .workspace-alert-error {
            color: #fecdd3;

            border: 1px solid rgba(244, 63, 94, 0.24);

            background: rgba(244, 63, 94, 0.06);
          }

          .workspace-alert-success {
            color: #bae6fd;

            border: 1px solid rgba(56, 189, 248, 0.22);

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.07),
                rgba(139, 92, 246, 0.04)
              );
          }

          .workspace-grid {
            display: grid;
            grid-template-columns:
              minmax(320px, 0.8fr)
              minmax(0, 1.6fr);

            gap: 1.35rem;

            align-items: start;
          }

          .workspace-panel {
            border: 1px solid rgba(148, 163, 184, 0.14);
            border-radius: 16px;

            background:
              linear-gradient(
                180deg,
                rgba(17, 27, 45, 0.88),
                rgba(13, 21, 36, 0.92)
              );

            box-shadow:
              0 20px 60px rgba(0, 0, 0, 0.12);
          }

          .workspace-create {
            position: sticky;
            top: 104px;

            overflow: hidden;
          }

          .workspace-create::before {
            content: '';

            position: absolute;

            top: 0;
            left: 0;
            right: 0;

            height: 2px;

            background:
              linear-gradient(
                90deg,
                #38bdf8,
                #8b5cf6,
                #f43f5e
              );
          }

          .workspace-panel-inner {
            padding: 1.55rem;
          }

          .workspace-panel-label {
            margin-bottom: 0.55rem;

            color: #38bdf8;

            font-size: 0.68rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .workspace-panel h2 {
            margin: 0;

            color: #f8fafc;

            font-size: 1.35rem;
            line-height: 1.25;
          }

          .workspace-panel-copy {
            margin: 0.6rem 0 1.35rem;

            color: #7f8da3;

            font-size: 0.83rem;
            line-height: 1.55;
          }

          .workspace-form-label {
            display: block;

            margin-bottom: 0.5rem;

            color: #afbdd0;

            font-size: 0.77rem;
            font-weight: 700;
          }

          .workspace-form-input {
            width: 100%;
            min-height: 48px;

            box-sizing: border-box;

            padding: 0 0.9rem;

            color: #f8fafc;

            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 10px;

            outline: none;

            background: rgba(7, 13, 24, 0.36);

            font-family: inherit;
            font-size: 0.88rem;

            transition:
              border-color 150ms ease,
              box-shadow 150ms ease,
              background 150ms ease;
          }

          .workspace-form-input::placeholder {
            color: #506078;
          }

          .workspace-form-input:focus {
            border-color: rgba(56, 189, 248, 0.46);

            background: rgba(7, 13, 24, 0.54);

            box-shadow:
              0 0 0 3px rgba(56, 189, 248, 0.07);
          }

          .workspace-form-input.input-error {
            border-color: rgba(244, 63, 94, 0.48);
          }

          .workspace-form-meta {
            display: flex;
            justify-content: space-between;

            gap: 1rem;

            margin-top: 0.45rem;
          }

          .workspace-field-error {
            color: #fb7185;

            font-size: 0.72rem;
          }

          .workspace-counter {
            margin-left: auto;

            color: #526177;

            font-size: 0.68rem;
          }

          .workspace-create-button {
            width: 100%;
            min-height: 46px;

            margin-top: 1.25rem;

            border: 0;
            border-radius: 10px;

            color: #07111d;

            background:
              linear-gradient(
                90deg,
                #38bdf8,
                #69c7f3 38%,
                #8b5cf6
              );

            font-family: inherit;
            font-size: 0.85rem;
            font-weight: 800;

            cursor: pointer;

            transition:
              transform 150ms ease,
              filter 150ms ease;
          }

          .workspace-create-button:hover:not(:disabled) {
            transform: translateY(-1px);

            filter: brightness(1.05);
          }

          .workspace-create-button:disabled {
            opacity: 0.5;

            cursor: not-allowed;
          }

          .workspace-list-panel {
            min-width: 0;
          }

          .workspace-list-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 1rem;

            padding: 1.55rem;

            border-bottom: 1px solid rgba(148, 163, 184, 0.11);
          }

          .workspace-list-header-copy {
            min-width: 0;
          }

          .workspace-refresh {
            min-height: 36px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 0.8rem;

            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 8px;

            color: #c2cede;

            background: rgba(255, 255, 255, 0.035);

            font-family: inherit;
            font-size: 0.74rem;
            font-weight: 700;

            cursor: pointer;
          }

          .workspace-refresh:hover:not(:disabled) {
            border-color: rgba(56, 189, 248, 0.3);

            background: rgba(56, 189, 248, 0.06);
          }

          .workspace-refresh:disabled {
            opacity: 0.55;
          }

          .workspace-list {
            display: grid;

            gap: 0.8rem;

            padding: 1rem;
          }

          .workspace-scenario {
            position: relative;

            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;

            gap: 1rem;

            align-items: center;

            padding: 1.15rem;

            overflow: hidden;

            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 12px;

            background: rgba(8, 15, 27, 0.36);

            transition:
              border-color 150ms ease,
              background 150ms ease,
              transform 150ms ease;
          }

          .workspace-scenario::before {
            content: '';

            position: absolute;

            top: 0;
            bottom: 0;
            left: 0;

            width: 2px;

            opacity: 0;

            background:
              linear-gradient(
                180deg,
                #38bdf8,
                #8b5cf6,
                #f43f5e
              );

            transition: opacity 150ms ease;
          }

          .workspace-scenario:hover {
            border-color: rgba(56, 189, 248, 0.24);

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.045),
                rgba(139, 92, 246, 0.025)
              );

            transform: translateY(-1px);
          }

          .workspace-scenario:hover::before {
            opacity: 1;
          }

          .workspace-scenario-content {
            min-width: 0;
          }

          .workspace-scenario-topline {
            display: flex;
            align-items: center;

            gap: 0.55rem;

            flex-wrap: wrap;
          }

          .workspace-scenario-title {
            overflow: hidden;

            color: #f8fafc;

            text-decoration: none;

            font-size: 0.98rem;
            font-weight: 750;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .workspace-scenario-title:hover {
            color: #7dd3fc;
          }

          .workspace-status {
            display: inline-flex;
            align-items: center;

            min-height: 22px;

            padding: 0 0.5rem;

            border: 1px solid rgba(56, 189, 248, 0.16);
            border-radius: 999px;

            color: #7dd3fc;

            background: rgba(56, 189, 248, 0.055);

            font-size: 0.62rem;
            font-weight: 800;

            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .workspace-scenario-meta {
            display: flex;
            align-items: center;

            gap: 0.55rem;

            flex-wrap: wrap;

            margin-top: 0.45rem;

            color: #607087;

            font-size: 0.72rem;
          }

          .workspace-meta-dot {
            color: #334155;
          }

          .workspace-scenario-actions {
            display: flex;
            align-items: center;

            gap: 0.5rem;
          }

          .workspace-open-button,
          .workspace-delete-button {
            min-height: 34px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 0.75rem;

            border-radius: 8px;

            font-family: inherit;
            font-size: 0.73rem;
            font-weight: 750;

            text-decoration: none;

            cursor: pointer;
          }

          .workspace-open-button {
            color: #e8eef7;

            border: 1px solid rgba(148, 163, 184, 0.17);

            background: rgba(255, 255, 255, 0.04);
          }

          .workspace-open-button:hover {
            border-color: rgba(56, 189, 248, 0.32);

            background: rgba(56, 189, 248, 0.07);
          }

          .workspace-delete-button {
            color: #fb7185;

            border: 1px solid rgba(244, 63, 94, 0.18);

            background: rgba(244, 63, 94, 0.035);
          }

          .workspace-delete-button:hover:not(:disabled) {
            color: #fecdd3;

            border-color: rgba(244, 63, 94, 0.33);

            background: rgba(244, 63, 94, 0.075);
          }

          .workspace-delete-button:disabled {
            opacity: 0.55;
          }

          .workspace-empty {
            margin: 1rem;

            padding: 3rem 1rem;

            text-align: center;

            border: 1px dashed rgba(148, 163, 184, 0.17);
            border-radius: 12px;

            background: rgba(8, 15, 27, 0.25);
          }

          .workspace-empty-mark {
            width: 44px;
            height: 44px;

            margin: 0 auto 1rem;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 12px;

            color: #38bdf8;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.08),
                rgba(139, 92, 246, 0.08)
              );

            font-size: 1.1rem;
            font-weight: 850;
          }

          .workspace-empty h3 {
            margin: 0;

            color: #dfe7f1;

            font-size: 1rem;
          }

          .workspace-empty p {
            margin: 0.45rem auto 0;

            max-width: 420px;

            color: #64748b;

            font-size: 0.8rem;
            line-height: 1.55;
          }

          .workspace-fetching {
            min-height: 180px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .workspace-auth-required {
            max-width: 560px;

            margin: 5rem auto;

            padding: 2.5rem;

            text-align: center;

            border: 1px solid rgba(148, 163, 184, 0.14);
            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.05),
                rgba(139, 92, 246, 0.05)
              );
          }

          .workspace-auth-icon {
            width: 48px;
            height: 48px;

            margin: 0 auto 1.2rem;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 13px;

            color: #f8fafc;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.12),
                rgba(139, 92, 246, 0.12),
                rgba(244, 63, 94, 0.08)
              );

            font-weight: 850;
          }

          .workspace-auth-required h1 {
            margin: 0;

            font-size: 1.7rem;
          }

          .workspace-auth-required p {
            margin: 0.8rem auto 1.5rem;

            color: #8090a6;

            line-height: 1.6;
          }

          @media (max-width: 950px) {
            .workspace-grid {
              grid-template-columns: 1fr;
            }

            .workspace-create {
              position: static;
            }

            .workspace-top {
              align-items: flex-start;
              flex-direction: column;
            }
          }

          @media (max-width: 650px) {
            .workspace-page {
              width: calc(100% - 2rem);

              padding-top: 2.4rem;
            }

            .workspace-title {
              font-size: 2.15rem;
            }

            .workspace-scenario {
              grid-template-columns: 1fr;
            }

            .workspace-scenario-actions {
              justify-content: flex-start;
            }

            .workspace-list-header {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <header className="workspace-top">
        <div>
          <div className="workspace-eyebrow">
            Response workspace
          </div>

          <h1 className="workspace-title">
            Your disaster-response
            <br />
            <span>scenario workspace.</span>
          </h1>

          <p className="workspace-subtitle">
            Create response scenarios, configure their resources,
            and continue each one into the simulation workflow.
          </p>
        </div>

        <div className="workspace-summary">
          <div className="workspace-summary-chip">
            Signed in as <strong>{firstName}</strong>
          </div>

          <div className="workspace-summary-chip">
            Scenarios <strong>{scenarios.length}</strong>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div
          className="workspace-alert workspace-alert-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="workspace-alert workspace-alert-success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <div className="workspace-grid">
        {/* CREATE SCENARIO */}
        <section className="workspace-panel workspace-create">
          <div className="workspace-panel-inner">
            <div className="workspace-panel-label">
              New scenario
            </div>

            <h2>Create a response scenario</h2>

            <p className="workspace-panel-copy">
              Start with a name. You’ll configure the incident,
              casualties, hospitals and ambulances on the next screen.
            </p>

            <form
              onSubmit={handleCreateScenario}
              noValidate
            >
              <label
                className="workspace-form-label"
                htmlFor="scenario-title"
              >
                Scenario title
              </label>

              <input
                id="scenario-title"
                type="text"
                className={`workspace-form-input ${titleError ? 'input-error' : ''
                  }`}
                value={titleInput}
                onChange={(e) => {
                  setTitleInput(e.target.value);
                  setTitleError(null);
                }}
                placeholder="e.g. Vile Parle East Flood Response"
                maxLength={255}
                disabled={creating}
                aria-describedby={
                  titleError
                    ? 'scenario-title-error'
                    : undefined
                }
              />

              <div className="workspace-form-meta">
                <div>
                  {titleError && (
                    <span
                      id="scenario-title-error"
                      className="workspace-field-error"
                    >
                      {titleError}
                    </span>
                  )}
                </div>

                <span className="workspace-counter">
                  {titleInput.trim().length} / 255
                </span>
              </div>

              <button
                type="submit"
                className="workspace-create-button"
                disabled={
                  creating || !titleInput.trim()
                }
              >
                {creating
                  ? 'Creating scenario...'
                  : 'Create scenario'}
              </button>
            </form>
          </div>
        </section>

        {/* SAVED SCENARIOS */}
        <section className="workspace-panel workspace-list-panel">
          <div className="workspace-list-header">
            <div className="workspace-list-header-copy">
              <div className="workspace-panel-label">
                Saved scenarios
              </div>

              <h2>
                Continue an existing response
              </h2>

              <p
                className="workspace-panel-copy"
                style={{ marginBottom: 0 }}
              >
                Open a scenario to configure its incident,
                casualties, hospitals and ambulance fleet.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchScenarios}
              className="workspace-refresh"
              disabled={fetching}
            >
              {fetching
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </div>

          {fetching ? (
            <div className="workspace-fetching">
              <div
                className="spinner"
                style={{
                  width: '24px',
                  height: '24px',
                }}
              />
            </div>
          ) : scenarios.length === 0 ? (
            <div className="workspace-empty">
              <div className="workspace-empty-mark">
                +
              </div>

              <h3>No scenarios yet</h3>

              <p>
                Create your first scenario using the panel
                on the left. It will appear here once saved.
              </p>
            </div>
          ) : (
            <div className="workspace-list">
              {scenarios.map((scenario) => (
                <article
                  key={scenario.id}
                  className="workspace-scenario"
                >
                  <div className="workspace-scenario-content">
                    <div className="workspace-scenario-topline">
                      <Link
                        to={`/workspace/${scenario.id}`}
                        className="workspace-scenario-title"
                      >
                        {scenario.title}
                      </Link>

                      <span className="workspace-status">
                        {scenario.disaster_type
                          ? 'Configured'
                          : 'Draft'}
                      </span>
                    </div>

                    <div className="workspace-scenario-meta">
                      <span>
                        {formatDisasterType(
                          scenario.disaster_type,
                        )}
                      </span>

                      <span className="workspace-meta-dot">
                        •
                      </span>

                      <span>
                        Created{' '}
                        {formatDate(
                          scenario.created_at,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="workspace-scenario-actions">
                    <Link
                      to={`/workspace/${scenario.id}`}
                      className="workspace-open-button"
                      aria-label={`Open scenario ${scenario.title}`}
                    >
                      Configure →
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteScenario(
                          scenario.id,
                          scenario.title,
                        )
                      }
                      className="workspace-delete-button"
                      disabled={
                        deletingId === scenario.id
                      }
                      aria-label={`Delete scenario ${scenario.title}`}
                    >
                      {deletingId === scenario.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};