import { useContext } from 'react';
import { ToastContext } from '../context';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context.toast;
}

export default useToast;
