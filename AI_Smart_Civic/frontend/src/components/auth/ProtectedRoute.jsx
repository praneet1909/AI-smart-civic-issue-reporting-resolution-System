import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, role, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Loader2 size={32} className="btn-spinner" style={{ color: 'var(--civic-primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Verifying municipal session credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const userPortalPath =
      role === 'ADMIN' ? '/admin' : role === 'OFFICER' ? '/officer' : '/citizen';

    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div
          className="glass-panel"
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
            Access Restricted
          </h2>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            You are signed in as <strong>{user?.name}</strong> with role{' '}
            <code style={{ color: '#38bdf8' }}>{role}</code>. This portal requires{' '}
            <code style={{ color: '#f59e0b' }}>{allowedRoles.join(' or ')}</code> clearance.
          </p>

          <Link to={userPortalPath}>
            <Button variant="primary" size="md" iconRight={<ArrowRight size={16} />}>
              Go to Your Authorized Portal ({role})
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
