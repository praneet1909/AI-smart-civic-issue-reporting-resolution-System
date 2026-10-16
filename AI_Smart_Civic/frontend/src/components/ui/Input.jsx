import React from 'react';
import './Input.css';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  icon = null,
  className = '',
  disabled = false,
  ...rest
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}

      <div className="input-wrapper">
        {icon && <span className="input-icon-left">{icon}</span>}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${icon ? 'form-input-with-icon' : ''} ${
            error ? 'form-input-error' : ''
          }`}
          {...rest}
        />
      </div>

      {error ? (
        <span className="form-error-msg">{error}</span>
      ) : (
        hint && <span className="form-hint">{hint}</span>
      )}
    </div>
  );
}
