import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Sparkles,
  History,
  Image as ImageIcon,
  ExternalLink,
  Star,
  CheckCircle,
  Loader2,
  Clock,
  PlayCircle,
  CheckCircle2,
  User,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import AiConfidenceBadge from '../../components/ui/AiConfidenceBadge';
import officerService from '../../services/officerService';
import './OfficerComplaintDetailModal.css';

export default function OfficerComplaintDetailModal({
  isOpen,
  onClose,
  complaint,
  onStartWork,
  onOpenResolve,
}) {
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadTimelineAndFeedback = useCallback(async (id, currentStatus) => {
    setLoadingTimeline(true);
    setActionError(null);
    try {
      const timelineData = await officerService.getTimeline(id);
      setTimeline(timelineData || []);

      if (currentStatus === 'RESOLVED' || currentStatus === 'FEEDBACK' || currentStatus === 'CLOSED') {
        try {
          const feedbackData = await officerService.getFeedback(id);
          setFeedback(feedbackData);
        } catch {
          setFeedback(null);
        }
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  useEffect(() => {
    if (complaint && isOpen) {
      loadTimelineAndFeedback(complaint.id, complaint.status);
    } else {
      setTimeline([]);
      setFeedback(null);
      setActionError(null);
    }
  }, [complaint, isOpen, loadTimelineAndFeedback]);

  const handleStartWorkClick = async () => {
    setStarting(true);
    setActionError(null);
    try {
      if (onStartWork) {
        await onStartWork(complaint.id);
      }
      onClose();
    } catch (err) {
      setActionError(err.message || 'Failed to start work');
    } finally {
      setStarting(false);
    }
  };

  if (!complaint) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isPending = complaint.status === 'PENDING';
  const isInProgress = complaint.status === 'IN_PROGRESS';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={complaint.title}
      size="lg"
      footer={
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center gap-2">
            {isPending && (
              <Button
                id="officer-modal-start-btn"
                variant="primary"
                size="sm"
                icon={starting ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                onClick={handleStartWorkClick}
                disabled={starting}
              >
                {starting ? 'Initiating...' : 'Start Work (In-Progress)'}
              </Button>
            )}

            {isInProgress && (
              <Button
                id="officer-modal-resolve-btn"
                variant="primary"
                size="sm"
                icon={<CheckCircle2 size={14} />}
                onClick={() => {
                  onClose();
                  if (onOpenResolve) onOpenResolve(complaint);
                }}
              >
                Submit Resolution Proof
              </Button>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Window
          </Button>
        </div>
      }
    >
      <div className="officer-detail-modal-body">
        {actionError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.875rem',
            }}
          >
            {actionError}
          </div>
        )}

        {/* Header Metadata */}
        <div className="officer-detail-header-meta">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {complaint.complaintNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>

          <div className="flex items-center gap-1.5 text-muted" style={{ fontSize: '0.8125rem' }}>
            <Calendar size={14} />
            <span>Assigned {formatDate(complaint.assignedAt || complaint.reportedAt)}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="detail-section-title">Citizen Problem Description</div>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.9375rem', whiteSpace: 'pre-line' }}>
            {complaint.description}
          </p>
        </div>

        {/* Citizen Information */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <User size={18} style={{ color: 'var(--civic-primary)' }} />
          <div>
            <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Reporting Citizen
            </span>
            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
              {complaint.citizenName || 'Registered Citizen'}
            </div>
          </div>
        </div>

        {/* Location & GPS Navigation */}
        <div>
          <div className="detail-section-title">
            <MapPin size={14} style={{ color: 'var(--civic-rose)' }} />
            <span>Site Location & Field Navigation</span>
          </div>

          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                {complaint.locationAddress || 'No landmark specified'}
              </p>
              {complaint.latitude && complaint.longitude && (
                <p className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  GPS: {complaint.latitude}, {complaint.longitude}
                </p>
              )}
            </div>

            {complaint.latitude && complaint.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${complaint.latitude},${complaint.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-map-link"
              >
                <span>Navigate via GPS</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Photographic Evidence */}
        <div>
          <div className="detail-section-title">
            <ImageIcon size={14} style={{ color: 'var(--civic-primary)' }} />
            <span>Photographic Evidence</span>
          </div>

          <div className="detail-photos-grid">
            {/* Before Photo */}
            <div className="photo-card">
              <div className="photo-card-header photo-card-before">
                <span>Before Resolution (Reported Defect)</span>
              </div>
              <div className="photo-img-wrapper">
                {complaint.beforeImageUrl ? (
                  <img
                    src={complaint.beforeImageUrl}
                    alt="Before resolution"
                    className="photo-img"
                    onClick={() => window.open(complaint.beforeImageUrl, '_blank')}
                    title="Click to view full photo"
                  />
                ) : (
                  <div className="photo-placeholder">
                    <ImageIcon size={28} />
                    <span>No image attached</span>
                  </div>
                )}
              </div>
            </div>

            {/* After Photo */}
            <div className="photo-card">
              <div className="photo-card-header photo-card-after">
                <span>After Resolution (Your Field Proof)</span>
              </div>
              <div className="photo-img-wrapper">
                {complaint.afterImageUrl ? (
                  <img
                    src={complaint.afterImageUrl}
                    alt="After resolution"
                    className="photo-img"
                    onClick={() => window.open(complaint.afterImageUrl, '_blank')}
                    title="Click to view full photo"
                  />
                ) : (
                  <div className="photo-placeholder">
                    <Clock size={28} />
                    <span>Pending completion photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gemini AI Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(15, 23, 42, 0.75))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: '0.75rem' }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: 'var(--civic-cyan)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#ffffff' }}>
                AI Diagnosis Summary
              </span>
            </div>

            <AiConfidenceBadge
              confidence={complaint.aiConfidence}
              status={complaint.aiProcessingStatus}
            />
          </div>

          {complaint.aiSummary && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              {complaint.aiSummary}
            </p>
          )}

          {complaint.officerRemarks && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Your Submitted Remarks:
              </span>
              <p style={{ fontSize: '0.875rem', color: '#ffffff', marginTop: '0.2rem' }}>
                {complaint.officerRemarks}
              </p>
            </div>
          )}
        </div>

        {/* Citizen Feedback (if submitted) */}
        {feedback && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--civic-emerald)' }}>
                Citizen Feedback & Satisfaction
              </span>
              <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                <Star size={14} fill="#fbbf24" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{feedback.rating} / 5 Stars</span>
              </div>
            </div>
            {feedback.comments && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                "{feedback.comments}"
              </p>
            )}
          </div>
        )}

        {/* Lifecycle Status Timeline */}
        <div>
          <div className="detail-section-title">
            <History size={14} style={{ color: 'var(--civic-indigo)' }} />
            <span>Workflow History</span>
          </div>

          {loadingTimeline ? (
            <div className="flex items-center justify-center p-4 text-muted">
              <Loader2 size={20} className="animate-spin" />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>Loading timeline...</span>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-muted" style={{ fontSize: '0.8125rem', padding: '0.5rem 0' }}>
              No status transitions recorded yet.
            </div>
          ) : (
            <div className="timeline-list">
              {timeline.map((event, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {event.changedByName || 'System'}
                      </span>
                      <span>{formatDate(event.changedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '0.3rem' }}>
                      {event.oldStatus && (
                        <>
                          <StatusBadge status={event.oldStatus} />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                        </>
                      )}
                      <StatusBadge status={event.newStatus} />
                    </div>

                    {event.remarks && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        {event.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
