import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Camera, ShieldCheck } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import officerService from '../../services/officerService';
import './ResolveComplaintModal.css';

export default function ResolveComplaintModal({
  isOpen,
  onClose,
  complaint,
  onResolved,
}) {
  const [afterImage, setAfterImage] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (complaint && isOpen) {
      setAfterImage(null);
      setRemarks('');
      setErrors({});
      setSubmitError(null);
    }
  }, [complaint, isOpen]);

  if (!complaint) return null;

  const validate = () => {
    const errs = {};
    if (!afterImage) {
      errs.afterImage = 'A clear photo showing the resolved hazard is required as proof of work.';
    }
    if (!remarks.trim() || remarks.trim().length < 5) {
      errs.remarks = 'Resolution remarks must be at least 5 characters (e.g. materials used, work summary).';
    } else if (remarks.length > 2000) {
      errs.remarks = 'Remarks cannot exceed 2000 characters.';
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
      const formData = new FormData();
      formData.append('remarks', remarks.trim());
      formData.append('afterImage', afterImage);

      const response = await officerService.resolveComplaint(complaint.id, formData);
      if (onResolved) {
        onResolved(response);
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit resolution proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Field Resolution Proof"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2" style={{ width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            id="confirm-resolve-btn"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            icon={submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          >
            {submitting ? 'Verifying & Submitting...' : 'Mark as Resolved'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="resolve-modal-body">
        {submitError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.875rem',
            }}
          >
            <AlertTriangle size={17} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Complaint Reference Card */}
        <div className="resolve-target-card">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {complaint.complaintNumber}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>

            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem' }}>
              {complaint.title}
            </div>
          </div>

          {complaint.beforeImageUrl && (
            <img
              src={complaint.beforeImageUrl}
              alt="Before hazard reference"
              className="resolve-target-thumb"
              title="Before hazard photo"
            />
          )}
        </div>

        {/* After-Resolution Photo Dropzone */}
        <div>
          <ImageUploadZone
            file={afterImage}
            onFileSelect={(file) => setAfterImage(file)}
            label="After-Resolution Photo Proof (Required)"
            required
            error={errors.afterImage}
          />
        </div>

        {/* Resolution Remarks */}
        <Textarea
          id="resolution-remarks-input"
          label="Resolution & Field Action Summary"
          required
          rows={3}
          placeholder="e.g. Pothole cleared of debris, filled with cold asphalt mix and compressed with vibro-roller. Street reopened to normal traffic."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          error={errors.remarks}
          maxLength={2000}
          hint="Visible to citizens and administrators as verification of repair"
        />
      </form>
    </Modal>
  );
}
