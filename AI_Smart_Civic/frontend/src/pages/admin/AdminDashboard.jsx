import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Eye,
  Mail,
  Phone,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import AssignOfficerModal from './AssignOfficerModal';
import AdminComplaintDetailModal from './AdminComplaintDetailModal';
import adminService from '../../services/adminService';
import './AdminDashboard.css';

const DEPARTMENTS = [
  'Road Maintenance',
  'Electrical Department',
  'Sanitation Department',
  'Water Supply Department',
  'Sewerage Department',
  'Drainage Department',
  'Environment Department',
  'Parks & Disaster Management',
];

const STATUS_PILLS = [
  { label: 'All Incidents', value: 'ALL' },
  { label: 'Needs Assignment', value: 'NEEDS_ASSIGNMENT' },
  { label: 'Field In-Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved / Feedback', value: 'RESOLVED' },
  { label: 'Closed Cases', value: 'CLOSED' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('triage-queue'); // 'triage-queue' | 'department-workload' | 'officer-roster'
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignComplaint, setAssignComplaint] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const fetchAdminData = useCallback(async (pageIndex = 0) => {
    setLoading(true);
    setError(null);
    try {
      const [complaintsRes, officersRes] = await Promise.all([
        adminService.listComplaints(pageIndex, 15),
        adminService.listOfficers(),
      ]);

      setComplaints(complaintsRes.content || []);
      setPage(complaintsRes.page || 0);
      setTotalPages(complaintsRes.totalPages || 0);
      setTotalElements(complaintsRes.totalElements || 0);
      setOfficers(officersRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load administration data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData(page);
  }, [fetchAdminData, page]);

  const handleOpenDetail = async (complaintId) => {
    try {
      const full = await adminService.getComplaintById(complaintId);
      setDetailComplaint(full);
      setDetailModalOpen(true);
    } catch (err) {
      alert(`Could not load issue: ${err.message}`);
    }
  };

  const handleOpenAssign = async (complaint) => {
    try {
      const full = await adminService.getComplaintById(complaint.id);
      setAssignComplaint(full);
      setAssignModalOpen(true);
    } catch (err) {
      alert(`Could not load details: ${err.message}`);
    }
  };

  const handleStatusUpdated = () => {
    fetchAdminData(page);
  };

  // Filter complaints locally
  const filteredComplaints = complaints.filter((c) => {
    // Status Filter
    let matchesStatus = true;
    if (statusFilter === 'NEEDS_ASSIGNMENT') {
      matchesStatus = c.status === 'AI_VERIFIED' || c.status === 'REPORTED';
    } else if (statusFilter === 'IN_PROGRESS') {
      matchesStatus = c.status === 'ASSIGNED' || c.status === 'PENDING' || c.status === 'IN_PROGRESS';
    } else if (statusFilter === 'RESOLVED') {
      matchesStatus = c.status === 'RESOLVED' || c.status === 'FEEDBACK';
    } else if (statusFilter === 'CLOSED') {
      matchesStatus = c.status === 'CLOSED';
    }

    // Department Filter
    const matchesDept =
      deptFilter === 'ALL' || c.departmentName?.toLowerCase() === deptFilter.toLowerCase();

    // Text Search
    const matchesSearch =
      !searchQuery.trim() ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesDept && matchesSearch;
  });

  // KPI Calculations
  const countPendingTriage = complaints.filter(
    (c) => c.status === 'AI_VERIFIED' || c.status === 'REPORTED'
  ).length;

  const countActiveOps = complaints.filter(
    (c) => c.status === 'ASSIGNED' || c.status === 'PENDING' || c.status === 'IN_PROGRESS'
  ).length;

  const countResolvedCases = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'FEEDBACK'
  ).length;

  return (
    <div className="admin-dashboard">
      {/* Header Bar */}
      <div className="admin-header-bar">
        <div>
          <h1 className="admin-welcome-title">Municipal Administration Center</h1>
          <p className="admin-welcome-subtitle">
            Welcome, <strong>{user?.name || 'Administrator'}</strong>. Oversee city-wide hazard triage, officer workload & resolution SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="admin-refresh-btn"
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchAdminData(page)}
            disabled={loading}
          >
            Refresh City Ledger
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Total City Reports</span>
            <span className="kpi-val">{totalElements}</span>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <FileText size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Needs Officer Dispatch</span>
            <span className="kpi-val" style={{ color: countPendingTriage > 0 ? '#38bdf8' : '#ffffff' }}>
              {countPendingTriage}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-cyan">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Field Operations</span>
            <span className="kpi-val" style={{ color: '#fbbf24' }}>
              {countActiveOps}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Resolved & Closed</span>
            <span className="kpi-val" style={{ color: '#34d399' }}>
              {countResolvedCases}
            </span>
          </div>
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-bar">
        <button
          id="tab-triage-queue"
          className={`admin-tab-btn ${activeTab === 'triage-queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('triage-queue')}
        >
          <LayoutDashboard size={17} />
          <span>Triage & Assignment Queue</span>
        </button>

        <button
          id="tab-department-workload"
          className={`admin-tab-btn ${activeTab === 'department-workload' ? 'active' : ''}`}
          onClick={() => setActiveTab('department-workload')}
        >
          <Building2 size={17} />
          <span>Department Workload & Analytics</span>
        </button>

        <button
          id="tab-officer-roster"
          className={`admin-tab-btn ${activeTab === 'officer-roster' ? 'active' : ''}`}
          onClick={() => setActiveTab('officer-roster')}
        >
          <Users size={17} />
          <span>Field Officers Directory ({officers.length})</span>
        </button>
      </div>

      {/* TAB 1: TRIAGE & ASSIGNMENT QUEUE */}
      {activeTab === 'triage-queue' && (
        <div>
          {/* Toolbar */}
          <div className="admin-toolbar-row">
            <div className="admin-pills-row">
              {STATUS_PILLS.map((p) => (
                <button
                  key={p.value}
                  className={`filter-pill ${statusFilter === p.value ? 'active' : ''}`}
                  onClick={() => setStatusFilter(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="admin-search-group">
              <select
                id="filter-department-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-select"
                style={{
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.8125rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                }}
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <div style={{ minWidth: '220px' }}>
                <Input
                  id="admin-search-input"
                  placeholder="Search ref #, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={14} />}
                />
              </div>
            </div>
          </div>

          {/* Master Table */}
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

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Hazard Title</th>
                  <th>Department & Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No municipal complaints match your current filter settings.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => {
                    const isAIVerified = item.status === 'AI_VERIFIED';
                    const canReassign = ['ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes(item.status);

                    return (
                      <tr key={item.id} id={`admin-complaint-row-${item.id}`}>
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#38bdf8',
                              fontSize: '0.8125rem',
                            }}
                          >
                            {item.complaintNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : 'Recent'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#e2e8f0' }}>
                            {item.departmentName || 'Public Works'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.issueType}
                          </div>
                        </td>
                        <td>
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td>
                          {isAIVerified ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#fbbf24',
                                background: 'rgba(245, 158, 11, 0.1)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <ShieldAlert size={11} />
                              <span>Needs Dispatch</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              Assigned
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {isAIVerified && (
                              <Button
                                id={`assign-btn-${item.id}`}
                                variant="primary"
                                size="sm"
                                icon={<UserCheck size={13} />}
                                onClick={() => handleOpenAssign(item)}
                              >
                                Dispatch
                              </Button>
                            )}

                            {canReassign && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenAssign(item)}
                                title="Reassign to another officer"
                              >
                                Reassign
                              </Button>
                            )}

                            <Button
                              id={`inspect-btn-${item.id}`}
                              variant="ghost"
                              size="sm"
                              icon={<Eye size={14} />}
                              onClick={() => handleOpenDetail(item.id)}
                            >
                              Inspect
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls-bar">
              <Button
                id="admin-prev-page-btn"
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={16} />}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Previous
              </Button>

              <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total incidents)
              </span>

              <Button
                id="admin-next-page-btn"
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
        </div>
      )}

      {/* TAB 2: DEPARTMENT WORKLOAD & ANALYTICS */}
      {activeTab === 'department-workload' && (
        <div className="workload-grid animate-fade-in">
          {DEPARTMENTS.map((deptName) => {
            const deptComplaints = complaints.filter(
              (c) => c.departmentName?.toLowerCase() === deptName.toLowerCase()
            );
            const activeInDept = deptComplaints.filter(
              (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
            ).length;
            const resolvedInDept = deptComplaints.filter(
              (c) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'FEEDBACK'
            ).length;
            const deptOfficers = officers.filter(
              (o) => o.departmentName?.toLowerCase() === deptName.toLowerCase()
            );

            const percentage =
              totalElements > 0 ? Math.round((deptComplaints.length / totalElements) * 100) : 0;

            return (
              <div key={deptName} className="workload-card">
                <div>
                  <div className="workload-header">
                    <div className="workload-title">{deptName}</div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {percentage}% of City Cases
                    </span>
                  </div>

                  <div className="workload-bar-track">
                    <div
                      className="workload-bar-fill"
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    background: 'var(--bg-elevated)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      Active
                    </span>
                    <p style={{ fontWeight: 700, color: '#fbbf24', marginTop: '0.15rem' }}>{activeInDept}</p>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      Resolved
                    </span>
                    <p style={{ fontWeight: 700, color: '#34d399', marginTop: '0.15rem' }}>{resolvedInDept}</p>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      Officers
                    </span>
                    <p style={{ fontWeight: 700, color: '#ffffff', marginTop: '0.15rem' }}>{deptOfficers.length}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>SLA Target: 24-48 Hours</span>
                  <button
                    onClick={() => {
                      setDeptFilter(deptName);
                      setActiveTab('triage-queue');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--civic-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>View Queue</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: FIELD OFFICERS ROSTER */}
      {activeTab === 'officer-roster' && (
        <div className="officers-grid animate-fade-in">
          {officers.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
              No municipal officers registered yet.
            </div>
          ) : (
            officers.map((officer) => (
              <div key={officer.id} className="officer-roster-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--civic-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9375rem' }}>
                        {officer.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        {officer.departmentName || 'General Operations'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: officer.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: officer.enabled ? '#34d399' : '#f87171',
                      border: `1px solid ${officer.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {officer.enabled ? 'Active Duty' : 'Inactive'}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: '#ffffff' }}>{officer.email}</span>
                  </div>
                  {officer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{officer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign / Reassign Officer Modal */}
      <AssignOfficerModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        complaint={assignComplaint}
        officers={officers}
        onAssigned={handleStatusUpdated}
      />

      {/* Admin Complaint Detail & Audit Modal */}
      <AdminComplaintDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        complaint={detailComplaint}
        onOpenAssign={(c) => {
          setAssignComplaint(c);
          setAssignModalOpen(true);
        }}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
