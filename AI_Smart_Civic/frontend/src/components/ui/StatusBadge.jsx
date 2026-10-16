import React from 'react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  REPORTED: { label: 'Reported', className: 'status-badge-reported' },
  AI_VERIFIED: { label: 'AI Verified', className: 'status-badge-ai_verified' },
  ASSIGNED: { label: 'Assigned', className: 'status-badge-assigned' },
  PENDING: { label: 'Pending Action', className: 'status-badge-pending' },
  IN_PROGRESS: { label: 'In Progress', className: 'status-badge-in_progress' },
  RESOLVED: { label: 'Resolved', className: 'status-badge-resolved' },
  FEEDBACK: { label: 'Feedback Review', className: 'status-badge-feedback' },
  CLOSED: { label: 'Closed', className: 'status-badge-closed' },
};

export default function StatusBadge({ status, className = '' }) {
  const normalizedKey = (status || '').toUpperCase();
  const config = STATUS_CONFIG[normalizedKey] || {
    label: status || 'Unknown',
    className: 'status-badge-closed',
  };

  return (
    <span className={`status-badge ${config.className} ${className}`}>
      <span className="status-dot" />
      <span>{config.label}</span>
    </span>
  );
}
