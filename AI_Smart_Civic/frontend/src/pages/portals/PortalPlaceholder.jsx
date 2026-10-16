import React from 'react';
import { Shield, User, Briefcase, LayoutDashboard, CheckCircle, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PortalPlaceholder({ portalType = 'citizen' }) {
  const { user, role, logout } = useAuth();

  const portalConfig = {
    citizen: {
      title: 'Citizen Portal',
      subtitle: 'Report municipal hazards, track Gemini AI triage, and submit feedback',
      icon: User,
      glow: 'blue',
      nextPhase: 'Phase 11: Citizen Issue Reporting & GPS Location Uploads',
    },
    officer: {
      title: 'Department Officer Desk',
      subtitle: 'Task dispatch, progress tracking, and resolution proof submission',
      icon: Briefcase,
      glow: 'amber',
      nextPhase: 'Phase 13: Officer Queue, Status Updates & After-Photo Resolution',
    },
    admin: {
      title: 'Municipal Administration Dashboard',
      subtitle: 'City-wide issue monitoring, officer assignment, and SLA analytics',
      icon: LayoutDashboard,
      glow: 'emerald',
      nextPhase: 'Phase 12: Admin Complaint Assignment, Department Workload & Analytics',
    },
  }[portalType] || {
    title: 'Civic Portal',
    subtitle: 'Municipal management workspace',
    icon: Shield,
    glow: 'blue',
    nextPhase: 'Upcoming Phases',
  };

  const IconComponent = portalConfig.icon;

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card
          title={portalConfig.title}
          subtitle={portalConfig.subtitle}
          glow={portalConfig.glow}
          badge={
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              ACTIVE ROLE: {role}
            </span>
          }
          headerAction={
            <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={logout}>
              Sign Out
            </Button>
          }
          footer={
            <div className="flex items-center justify-between" style={{ width: '100%' }}>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                Municipal Session ID: {user?.id} · Authenticated
              </span>
              <div className="flex items-center gap-1" style={{ color: '#10b981', fontSize: '0.8125rem' }}>
                <CheckCircle size={14} />
                <span>JWT Verified</span>
              </div>
            </div>
          }
        >
          <div style={{ margin: '1rem 0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                background: 'var(--bg-elevated)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Authenticated User
                </span>
                <p style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>{user?.name}</p>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Official Email
                </span>
                <p style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>{user?.email}</p>
              </div>

              {user?.departmentName && (
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Assigned Department
                  </span>
                  <p style={{ fontWeight: 600, color: '#38bdf8', marginTop: '0.2rem' }}>
                    {user.departmentName}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Sparkles size={20} style={{ color: '#06b6d4', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#ffffff' }}>
                  Authentication Established
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Protected route guard successfully verified your JWT role credentials. Next step:{' '}
                  <strong>{portalConfig.nextPhase}</strong>.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
