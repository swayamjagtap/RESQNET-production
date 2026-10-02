import React from 'react';

export const PageShell: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  return (
    <main className="main-content" aria-label={title} style={{ maxWidth: '900px' }}>
      {children}
    </main>
  );
};

export const Section: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  return (
    <section style={{ marginBottom: '3rem' }}>
      {title && <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>{title}</h2>}
      {children}
    </section>
  );
};
