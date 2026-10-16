import React, { useState, useEffect } from 'react';
import {
  Shield, Sparkles, Activity, CheckCircle, ArrowRight,
  Droplets, Zap, Trash2, Truck, Waves, TreePine, AlertTriangle, RefreshCw
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import AiConfidenceBadge from '../components/ui/AiConfidenceBadge';
import Modal from '../components/ui/Modal';
import './HomePage.css';

const CIVIC_CATEGORIES = [
  { name: 'Potholes & Road Damage', dept: 'Road Maintenance', icon: AlertTriangle },
  { name: 'Streetlight Outages', dept: 'Electrical Department', icon: Zap },
  { name: 'Garbage & Waste Overflow', dept: 'Sanitation Department', icon: Trash2 },
  { name: 'Water Pipe Leakage', dept: 'Water Supply Department', icon: Droplets },
  { name: 'Gutter & Manhole Chambers', dept: 'Sewerage Department', icon: Truck },
  { name: 'Drainage & Stormwater', dept: 'Drainage Department', icon: Waves },
  { name: 'River & Plastic Pollution', dept: 'Environment Department', icon: Waves },
  { name: 'Fallen Trees & Obstructions', dept: 'Parks & Disaster Mgmt', icon: TreePine },
];

const ALL_STATUSES = [
  'REPORTED', 'AI_VERIFIED', 'ASSIGNED', 'PENDING',
  'IN_PROGRESS', 'RESOLVED', 'FEEDBACK', 'CLOSED'
];

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const json = await res.json();
      setHealthData({ status: res.status, data: json, time: new Date().toLocaleTimeString() });
    } catch (err) {
      setHealthData({ status: 503, error: err.message, time: new Date().toLocaleTimeString() });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section container">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Next-Gen Municipal Governance · Powered by Gemini AI</span>
        </div>

        <h1 className="heading-display hero-title">
          Intelligent Civic Action, <br />
          <span className="text-gradient-civic">Zero Delays.</span>
        </h1>

        <p className="hero-desc">
          Report municipal issues in seconds with automated photo analysis, instant AI
          department triage, and transparent end-to-end resolution tracking.
        </p>

        <div className="hero-actions">
          <Button
            variant="primary"
            size="lg"
            icon={<Sparkles size={18} />}
            iconRight={<ArrowRight size={18} />}
            onClick={() => setModalOpen(true)}
          >
            Report an Issue
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const el = document.getElementById('design-system');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Design System
          </Button>
        </div>

        {/* Stats Banner */}
        <div className="stats-banner">
          <div className="stat-card">
            <div className="stat-value text-gradient-ai">99.2%</div>
            <div className="stat-label">AI Triage Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-gradient-civic">&lt; 30s</div>
            <div className="stat-label">Intake to Dispatch</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#10b981' }}>14,280+</div>
            <div className="stat-label">Issues Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ec4899' }}>100%</div>
            <div className="stat-label">Photo Verified</div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container">
        <div className="section-header">
          <span className="section-tag">Controlled Taxonomy</span>
          <h2 className="heading-2">8 Specialized Civic Sectors</h2>
          <p className="section-desc">
            Incoming complaints are automatically mapped to municipal department teams.
          </p>
        </div>

        <div className="categories-grid">
          {CIVIC_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="category-chip">
                <div className="category-icon-box">
                  <Icon size={18} />
                </div>
                <div className="category-info">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-dept">{cat.dept}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Design System & Component Matrix */}
      <section id="design-system" className="showcase-section container">
        <div className="section-header">
          <span className="section-tag">Modern Civic Design System</span>
          <h2 className="heading-2">Component & Lifecycle Matrix</h2>
          <p className="section-desc">
            Reusable Vanilla CSS tokens, status badges, urgency levels, and glass panels.
          </p>
        </div>

        {/* Lifecycle Status Pipeline */}
        <Card
          title="Complaint Lifecycle Progression"
          subtitle="All 8 state transitions from citizen submission to final closure"
          glow="blue"
          style={{ marginBottom: '2rem' }}
        >
          <div className="flex flex-wrap gap-3" style={{ marginTop: '0.75rem' }}>
            {ALL_STATUSES.map((st) => (
              <StatusBadge key={st} status={st} />
            ))}
          </div>
        </Card>

        {/* Priority & AI Badges */}
        <div className="responsive-grid-3" style={{ marginBottom: '2rem' }}>
          <Card title="Urgency Priority Matrix" subtitle="Strict SLA priority tags">
            <div className="flex flex-wrap gap-2" style={{ marginTop: '0.5rem' }}>
              <PriorityBadge priority="LOW" />
              <PriorityBadge priority="MEDIUM" />
              <PriorityBadge priority="HIGH" />
              <PriorityBadge priority="CRITICAL" />
            </div>
          </Card>

          <Card title="AI Intelligence Tags" subtitle="Gemini Confidence & Fallback">
            <div className="flex flex-col gap-2" style={{ marginTop: '0.5rem' }}>
              <AiConfidenceBadge status="SUCCESS" confidence={0.96} />
              <AiConfidenceBadge status="FALLBACK" />
              <AiConfidenceBadge status="PENDING" />
            </div>
          </Card>

          <Card title="Interactive Button Tokens" subtitle="Modern glass & civic gradients">
            <div className="flex flex-wrap gap-2" style={{ marginTop: '0.5rem' }}>
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="danger" size="sm">Action</Button>
            </div>
          </Card>
        </div>

        {/* Sample Interactive Complaint Card */}
        <Card
          title="Sample Issue: CIVIC-2026-001048"
          subtitle="Reported at MG Road, Shivaji Nagar"
          glow="emerald"
          badge={<StatusBadge status="RESOLVED" />}
          headerAction={<PriorityBadge priority="HIGH" />}
          footer={
            <>
              <AiConfidenceBadge status="SUCCESS" confidence={0.94} />
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                Resolved by Road Maintenance Officer
              </span>
            </>
          }
        >
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Deep asphalt crater on northern lane causing severe traffic hazard and vehicle damage.
          </p>
          <div className="flex items-center gap-4 text-secondary" style={{ fontSize: '0.875rem' }}>
            <span>📍 18.5204° N, 73.8567° E</span>
            <span>⏱️ Resolved in 4h 12m</span>
            <span>⭐ Rated 5/5 by Citizen</span>
          </div>
        </Card>

        {/* Live Backend Health Checker */}
        <div className="health-checker-card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <div className="flex items-center gap-3">
              <Activity size={22} className="text-gradient-civic" />
              <div>
                <h3 className="heading-3">Backend API Connectivity</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  Live polling of <code style={{ color: '#38bdf8' }}>GET /api/health</code>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={healthLoading ? 'btn-spinner' : ''} />}
              onClick={fetchHealth}
              loading={healthLoading}
            >
              Refresh
            </Button>
          </div>

          <div
            style={{
              background: '#090d16',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {healthData ? (
              <div>
                <span style={{ color: healthData.status === 200 ? '#10b981' : '#f59e0b' }}>
                  HTTP {healthData.status} {healthData.status === 200 ? 'OK' : 'OFFLINE'}
                </span>
                <span className="text-muted"> · Polled at {healthData.time}</span>
                <pre style={{ marginTop: '0.5rem', color: '#94a3b8' }}>
                  {JSON.stringify(healthData.data || { error: healthData.error }, null, 2)}
                </pre>
              </div>
            ) : (
              <span className="text-muted">Connecting to municipal API...</span>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report a Civic Issue"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Continue to Portal
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: '1rem' }}>
          The citizen submission portal with multipart photo upload, geolocation tagging,
          and automated Gemini classification will be wired in Phase 10 & 11!
        </p>
        <div className="flex flex-col gap-2">
          <AiConfidenceBadge status="SUCCESS" confidence={0.98} />
          <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
            All UI components in this modal use the Phase 9 design system tokens.
          </p>
        </div>
      </Modal>
    </div>
  );
}
