import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context';
import { AppLayout } from './components';
import { AppRoutes } from './routes';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleUnlock = (passphrase) => {
    if (passphrase) {
      setIsAuthenticated(true);
    }
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout>
          <AppRoutes isAuthenticated={isAuthenticated} onUnlock={handleUnlock} />
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
