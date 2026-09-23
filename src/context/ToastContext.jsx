import React, { createContext, useState, useCallback, useId } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, title, type = 'info', duration = 4500, priority = 'normal' }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newToast = {
        id,
        message,
        title,
        type, // 'success' | 'error' | 'warning' | 'info'
        priority, // 'normal' | 'high' | 'urgent'
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Si es urgente, colocarlo al inicio de la cola
        if (priority === 'urgent') {
          return [newToast, ...prev];
        }
        return [...prev, newToast];
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    show: addToast,
    success: (message, title = 'Operación Exitosa') =>
      addToast({ message, title, type: 'success', priority: 'normal' }),
    error: (message, title = 'Error de Sistema') =>
      addToast({ message, title, type: 'error', priority: 'urgent', duration: 6000 }),
    warning: (message, title = 'Atención') =>
      addToast({ message, title, type: 'warning', priority: 'high', duration: 5000 }),
    info: (message, title = 'Información') =>
      addToast({ message, title, type: 'info', priority: 'normal' }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
