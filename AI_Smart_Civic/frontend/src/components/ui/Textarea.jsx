import React from 'react';
import './Input.css';

export default function Textarea({
  label,
  id,
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  rows = 4,
  className = '',
  disabled = false,
  ...rest
}) {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

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

      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`form-textarea ${error ? 'form-input-error' : ''}`}
        style={{
          resize: 'vertical',
          minHeight: '90px',
          fontFamily: 'inherit',
          lineHeight: '1.5',
        }}
        {...rest}
      />

      {error ? (
        <span className="form-error-msg">{error}</span>
      ) : (
        hint && <span className="form-hint">{hint}</span>
      )}
    </div>
  );
}
