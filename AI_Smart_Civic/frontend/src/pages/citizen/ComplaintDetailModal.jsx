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
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import AiConfidenceBadge from '../../components/ui/AiConfidenceBadge';
import Textarea from '../../components/ui/Textarea';
import complaintService from '../../services/complaintService';
import './ComplaintDetailModal.css';

export default function ComplaintDetailModal({
  isOpen,
  onClose,
  complaint,
  onStatusUpdated,
}) {
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [closingComplaint, setClosingComplaint] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadTimelineAndFeedback = useCallback(async (id, currentStatus) => {
    setLoadingTimeline(true);
    setActionError(null);
    try {
      const timelineData = await complaintService.getComplaintTimeline(id);
      setTimeline(timelineData || []);

      if (currentStatus === 'RESOLVED' || currentStatus === 'FEEDBACK' || currentStatus === 'CLOSED') {
        try {
          const feedbackData = await complaintService.getFeedback(id);
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
      setShowFeedbackForm(false);
      setActionError(null);
    }
  }, [complaint, isOpen, loadTimelineAndFeedback]);

  const handleCloseComplaint = async () => {
    if (!window.confirm('Are you sure you want to mark this complaint as Closed?')) {
      return;
    }
    setClosingComplaint(true);
    setActionError(null);
    try {
      const updated = await complaintService.closeComplaint(complaint.id, 'Closed by reporting citizen');
      if (onStatusUpdated) onStatusUpdated(updated);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Failed to close complaint');
    } finally {
      setClosingComplaint(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setActionError(null);
    try {
      const res = await complaintService.submitFeedback(complaint.id, { rating, comments });
      setFeedback(res);
      setShowFeedbackForm(false);
      if (onStatusUpdated) {
        const refreshed = await complaintService.getComplaintById(complaint.id);
        onStatusUpdated(refreshed);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={complaint.title}
      size="lg"
      footer={
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div>
            {complaint.status !== 'CLOSED' && (
              <Button
                id="modal-close-issue-btn"
                variant="ghost"
                size="sm"
                onClick={handleCloseComplaint}
                disabled={closingComplaint}
                style={{ color: 'var(--text-muted)' }}
              >
                {closingComplaint ? 'Closing...' : 'Withdraw / Close Issue'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {complaint.status === 'RESOLVED' && !feedback && !showFeedbackForm && (
              <Button
                id="modal-give-feedback-btn"
                variant="primary"
                size="sm"
                icon={<Star size={14} />}
                onClick={() => setShowFeedbackForm(true)}
              >
                Rate Resolution
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        </div>
      }
    >
      <div className="detail-modal-body">
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

        {/* Header Meta */}
        <div className="detail-header-meta">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="detail-ref-badge">{complaint.complaintNumber}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>

          <div className="flex items-center gap-1.5 text-muted" style={{ fontSize: '0.8125rem' }}>
            <Calendar size={14} />
            <span>Reported {formatDate(complaint.reportedAt)}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="detail-section-title">Description</div>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.9375rem', whiteSpace: 'pre-line' }}>
            {complaint.description}
          </p>
        </div>

        {/* Location & Coordinates */}
        <div>
          <div className="detail-section-title">
            <MapPin size={14} style={{ color: 'var(--civic-rose)' }} />
            <span>Location & GPS Tag</span>
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
                {complaint.locationAddress || 'No landmark provided'}
              </p>
              {complaint.latitude && complaint.longitude && (
                <p className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  GPS: {complaint.latitude}, {complaint.longitude}
                </p>
              )}
            </div>

            {complaint.latitude && complaint.longitude && (
              <a
                href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-map-link"
              >
                <span>Open in Maps</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Evidence Photos */}
        <div>
          <div className="detail-section-title">
            <ImageIcon size={14} style={{ color: 'var(--civic-primary)' }} />
            <span>Photographic Evidence</span>
          </div>

          <div className="detail-photos-grid">
            {/* Before Photo */}
            <div className="photo-card">
              <div className="photo-card-header photo-card-before">
                <span>Before Resolution (Citizen Evidence)</span>
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
                <span>After Resolution (Officer Proof)</span>
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
                    <span>Pending officer field resolution</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Triage Card */}
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
                Gemini AI Triage Analysis
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.8125rem',
            }}
          >
            <div>
              <span className="text-muted">Assigned Department:</span>
              <p style={{ fontWeight: 600, color: '#38bdf8', marginTop: '0.15rem' }}>
                {complaint.departmentName || 'Public Works'}
              </p>
            </div>

            <div>
              <span className="text-muted">Assigned Field Officer:</span>
              <p style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.15rem' }}>
                {complaint.officerName || 'Under department queue'}
              </p>
            </div>
          </div>

          {complaint.officerRemarks && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Officer Work Remarks:
              </span>
              <p style={{ fontSize: '0.875rem', color: '#ffffff', marginTop: '0.2rem' }}>
                {complaint.officerRemarks}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Section (if submitted or in form mode) */}
        {showFeedbackForm && (
          <form
            onSubmit={handleSubmitFeedback}
            style={{
              background: 'rgba(236, 72, 153, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              Citizen Satisfaction Feedback
            </h4>
            <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
              How satisfied are you with the municipal response and quality of repair?
            </p>

            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: star <= rating ? '#fbbf24' : 'var(--text-muted)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Star size={24} fill={star <= rating ? '#fbbf24' : 'none'} />
                </button>
              ))}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fbbf24', marginLeft: '0.5rem' }}>
                {rating} / 5 Stars
              </span>
            </div>

            <Textarea
              placeholder="Leave feedback regarding the speed, quality, or communication (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-end gap-2" style={{ marginTop: '1rem' }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedbackForm(false)}
                disabled={submittingFeedback}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingFeedback}
                icon={submittingFeedback ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        )}

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
                Citizen Feedback Recorded
              </span>
              <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                <Star size={14} fill="#fbbf24" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{feedback.rating} / 5</span>
              </div>
            </div>
            {feedback.comments && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                "{feedback.comments}"
              </p>
            )}
          </div>
        )}

        {/* Status Lifecycle Timeline */}
        <div>
          <div className="detail-section-title">
            <History size={14} style={{ color: 'var(--civic-indigo)' }} />
            <span>Resolution Lifecycle Timeline</span>
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
