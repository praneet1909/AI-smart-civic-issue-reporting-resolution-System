import React from 'react';
import './Card.css';

export default function Card({
  title,
  subtitle,
  badge,
  headerAction,
  footer,
  glow = null, // 'blue', 'emerald', 'amber', null
  interactive = false,
  className = '',
  children,
  onClick,
  ...rest
}) {
  const glowClass = glow ? `civic-card-glow-${glow}` : '';
  const interactiveClass = interactive ? 'civic-card-interactive' : '';

  return (
    <div
      className={`civic-card ${glowClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {(title || subtitle || badge || headerAction) && (
        <div className="civic-card-header">
          <div className="civic-card-title-group">
            {title && <h3 className="civic-card-title">{title}</h3>}
            {subtitle && <p className="civic-card-subtitle">{subtitle}</p>}
          </div>
          {(badge || headerAction) && (
            <div className="flex items-center gap-2">
              {badge}
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className="civic-card-body">{children}</div>

      {footer && <div className="civic-card-footer">{footer}</div>}
    </div>
  );
}
