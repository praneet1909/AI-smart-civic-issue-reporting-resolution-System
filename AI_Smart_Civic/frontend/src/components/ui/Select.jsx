import React from 'react';
import './Input.css';

export default function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  error,
  hint,
  required = false,
  className = '',
  disabled = false,
  ...rest
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}

      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`form-select ${error ? 'form-input-error' : ''}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#0f172a', color: '#f8fafc' }}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <span className="form-error-msg">{error}</span>
      ) : (
        hint && <span className="form-hint">{hint}</span>
      )}
    </div>
  );
}
