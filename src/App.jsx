import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, AuthProvider, ToastProvider } from './context';
import { useAuth } from './hooks';
import { AppLayout, ToastContainer } from './components';
import { AppRoutes } from './routes';

function AppContent() {
  const { isAuthenticated, isLocked, unlockVault } = useAuth();

  return (
    <AppLayout>
      <AppRoutes
        isAuthenticated={isAuthenticated && !isLocked}
        onUnlock={unlockVault}
      />
      <ToastContainer />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
