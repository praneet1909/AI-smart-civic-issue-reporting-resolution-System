import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <Loader2 className="btn-spinner" />
      ) : (
        icon && <span className="btn-icon">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
}
