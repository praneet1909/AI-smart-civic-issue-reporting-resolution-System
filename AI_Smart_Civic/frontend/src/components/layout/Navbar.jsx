import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, User, LogIn, LayoutDashboard, FileText, Briefcase, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'up' | 'down' | 'checking'

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok && mounted) {
          setBackendStatus('up');
        } else if (mounted) {
          setBackendStatus('down');
        }
      } catch {
        if (mounted) setBackendStatus('down');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Shield size={20} />
          </div>
          <span>
            SmartCivic <span className="navbar-brand-ai">AI</span>
          </span>
        </Link>

        <nav>
          <ul className="navbar-nav">
            <li>
              <Link
                to="/"
                className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                to="/citizen"
                className={`navbar-link ${location.pathname.startsWith('/citizen') ? 'active' : ''}`}
              >
                <FileText size={16} />
                <span>Citizen Portal</span>
              </Link>
            </li>
            <li>
              <Link
                to="/officer"
                className={`navbar-link ${location.pathname.startsWith('/officer') ? 'active' : ''}`}
              >
                <Briefcase size={16} />
                <span>Officer Desk</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin"
                className={`navbar-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Administration</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="navbar-right">
          <div className="health-pill" title="Municipal API Health Status">
            <span
              className={`health-dot ${
                backendStatus === 'up' ? 'health-dot-up' : 'health-dot-down'
              }`}
            />
            <span>{backendStatus === 'up' ? 'API Online' : 'API Standby'}</span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2"
                style={{
                  background: 'var(--bg-elevated)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <User size={15} style={{ color: 'var(--civic-primary)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.name || user?.email}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    background: role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : role === 'OFFICER' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: role === 'ADMIN' ? '#f87171' : role === 'OFFICER' ? '#fbbf24' : '#60a5fa',
                  }}
                >
                  {role}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut size={15} />}
                onClick={handleLogout}
                title="Sign Out"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={<LogIn size={15} />}>
                  Sign In
                </Button>
              </Link>

              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
