import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ConfigNotice } from '../components/ConfigNotice';
import { ResqnetLogo } from '../components/ResqnetLogo';

const gradientTextStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 52%, #f43f5e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const AuthPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/workspace', { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setInfoMessage(null);

    if (!isConfigured || !supabase) {
      setErrorMessage(
        'Supabase is not configured yet. Please check environment variables.',
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setPending(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.user && !data.session) {
          setInfoMessage(
            'Registration started. Check your email and confirm your address before signing in.',
          );
        } else if (data.session) {
          navigate('/workspace', { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setErrorMessage(error.message);
        } else {
          navigate('/workspace', { replace: true });
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected authentication error occurred.';

      setErrorMessage(message);
    } finally {
      setPending(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="main-content">
        <ConfigNotice />
      </div>
    );
  }

  return (
    <main className="auth-page">
      <style>
        {`
          .auth-page {
            position: relative;
            overflow: hidden;
            min-height: calc(100vh - 76px);
            padding: 4.5rem 1.5rem 5rem;
          }

          .auth-page::before {
            content: '';
            position: absolute;
            width: 520px;
            height: 520px;
            left: -210px;
            top: -180px;
            border-radius: 999px;
            background: rgba(56, 189, 248, 0.10);
            filter: blur(95px);
            pointer-events: none;
          }

          .auth-page::after {
            content: '';
            position: absolute;
            width: 560px;
            height: 560px;
            right: -220px;
            bottom: -240px;
            border-radius: 999px;
            background:
              linear-gradient(
                135deg,
                rgba(139, 92, 246, 0.12),
                rgba(244, 63, 94, 0.09)
              );
            filter: blur(100px);
            pointer-events: none;
          }

          .auth-layout {
            position: relative;
            z-index: 1;

            width: min(100%, 1060px);
            margin: 0 auto;

            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.75fr);
            gap: 4rem;
            align-items: center;
          }

          .auth-story {
            max-width: 570px;
          }

          .auth-story-eyebrow {
            margin-bottom: 1.1rem;

            color: #38bdf8;

            font-size: 0.75rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .auth-story h1 {
            margin: 0;

            color: #f8fafc;

            font-size: 3.3rem;
            line-height: 1.04;
            letter-spacing: -0.045em;
          }

          .auth-story-copy {
            max-width: 520px;

            margin-top: 1.5rem;

            color: #94a3b8;

            font-size: 1.05rem;
            line-height: 1.75;
          }

          .auth-story-points {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));

            gap: 0.75rem;

            margin-top: 2rem;
          }

          .auth-story-point {
            min-height: 112px;

            padding: 1rem;

            border: 1px solid rgba(148, 163, 184, 0.13);
            border-radius: 12px;

            background: rgba(15, 23, 42, 0.42);
          }

          .auth-story-point-label {
            display: block;

            margin-bottom: 0.45rem;

            color: #38bdf8;

            font-size: 0.66rem;
            font-weight: 800;

            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .auth-story-point strong {
            color: #e7edf6;

            font-size: 0.88rem;
            line-height: 1.4;
          }

          .auth-panel {
            position: relative;

            padding: 1px;

            border-radius: 18px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.52),
                rgba(139, 92, 246, 0.38),
                rgba(244, 63, 94, 0.32)
              );

            box-shadow:
              0 28px 80px rgba(0, 0, 0, 0.28);
          }

          .auth-panel-inner {
            padding: 1.75rem;

            border-radius: 17px;

            background:
              linear-gradient(
                180deg,
                rgba(16, 25, 42, 0.98),
                rgba(12, 19, 32, 0.98)
              );
          }

          .auth-panel-brand {
            display: none;

            margin-bottom: 1.5rem;
          }

          .auth-panel-heading {
            margin-bottom: 1.5rem;
          }

          .auth-panel-heading h2 {
            margin: 0;

            color: #f8fafc;

            font-size: 1.55rem;
            line-height: 1.2;
          }

          .auth-panel-heading p {
            margin: 0.5rem 0 0;

            color: #7f8da3;

            font-size: 0.88rem;
            line-height: 1.55;
          }

          .auth-mode-switch {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));

            padding: 0.25rem;

            margin-bottom: 1.55rem;

            border: 1px solid rgba(148, 163, 184, 0.13);
            border-radius: 10px;

            background: rgba(5, 10, 19, 0.34);
          }

          .auth-mode-button {
            min-height: 42px;

            border: 0;
            border-radius: 8px;

            color: #7f8da3;

            background: transparent;

            font-family: inherit;
            font-size: 0.86rem;
            font-weight: 750;

            cursor: pointer;

            transition:
              color 150ms ease,
              background 150ms ease,
              box-shadow 150ms ease;
          }

          .auth-mode-button:hover {
            color: #f8fafc;
          }

          .auth-mode-button.is-active {
            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.13),
                rgba(139, 92, 246, 0.12)
              );

            box-shadow:
              inset 0 0 0 1px rgba(56, 189, 248, 0.18);
          }

          .auth-alert {
            display: flex;
            gap: 0.75rem;

            margin-bottom: 1rem;
            padding: 0.85rem 0.9rem;

            border-radius: 10px;

            font-size: 0.8rem;
            line-height: 1.5;
          }

          .auth-alert-error {
            color: #fecdd3;
            border: 1px solid rgba(244, 63, 94, 0.24);
            background: rgba(244, 63, 94, 0.07);
          }

          .auth-alert-info {
            color: #bae6fd;
            border: 1px solid rgba(56, 189, 248, 0.24);
            background: rgba(56, 189, 248, 0.07);
          }

          .auth-field {
            margin-bottom: 1rem;
          }

          .auth-field label {
            display: block;

            margin-bottom: 0.48rem;

            color: #aab7ca;

            font-size: 0.78rem;
            font-weight: 700;
          }

          .auth-field input {
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
            font-size: 0.9rem;

            transition:
              border-color 150ms ease,
              box-shadow 150ms ease,
              background 150ms ease;
          }

          .auth-field input::placeholder {
            color: #506078;
          }

          .auth-field input:focus {
            border-color: rgba(56, 189, 248, 0.48);

            background: rgba(7, 13, 24, 0.55);

            box-shadow:
              0 0 0 3px rgba(56, 189, 248, 0.07),
              0 0 24px rgba(139, 92, 246, 0.05);
          }

          .auth-field input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .auth-submit {
            width: 100%;
            min-height: 48px;

            margin-top: 0.6rem;

            border: 0;
            border-radius: 10px;

            color: #07111d;

            background:
              linear-gradient(
                90deg,
                #38bdf8 0%,
                #67c8f5 28%,
                #8b5cf6 72%,
                #a855f7 100%
              );

            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 800;

            cursor: pointer;

            box-shadow:
              0 12px 30px rgba(56, 189, 248, 0.11);

            transition:
              transform 150ms ease,
              filter 150ms ease,
              box-shadow 150ms ease;
          }

          .auth-submit:hover:not(:disabled) {
            transform: translateY(-1px);

            filter: brightness(1.05);

            box-shadow:
              0 16px 36px rgba(56, 189, 248, 0.14),
              0 10px 34px rgba(139, 92, 246, 0.09);
          }

          .auth-submit:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .auth-submit-content {
            display: inline-flex;
            align-items: center;

            gap: 0.6rem;
          }

          .auth-loading-dot {
            width: 13px;
            height: 13px;

            border: 2px solid rgba(7, 17, 29, 0.25);
            border-top-color: #07111d;
            border-radius: 999px;

            animation: authSpin 700ms linear infinite;
          }

          .auth-panel-note {
            margin: 1rem 0 0;

            color: #5f6f85;

            font-size: 0.72rem;
            line-height: 1.5;
            text-align: center;
          }

          .auth-panel-note a {
            color: #7dd3fc;
            text-decoration: none;
          }

          .auth-panel-note a:hover {
            text-decoration: underline;
          }

          @keyframes authSpin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 900px) {
            .auth-layout {
              grid-template-columns: 1fr;

              gap: 2.4rem;

              max-width: 620px;
            }

            .auth-story {
              text-align: center;

              margin: 0 auto;
            }

            .auth-story-copy {
              margin-left: auto;
              margin-right: auto;
            }

            .auth-story-points {
              text-align: left;
            }
          }

          @media (max-width: 620px) {
            .auth-page {
              padding:
                2.8rem 1rem
                3.5rem;
            }

            .auth-story h1 {
              font-size: 2.3rem;
            }

            .auth-story-points {
              grid-template-columns: 1fr;
            }

            .auth-panel-inner {
              padding: 1.25rem;
            }

            .auth-panel-brand {
              display: block;
            }
          }
        `}
      </style>

      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-story-eyebrow">
            RESQNET workspace
          </div>

          <h1>
            Move from the public demo
            <br />
            <span style={gradientTextStyle}>
              into your own response workspace.
            </span>
          </h1>

          <p className="auth-story-copy">
            Sign in to create and manage disaster-response scenarios,
            configure ambulances and hospitals, and continue into the
            simulation workflow.
          </p>

          <div className="auth-story-points">
            <div className="auth-story-point">
              <span className="auth-story-point-label">
                Configure
              </span>

              <strong>
                Build your own scenario and resource state.
              </strong>
            </div>

            <div className="auth-story-point">
              <span className="auth-story-point-label">
                Simulate
              </span>

              <strong>
                Run allocations against the road network.
              </strong>
            </div>

            <div className="auth-story-point">
              <span className="auth-story-point-label">
                Inspect
              </span>

              <strong>
                Review how decisions and outcomes change.
              </strong>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-brand">
              <ResqnetLogo size={38} />
            </div>

            <div className="auth-panel-heading">
              <h2>
                {isSignUp
                  ? 'Create your workspace account'
                  : 'Welcome back'}
              </h2>

              <p>
                {isSignUp
                  ? 'Create an account to save and manage RESQNET scenarios.'
                  : 'Sign in to continue to your RESQNET workspace.'}
              </p>
            </div>

            <div
              className="auth-mode-switch"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                className={`auth-mode-button ${!isSignUp ? 'is-active' : ''
                  }`}
                onClick={() => switchMode(false)}
                type="button"
                role="tab"
                aria-selected={!isSignUp}
              >
                Sign in
              </button>

              <button
                className={`auth-mode-button ${isSignUp ? 'is-active' : ''
                  }`}
                onClick={() => switchMode(true)}
                type="button"
                role="tab"
                aria-selected={isSignUp}
              >
                Sign up
              </button>
            </div>

            {errorMessage && (
              <div className="auth-alert auth-alert-error">
                <span>{errorMessage}</span>
              </div>
            )}

            {infoMessage && (
              <div className="auth-alert auth-alert-info">
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="auth-email">
                  Email address
                </label>

                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="responder@resqnet.org"
                  required
                  disabled={pending}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">
                  Password
                </label>

                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  required
                  disabled={pending}
                  autoComplete={
                    isSignUp
                      ? 'new-password'
                      : 'current-password'
                  }
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={pending}
              >
                <span className="auth-submit-content">
                  {pending && (
                    <span className="auth-loading-dot" />
                  )}

                  <span>
                    {pending
                      ? isSignUp
                        ? 'Creating account...'
                        : 'Signing in...'
                      : isSignUp
                        ? 'Create RESQNET account'
                        : 'Continue to workspace'}
                  </span>
                </span>
              </button>
            </form>

            <p className="auth-panel-note">
              Want to explore before signing in?{' '}
              <Link to="/demo">
                Open the public demo
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};