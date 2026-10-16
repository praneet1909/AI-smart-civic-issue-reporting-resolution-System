import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
  Calendar,
  Eye,
  Camera,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import ResolveComplaintModal from './ResolveComplaintModal';
import OfficerComplaintDetailModal from './OfficerComplaintDetailModal';
import officerService from '../../services/officerService';
import './OfficerDashboard.css';

const STATUS_FILTERS = [
  { label: 'All Tasks', value: 'ALL' },
  { label: 'Pending Start', value: 'PENDING' },
  { label: 'Under Repair', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const fetchOfficerTasks = useCallback(async (pageIndex = 0, status = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await officerService.listComplaints(status, pageIndex, 12);
      setComplaints(response.content || []);
      setPage(response.page || 0);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load assigned field tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficerTasks(page, statusFilter);
  }, [fetchOfficerTasks, page, statusFilter]);

  const handleStartWork = async (complaintId) => {
    try {
      await officerService.startWork(complaintId, 'Field officer initiated onsite hazard resolution');
      fetchOfficerTasks(page, statusFilter);
    } catch (err) {
      alert(`Could not start work: ${err.message}`);
    }
  };

  const handleOpenDetail = async (complaintId) => {
    try {
      const full = await officerService.getComplaintById(complaintId);
      setDetailComplaint(full);
      setDetailModalOpen(true);
    } catch (err) {
      alert(`Could not load issue: ${err.message}`);
    }
  };

  const handleOpenResolve = async (complaint) => {
    try {
      const full = await officerService.getComplaintById(complaint.id);
      setResolveComplaint(full);
      setResolveModalOpen(true);
    } catch (err) {
      alert(`Could not load details: ${err.message}`);
    }
  };

  const handleResolved = () => {
    fetchOfficerTasks(page, statusFilter);
  };

  // Filter complaints locally for search query
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    return (
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate local quick counts
  const countPending = complaints.filter((c) => c.status === 'PENDING').length;
  const countInProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const countResolved = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'FEEDBACK'
  ).length;

  return (
    <div className="officer-dashboard">
      {/* Header Bar */}
      <div className="officer-header-bar">
        <div>
          <h1 className="officer-welcome-title">Field Officer Dispatch Desk</h1>
          <p className="officer-welcome-subtitle">
            Officer: <strong>{user?.name || 'Officer'}</strong>
            {user?.departmentName && (
              <span style={{ color: '#38bdf8', marginLeft: '0.5rem' }}>
                · {user.departmentName}
              </span>
            )}
            <span className="text-muted" style={{ marginLeft: '0.5rem' }}>
              · {user?.email}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="officer-refresh-btn"
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchOfficerTasks(page, statusFilter)}
            disabled={loading}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="officer-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Total Assigned Tasks</span>
            <span className="stat-metric-value">{totalElements}</span>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Awaiting Onsite Start</span>
            <span className="stat-metric-value" style={{ color: countPending > 0 ? '#fbbf24' : '#ffffff' }}>
              {countPending}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Active Under Repair</span>
            <span className="stat-metric-value" style={{ color: countInProgress > 0 ? '#38bdf8' : '#ffffff' }}>
              {countInProgress}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-cyan">
            <PlayCircle size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Completed & Verified</span>
            <span className="stat-metric-value" style={{ color: '#34d399' }}>
              {countResolved}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="complaints-filter-bar">
        <div className="filter-pills-group">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px' }}>
          <Input
            id="officer-search-input"
            placeholder="Search ref #, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            marginBottom: '1.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tasks Grid */}
      {filteredComplaints.length === 0 ? (
        <div className="empty-complaints-box animate-fade-in">
          <div className="empty-icon-circle">
            <Layers size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
            No Assigned Field Tasks Found
          </h3>
          <p className="text-secondary" style={{ maxWidth: '440px' }}>
            {statusFilter !== 'ALL'
              ? 'No tasks match the selected status filter.'
              : 'Your department queue is clear. New citizen reports dispatched by municipal administrators will appear here.'}
          </p>
        </div>
      ) : (
        <div className="officer-tasks-grid">
          {filteredComplaints.map((task) => {
            const isPending = task.status === 'PENDING';
            const isInProgress = task.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                id={`officer-task-card-${task.id}`}
                className="officer-task-card"
              >
                <div>
                  <div className="task-card-header">
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#38bdf8',
                        fontSize: '0.8125rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {task.complaintNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <h3 className="task-card-title">{task.title}</h3>

                  <div className="task-card-meta">
                    <div className="flex items-center gap-1">
                      <Building2 size={13} style={{ color: '#38bdf8' }} />
                      <span>{task.departmentName || 'Department'}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{task.reportedAt ? new Date(task.reportedAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>

                <div className="task-card-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye size={14} />}
                    onClick={() => handleOpenDetail(task.id)}
                  >
                    View Details
                  </Button>

                  {isPending && (
                    <Button
                      id={`start-work-btn-${task.id}`}
                      variant="primary"
                      size="sm"
                      icon={<PlayCircle size={14} />}
                      onClick={() => handleStartWork(task.id)}
                    >
                      Start Work
                    </Button>
                  )}

                  {isInProgress && (
                    <Button
                      id={`resolve-btn-${task.id}`}
                      variant="primary"
                      size="sm"
                      icon={<Camera size={14} />}
                      onClick={() => handleOpenResolve(task)}
                    >
                      Submit Proof
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls-bar">
          <Button
            id="officer-prev-page-btn"
            variant="secondary"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            Previous
          </Button>

          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total)
          </span>

          <Button
            id="officer-next-page-btn"
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Resolve Issue Modal */}
      <ResolveComplaintModal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        complaint={resolveComplaint}
        onResolved={handleResolved}
      />

      {/* Detail Inspection Modal */}
      <OfficerComplaintDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        complaint={detailComplaint}
        onStartWork={handleStartWork}
        onOpenResolve={(c) => {
          setResolveComplaint(c);
          setResolveModalOpen(true);
        }}
      />
    </div>
  );
}
