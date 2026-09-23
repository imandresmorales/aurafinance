import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, AuthProvider } from './context';
import { useAuth } from './hooks';
import { AppLayout } from './components';
import { AppRoutes } from './routes';

function AppContent() {
  const { isAuthenticated, isLocked, unlockVault } = useAuth();

  return (
    <AppLayout>
      <AppRoutes
        isAuthenticated={isAuthenticated && !isLocked}
        onUnlock={unlockVault}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
