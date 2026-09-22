import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
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
    <BrowserRouter>
      <AppLayout>
        <AppRoutes isAuthenticated={isAuthenticated} onUnlock={handleUnlock} />
      </AppLayout>
    </BrowserRouter>
  );
}
