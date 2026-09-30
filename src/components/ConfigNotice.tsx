import React from 'react';

export const ConfigNotice: React.FC = () => {
  return (
    <div className="card config-notice-card">
      <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
        <strong>⚠️ Supabase Credentials Required</strong>
      </div>
      
      <h3 style={{ marginBottom: '0.75rem' }}>Hosted Database Setup Needed</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        RESQNET uses Supabase for authentication and disaster scenario persistence. 
        To connect to your hosted database, configure environment variables in your <code>.env</code> file 
        (or Vercel project settings).
      </p>

      <div className="config-code-box">
        VITE_SUPABASE_URL=https://your-project-id.supabase.co<br />
        VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-anon-key
      </div>

      <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <p><strong>Setup Instructions:</strong></p>
        <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>supabase.com</a>.</li>
          <li>Execute the SQL migration from <code>supabase/migrations/20260930000000_create_scenarios.sql</code> in the SQL Editor.</li>
          <li>Copy the Project URL and Publishable Anon Key into <code>.env</code> (local) or Vercel Environment Variables (production).</li>
        </ol>
      </div>
    </div>
  );
};
