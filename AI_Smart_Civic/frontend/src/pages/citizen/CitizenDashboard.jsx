import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import ReportIssueForm from './ReportIssueForm';
import ComplaintDetailModal from './ComplaintDetailModal';
import complaintService from '../../services/complaintService';
import './CitizenDashboard.css';

const STATUS_FILTERS = [
  { label: 'All Issues', value: 'ALL' },
  { label: 'Reported', value: 'REPORTED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-issues'); // 'my-issues' | 'report-issue'
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for detail modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchComplaints = useCallback(async (pageIndex = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintService.getMyComplaints(pageIndex, 12);
      setComplaints(response.content || []);
      setPage(response.page || 0);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(page);
  }, [fetchComplaints, page]);

  const handleOpenDetail = async (complaintId) => {
    try {
      const full = await complaintService.getComplaintById(complaintId);
      setSelectedComplaint(full);
      setDetailModalOpen(true);
    } catch (err) {
      alert(`Could not load issue details: ${err.message}`);
    }
  };

  const handleComplaintCreated = (_newComplaint) => {
    fetchComplaints(0);
  };

  const handleStatusUpdated = () => {
    fetchComplaints(page);
  };

  // Filter complaints locally for search & status pill
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CLOSED' ? c.status === 'CLOSED' || c.status === 'FEEDBACK' : c.status === statusFilter);

    const matchesSearch =
      !searchQuery.trim() ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Calculate high-level stat counts
  const countActive = complaints.filter(
    (c) => c.status === 'REPORTED' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS'
  ).length;

  const countResolved = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'FEEDBACK'
  ).length;

  return (
    <div className="citizen-dashboard">
      {/* Header Bar */}
      <div className="citizen-header-bar">
        <div>
          <h1 className="citizen-welcome-title">Citizen Command Desk</h1>
          <p className="citizen-welcome-subtitle">
            Welcome, <strong>{user?.name || 'Citizen'}</strong>. Report local infrastructure hazards with GPS & track AI-driven resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="refresh-complaints-btn"
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchComplaints(page)}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            id="report-issue-cta-btn"
            variant={activeTab === 'report-issue' ? 'secondary' : 'primary'}
            icon={<PlusCircle size={16} />}
            onClick={() => setActiveTab(activeTab === 'report-issue' ? 'my-issues' : 'report-issue')}
          >
            {activeTab === 'report-issue' ? 'View My Complaints' : 'Report Civic Issue'}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="citizen-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Total Submissions</span>
            <span className="stat-metric-value">{totalElements}</span>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Active / Field In-Progress</span>
            <span className="stat-metric-value">{countActive}</span>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Resolved / Closed</span>
            <span className="stat-metric-value">{countResolved}</span>
          </div>
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-info">
            <span className="stat-metric-label">Gemini AI Triage</span>
            <span className="stat-metric-value" style={{ color: 'var(--civic-cyan)', fontSize: '1.35rem' }}>
              Active (Fast)
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-cyan">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs-bar">
        <button
          id="tab-my-issues"
          className={`dashboard-tab-btn ${activeTab === 'my-issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-issues')}
        >
          <FileText size={17} />
          <span>My Reported Issues ({totalElements})</span>
        </button>

        <button
          id="tab-report-hazard"
          className={`dashboard-tab-btn ${activeTab === 'report-issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('report-issue')}
        >
          <PlusCircle size={17} />
          <span>Report New Hazard (GPS & Photo)</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'report-issue' ? (
        <ReportIssueForm
          onComplaintCreated={handleComplaintCreated}
          onCancel={() => setActiveTab('my-issues')}
        />
      ) : (
        <div>
          {/* Search & Filter Pills */}
          <div className="complaints-filter-bar">
            <div className="filter-pills-group">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`filter-pill ${statusFilter === f.value ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ minWidth: '260px' }}>
              <Input
                id="search-complaints-input"
                placeholder="Search by title, ref #, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={15} />}
              />
            </div>
          </div>

          {/* Error Message */}
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
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && complaints.length === 0 ? (
            <div className="empty-complaints-box animate-pulse">
              <RefreshCw size={36} className="animate-spin text-muted" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#ffffff', fontSize: '1.125rem' }}>Loading your municipal records...</h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Connecting to backend complaint ledger
              </p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            /* Empty State */
            <div className="empty-complaints-box animate-fade-in">
              <div className="empty-icon-circle">
                <FileText size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No matching complaints found'
                  : 'No Civic Issues Reported Yet'}
              </h3>
              <p className="text-secondary" style={{ maxWidth: '440px', marginBottom: '1.5rem' }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search terms or filter criteria.'
                  : 'Notice a pothole, leaking water main, or overflowing garbage container in your neighborhood? Report it with a single photo.'}
              </p>
              {!(searchQuery || statusFilter !== 'ALL') && (
                <Button
                  id="empty-state-report-btn"
                  variant="primary"
                  icon={<PlusCircle size={16} />}
                  onClick={() => setActiveTab('report-issue')}
                >
                  File Your First Report
                </Button>
              )}
            </div>
          ) : (
            /* Complaints Cards Grid */
            <>
              <div className="complaints-cards-grid">
                {filteredComplaints.map((item) => (
                  <div
                    key={item.id}
                    id={`complaint-card-${item.id}`}
                    className="complaint-item-card"
                    onClick={() => handleOpenDetail(item.id)}
                  >
                    <div>
                      <div className="complaint-card-header">
                        <span className="complaint-ref-chip">{item.complaintNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={item.status} />
                          <PriorityBadge priority={item.priority} />
                        </div>
                      </div>

                      <h3 className="complaint-card-title">{item.title}</h3>

                      <div className="complaint-card-meta">
                        <div className="flex items-center gap-1">
                          <Building2 size={13} style={{ color: '#38bdf8' }} />
                          <span>{item.departmentName || 'Public Works'}</span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={13} />
                          <span>{item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="complaint-card-footer">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Category: <strong style={{ color: '#ffffff' }}>{item.issueType}</strong>
                      </span>
                      <div className="flex items-center gap-1" style={{ color: 'var(--civic-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <span>Timeline & Details</span>
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-controls-bar">
                  <Button
                    id="prev-page-btn"
                    variant="secondary"
                    size="sm"
                    icon={<ChevronLeft size={16} />}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    disabled={page === 0 || loading}
                  >
                    Previous
                  </Button>

                  <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total)
                  </span>

                  <Button
                    id="next-page-btn"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Complaint Detail & Lifecycle Timeline Modal */}
      <ComplaintDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        complaint={selectedComplaint}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
