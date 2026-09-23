import React, { useState, useId } from 'react';
import './Input.css';

export default function Input({
  label,
  helperText,
  error,
  prefix,
  suffix,
  iconLeft,
  iconRight,
  type = 'text',
  id: customId,
  className = '',
  disabled = false,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-field-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="required-star" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="input-control-container">
        {prefix && <span className="input-prefix num-mono">{prefix}</span>}
        {iconLeft && <span className="input-icon-left">{iconLeft}</span>}

        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
          }
          className="input-control"
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            tabIndex="-1"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        )}

        {iconRight && !isPassword && <span className="input-icon-right">{iconRight}</span>}
        {suffix && <span className="input-suffix num-mono">{suffix}</span>}
      </div>

      {helperText && !error && (
        <p id={helperId} className="input-helper-text">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="input-error-text" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
