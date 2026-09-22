import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundView() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h1 className="num-mono" style={{ fontSize: '4rem', color: 'var(--color-primary-light)', marginBottom: '1rem' }}>404</h1>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.75rem' }}>Bóveda No Encontrada</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'var(--font-size-sm)' }}>
          La ruta solicitada no existe o no tienes permisos de acceso criptográfico para verla.
        </p>
        <Link to="/" className="glass-pill emerald" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex' }}>
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
