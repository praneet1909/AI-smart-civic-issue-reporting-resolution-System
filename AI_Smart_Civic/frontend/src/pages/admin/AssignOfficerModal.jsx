import React, { useState, useEffect } from 'react';
import { UserCheck, Building2, AlertTriangle, Loader2, Send, Phone, Mail } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import adminService from '../../services/adminService';
import './AssignOfficerModal.css';

export default function AssignOfficerModal({
  isOpen,
  onClose,
  complaint,
  officers = [],
  onAssigned,
}) {
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isReassignment = complaint && ['ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes(complaint.status);

  useEffect(() => {
    if (complaint && isOpen) {
      setError(null);
      setRemarks('');
      // If complaint already has officer, default to it; otherwise default to first officer in same department
      if (complaint.officerId) {
        setSelectedOfficerId(String(complaint.officerId));
      } else {
        const matching = officers.find(
          (o) => o.departmentName?.toLowerCase() === complaint.departmentName?.toLowerCase() && o.enabled
        );
        setSelectedOfficerId(matching ? String(matching.id) : (officers[0]?.id ? String(officers[0].id) : ''));
      }
    }
  }, [complaint, isOpen, officers]);

  if (!complaint) return null;

  const selectedOfficer = officers.find((o) => String(o.id) === String(selectedOfficerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId) {
      setError('Please select an authorized field officer');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        officerId: Number(selectedOfficerId),
        remarks: remarks.trim() || undefined,
      };

      let response;
      if (isReassignment) {
        response = await adminService.reassignComplaint(complaint.id, payload);
      } else {
        response = await adminService.assignComplaint(complaint.id, payload);
      }

      if (onAssigned) {
        onAssigned(response);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign officer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReassignment ? 'Reassign Field Officer' : 'Dispatch Field Officer'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2" style={{ width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            id="confirm-assign-btn"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !selectedOfficerId}
            icon={submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          >
            {submitting ? 'Dispatching...' : isReassignment ? 'Confirm Reassignment' : 'Assign & Dispatch'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="assign-modal-body">
        {error && (
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
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Target Summary */}
        <div className="assign-complaint-summary">
          <div className="flex items-center justify-between gap-2 flex-wrap">
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
            <div className="flex items-center gap-1.5">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>

          <div className="assign-summary-title">{complaint.title}</div>

          <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.8125rem' }}>
            <Building2 size={14} style={{ color: '#38bdf8' }} />
            <span>Target Department: <strong style={{ color: '#ffffff' }}>{complaint.departmentName || 'Public Works'}</strong></span>
          </div>
        </div>

        {/* Officer Selection */}
        <div className="officer-select-container">
          <label htmlFor="officer-select" className="form-label">
            <span>
              Select Dispatch Officer
              <span className="form-label-required">*</span>
            </span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {officers.length} Active Officers
            </span>
          </label>

          <select
            id="officer-select"
            value={selectedOfficerId}
            onChange={(e) => setSelectedOfficerId(e.target.value)}
            className="form-select"
            required
            style={{
              width: '100%',
              padding: '0.7rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.9375rem',
              outline: 'none',
            }}
          >
            <option value="">-- Choose Municipal Officer --</option>
            {officers.map((officer) => {
              const isMatch =
                officer.departmentName?.toLowerCase() === complaint.departmentName?.toLowerCase();
              return (
                <option key={officer.id} value={officer.id}>
                  {officer.name} ({officer.departmentName || 'General'}) {isMatch ? '★ Recommended' : ''}
                </option>
              );
            })}
          </select>

          {/* Selected Officer Preview Card */}
          {selectedOfficer && (
            <div className="officer-preview-card">
              <div className="flex items-center gap-3">
                <div className="officer-preview-avatar">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9375rem' }}>
                    {selectedOfficer.name}
                  </div>
                  <div className="flex items-center gap-3 text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {selectedOfficer.email}
                    </span>
                    {selectedOfficer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {selectedOfficer.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {selectedOfficer.departmentName}
              </div>
            </div>
          )}
        </div>

        {/* Dispatch Remarks */}
        <Textarea
          id="dispatch-remarks-input"
          label="Dispatch Instructions / Remarks"
          placeholder="e.g. Please deploy field team with asphalt mixer today. High traffic priority."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          hint="Officer will receive these remarks in their mobile queue"
        />
      </form>
    </Modal>
  );
}
