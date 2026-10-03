import React from 'react';
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { ResqnetLogo } from './ResqnetLogo';

const publicLinks = [
  { to: '/', label: 'Overview', end: true },
  { to: '/why', label: 'Why' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/evidence', label: 'Evidence' },
  { to: '/roadmap', label: 'Roadmap' },
];

export const Navbar: React.FC = () => {
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const email = user?.email ?? '';

  const initial =
    email.trim().length > 0
      ? email.trim().charAt(0).toUpperCase()
      : 'A';

  const isWorkspaceRoute =
    location.pathname === '/workspace' ||
    location.pathname.startsWith('/workspace/');

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          to="/"
          className="site-brand-link"
          aria-label="RESQNET home"
        >
          <ResqnetLogo />
        </Link>

        <nav
          className="site-primary-nav"
          aria-label="Primary navigation"
        >
          {publicLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `site-nav-link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <NavLink
            to="/demo"
            className={({ isActive }) =>
              `site-demo-button ${isActive ? 'is-active' : ''}`
            }
          >
            Demo
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/workspace"
                className={`site-workspace-button ${isWorkspaceRoute ? 'is-active' : ''
                  }`}
              >
                Workspace
              </NavLink>

              <details className="account-menu">
                <summary
                  className="account-menu-trigger"
                  aria-label="Open account menu"
                >
                  <span className="account-avatar">{initial}</span>

                  <span className="account-label">Account</span>

                  <svg
                    className="account-chevron"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 5.25L7 8.75L10.5 5.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>

                <div className="account-menu-panel">
                  <div className="account-menu-meta">
                    <span className="account-menu-eyebrow">
                      Signed in as
                    </span>

                    <span
                      className="account-menu-email"
                      title={email}
                    >
                      {email}
                    </span>
                  </div>

                  {!isConfigured && (
                    <div className="account-setup-warning">
                      Supabase setup needed
                    </div>
                  )}

                  <button
                    type="button"
                    className="account-menu-item account-menu-signout"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </details>
            </>
          ) : (
            <Link
              to="/login"
              className="site-signin-button"
            >
              Sign in
            </Link>
          )}

          <details className="mobile-nav-menu">
            <summary
              className="mobile-nav-trigger"
              aria-label="Open navigation menu"
            >
              <span>Menu</span>

              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 5H14M3 8.5H14M3 12H14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </summary>

            <div className="mobile-nav-panel">
              {publicLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'is-active' : ''
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/demo"
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? 'is-active' : ''
                  }`
                }
              >
                Demo
              </NavLink>

              {user ? (
                <>
                  <NavLink
                    to="/workspace"
                    className={`mobile-nav-link ${isWorkspaceRoute ? 'is-active' : ''
                      }`}
                  >
                    Workspace
                  </NavLink>

                  <div className="mobile-account-email">
                    {email}
                  </div>

                  <button
                    type="button"
                    className="mobile-nav-signout"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'is-active' : ''
                    }`
                  }
                >
                  Sign in
                </NavLink>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
};