import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  Building2,
  Tag,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import LocationPicker from '../../components/ui/LocationPicker';
import PriorityBadge from '../../components/ui/PriorityBadge';
import AiConfidenceBadge from '../../components/ui/AiConfidenceBadge';
import complaintService from '../../services/complaintService';
import './ReportIssueForm.css';

export default function ReportIssueForm({ onComplaintCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: null,
    longitude: null,
    locationAddress: '',
  });
  const [beforeImage, setBeforeImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [triageResult, setTriageResult] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required (e.g. Broken water pipeline on 5th cross)';
    } else if (formData.title.length > 200) {
      errs.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.description.trim()) {
      errs.description = 'Please describe the civic issue to assist field officers';
    } else if (formData.description.length > 4000) {
      errs.description = 'Description cannot exceed 4000 characters';
    }

    if (!beforeImage) {
      errs.beforeImage = 'A before-resolution photo is mandatory for verification';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('beforeImage', beforeImage);

      if (formData.latitude !== null && formData.latitude !== undefined) {
        payload.append('latitude', formData.latitude);
      }
      if (formData.longitude !== null && formData.longitude !== undefined) {
        payload.append('longitude', formData.longitude);
      }
      if (formData.locationAddress) {
        payload.append('locationAddress', formData.locationAddress.trim());
      }

      const response = await complaintService.createComplaint(payload);
      setTriageResult(response);
      if (onComplaintCreated) {
        onComplaintCreated(response);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      latitude: null,
      longitude: null,
      locationAddress: '',
    });
    setBeforeImage(null);
    setErrors({});
    setSubmitError(null);
    setTriageResult(null);
  };

  if (triageResult) {
    return (
      <div className="report-form-container">
        <div className="triage-success-card animate-fade-in">
          <div className="triage-check-icon">
            <CheckCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
            Complaint Successfully Registered!
          </h2>
          <p className="text-secondary" style={{ maxWidth: '520px', margin: '0 auto 1.5rem' }}>
            Our Gemini AI model has triaged your report and dispatched it to the responsible municipal department.
          </p>

          <div
            style={{
              display: 'inline-block',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              color: '#93c5fd',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.05em',
            }}
          >
            REF: {triageResult.complaintNumber}
          </div>

          <div className="triage-details-grid">
            <div>
              <div className="triage-item-label">Issue Category</div>
              <div className="triage-item-val flex items-center gap-1.5">
                <Tag size={15} style={{ color: 'var(--civic-cyan)' }} />
                <span>{triageResult.issueType}</span>
              </div>
            </div>

            <div>
              <div className="triage-item-label">Routed Department</div>
              <div className="triage-item-val flex items-center gap-1.5">
                <Building2 size={15} style={{ color: '#38bdf8' }} />
                <span>{triageResult.departmentName || 'Public Works'}</span>
              </div>
            </div>

            <div>
              <div className="triage-item-label">Triage Priority</div>
              <div style={{ marginTop: '0.2rem' }}>
                <PriorityBadge priority={triageResult.priority} />
              </div>
            </div>

            <div>
              <div className="triage-item-label">AI Confidence</div>
              <div style={{ marginTop: '0.2rem' }}>
                <AiConfidenceBadge
                  confidence={triageResult.aiConfidence}
                  status={triageResult.aiProcessingStatus}
                />
              </div>
            </div>
          </div>

          {triageResult.aiSummary && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.75rem',
              }}
            >
              <div className="flex items-center gap-1.5" style={{ color: 'var(--civic-cyan)', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <Sparkles size={14} />
                <span>Gemini Analysis Summary</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {triageResult.aiSummary}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button
              id="report-another-btn"
              variant="secondary"
              icon={<RotateCcw size={15} />}
              onClick={handleReset}
            >
              Report Another Issue
            </Button>

            <Button
              id="view-tracking-btn"
              variant="primary"
              icon={<ArrowRight size={15} />}
              onClick={() => onCancel ? onCancel() : handleReset()}
            >
              Go to My Complaints
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit} className="report-form-card animate-fade-in">
        <div className="form-header-badge">
          <Sparkles size={13} />
          <span>AI-Assisted Municipal Reporting</span>
        </div>

        <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
          Report a Civic Issue
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
          Provide hazard details and photo evidence. Gemini AI will categorize the issue, assign SLA priority, and route directly to the responsible municipal department.
        </p>

        {submitError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--civic-rose)', flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Section 1: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="complaint-title-input"
            label="Issue Title"
            required
            placeholder="e.g. Deep pothole causing bike skid, Open manhole cover"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            maxLength={200}
            hint="Summarize the civic defect in one sentence"
          />

          <Textarea
            id="complaint-description-input"
            label="Detailed Description"
            required
            rows={4}
            placeholder="Provide context such as size, severity, when it occurred, or potential hazards to pedestrians..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            maxLength={4000}
            hint="Gemini AI uses this description to identify priority and department"
          />
        </div>

        <div className="report-section-divider" />

        {/* Section 2: Visual Evidence */}
        <div>
          <ImageUploadZone
            file={beforeImage}
            onFileSelect={(file) => setBeforeImage(file)}
            required
            error={errors.beforeImage}
          />
        </div>

        <div className="report-section-divider" />

        {/* Section 3: Geolocation */}
        <div>
          <LocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            locationAddress={formData.locationAddress}
            onLocationChange={({ latitude, longitude, locationAddress }) => {
              setFormData({ ...formData, latitude, longitude, locationAddress });
            }}
          />
        </div>

        <div className="form-actions-bar">
          {onCancel && (
            <Button
              id="cancel-report-btn"
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}

          <Button
            id="submit-complaint-btn"
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            icon={submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
          >
            {submitting ? 'Submitting & AI Classifying...' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
