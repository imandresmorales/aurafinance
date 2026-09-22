import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente de protección de rutas privadas
 * En fases iniciales permite paso o valida si la bóveda está desbloqueada
 */
export default function ProtectedRoute({ isAuthenticated = true, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
