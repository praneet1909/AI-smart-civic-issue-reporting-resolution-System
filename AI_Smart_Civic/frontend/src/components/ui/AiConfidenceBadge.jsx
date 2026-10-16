import React from 'react';
import { Sparkles, Cpu, Clock, AlertCircle } from 'lucide-react';
import './AiConfidenceBadge.css';

export default function AiConfidenceBadge({
  status = 'SUCCESS',
  confidence = null,
  className = '',
}) {
  const normStatus = (status || '').toUpperCase();

  if (normStatus === 'SUCCESS') {
    const percent = confidence != null ? `${Math.round(confidence * 100)}%` : 'Verified';
    return (
      <span className={`ai-badge ai-badge-success ${className}`}>
        <Sparkles size={13} className="ai-badge-sparkle" />
        <span>AI Triaged ({percent})</span>
      </span>
    );
  }

  if (normStatus === 'FALLBACK') {
    return (
      <span className={`ai-badge ai-badge-fallback ${className}`}>
        <Cpu size={13} />
        <span>Rule Fallback</span>
      </span>
    );
  }

  if (normStatus === 'PENDING') {
    return (
      <span className={`ai-badge ai-badge-pending ${className}`}>
        <Clock size={13} />
        <span>AI Analyzing...</span>
      </span>
    );
  }

  return (
    <span className={`ai-badge ai-badge-fallback ${className}`}>
      <AlertCircle size={13} />
      <span>AI Unverified</span>
    </span>
  );
}
