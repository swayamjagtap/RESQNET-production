import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-link">
          <div className="brand-logo">🛡️</div>
          <div className="brand-text">
            <span className="brand-title">RESQNET</span>
            <span className="brand-tag">Team No Free Lunch (EL-02)</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}>
            Home
          </Link>

          {user ? (
            <>
              <Link to="/workspace" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}>
                Workspace
              </Link>
              <span className="nav-user" title={user.email}>
                {user.email}
              </span>
              <button 
                onClick={handleSignOut} 
                className="btn btn-danger" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          )}

          {!isConfigured && (
            <span className="badge badge-planned" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              Setup Needed
            </span>
          )}
        </nav>
      </div>
    </header>
  );
};
