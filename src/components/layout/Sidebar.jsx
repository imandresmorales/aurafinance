import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    id: 'wallets',
    path: '/wallets',
    label: 'Billeteras & Cuentas',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="M2 10h20"></path>
      </svg>
    ),
  },
  {
    id: 'transactions',
    path: '/transactions',
    label: 'Transacciones',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
  },
  {
    id: 'budgets',
    path: '/budgets',
    label: 'Presupuesto por Sobres',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
  },
  {
    id: 'analytics',
    path: '/analytics',
    label: 'Analítica & Flujo',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
  },
  {
    id: 'goals',
    path: '/goals',
    label: 'Metas & Ahorro FIRE',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    ),
  },
  {
    id: 'debts',
    path: '/debts',
    label: 'Plan de Deudas',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
  {
    id: 'security',
    path: '/security',
    label: 'Bóveda & Criptoseguridad',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={`app-sidebar glass-panel ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Navegación principal"
    >
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrapper" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-diamond">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-name font-display">AuraFinance</span>
              <span className="brand-badge">ENTERPRISE</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul className="nav-list" role="menubar">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    onCloseMobile?.();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="icon-wrapper">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {isActive && <span className="active-glow-indicator" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          <svg className={`collapse-icon ${isCollapsed ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          {!isCollapsed && <span className="collapse-text">Colapsar menú</span>}
        </button>
      </div>
    </aside>
  );
}
