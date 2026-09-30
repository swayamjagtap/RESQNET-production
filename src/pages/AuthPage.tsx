import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ConfigNotice } from '../components/ConfigNotice';

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
    // If user is already authenticated, redirect to workspace
    if (user) {
      navigate('/workspace', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isConfigured || !supabase) {
      setErrorMessage('Supabase is not configured yet. Please check environment variables.');
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
          // Email confirmation is required by Supabase auth settings
          setInfoMessage(
            'Account registration initiated! A confirmation email has been sent. Please check your inbox and verify your email before signing in. (Signup does not authenticate your session until verified).'
          );
        } else if (data.session) {
          // Direct sign up without confirmation required
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
      const msg = err instanceof Error ? err.message : 'An unexpected authentication error occurred.';
      setErrorMessage(msg);
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
    <div className="main-content">
      <div className="card auth-container">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="alert alert-info">
            <span>ℹ️</span>
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="responder@resqnet.org"
              required
              disabled={pending}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={pending}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={pending}
          >
            {pending ? (
              <>
                <span className="spinner"></span>
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{isSignUp ? 'Create RESQNET Account' : 'Sign In'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
