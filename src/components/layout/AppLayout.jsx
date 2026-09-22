import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './AppLayout.css';

export default function AppLayout({ activeTab, onSelectTab, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);

  // Global hotkey: 'H' for stealth mode toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setStealthMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`app-shell ${stealthMode ? 'stealth-active' : ''}`}>
      {/* Skip to Main Content Link for WCAG AAA Accessibility */}
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>

      {/* Ambient background mesh */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          onSelectTab(tabId);
          setIsSidebarOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          stealthMode={stealthMode}
          onToggleStealth={() => setStealthMode((prev) => !prev)}
        />

        <main id="main-content" className="app-content-container" tabIndex="-1">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
