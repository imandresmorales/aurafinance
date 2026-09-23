import React from 'react';
import './Button.css';

export default function Button({
  as: Component = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon,
  iconRight,
  haptic = true,
  onClick,
  children,
  className = '',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }

    // Feedback háptico accesible en dispositivos compatibles
    if (haptic && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch {
        // Ignorar si no está permitido
      }
    }

    onClick?.(e);
  };

  const isButtonElement = Component === 'button';

  return (
    <Component
      className={`btn btn-${variant} btn-${size} ${isLoading ? 'btn-loading' : ''} ${className}`}
      disabled={isButtonElement ? (disabled || isLoading) : undefined}
      aria-disabled={disabled || isLoading ? 'true' : undefined}
      aria-busy={isLoading ? 'true' : undefined}
      onClick={handleClick}
      {...props}
    >
      {isLoading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {!isLoading && icon && <span className="btn-icon btn-icon-left">{icon}</span>}
      <span className="btn-content">{children}</span>
      {!isLoading && iconRight && <span className="btn-icon btn-icon-right">{iconRight}</span>}
    </Component>
  );
}
