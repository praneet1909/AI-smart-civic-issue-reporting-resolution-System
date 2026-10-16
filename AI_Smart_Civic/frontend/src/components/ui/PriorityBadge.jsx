import React from 'react';
import { AlertCircle, AlertTriangle, Info, Flame } from 'lucide-react';
import './PriorityBadge.css';

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'priority-low', icon: Info },
  MEDIUM: { label: 'Medium', className: 'priority-medium', icon: AlertTriangle },
  HIGH: { label: 'High', className: 'priority-high', icon: AlertCircle },
  CRITICAL: { label: 'Critical', className: 'priority-critical', icon: Flame },
};

export default function PriorityBadge({ priority, showIcon = true, className = '' }) {
  const normalized = (priority || '').toUpperCase();
  const config = PRIORITY_CONFIG[normalized] || {
    label: priority || 'Normal',
    className: 'priority-low',
    icon: Info,
  };
  const IconComponent = config.icon;

  return (
    <span className={`priority-badge ${config.className} ${className}`}>
      {showIcon && <IconComponent size={12} strokeWidth={2.5} />}
      <span>{config.label}</span>
    </span>
  );
}
