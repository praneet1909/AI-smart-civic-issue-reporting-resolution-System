import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials } = useAuth();

  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'staff'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickFill = (fillEmail, fillPassword, tab) => {
    setEmail(fillEmail);
    setPassword(fillPassword);
    setActiveTab(tab);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await loginWithCredentials(email, password);
      // Route appropriately based on user role
      const redirectTarget = location.state?.from?.pathname;
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'OFFICER') {
        navigate('/officer', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-glow" />

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-header-icon">
              <Shield size={24} />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in to manage and track municipal civic issues
            </p>
          </div>

          {/* Role Mode Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'citizen' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('citizen');
                setError(null);
              }}
            >
              <UserCheck size={16} />
              <span>Citizen Portal</span>
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('staff');
                setError(null);
              }}
            >
              <Briefcase size={16} />
              <span>Officer & Admin</span>
            </button>
          </div>

          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder={activeTab === 'citizen' ? 'citizen@example.com' : 'officer@aismartcivic.local'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              iconRight={<ArrowRight size={16} />}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : `Sign In as ${activeTab === 'citizen' ? 'Citizen' : 'Staff'}`}
            </Button>
          </form>

          {/* 1-Click Demo Fill Presets */}
          <div className="quick-fill-section">
            <div className="quick-fill-title">Quick Demo Login Presets</div>
            <div className="quick-fill-grid">
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('admin@aismartcivic.local', 'Admin@12345', 'staff')}
              >
                <span className="quick-fill-role">Admin Account</span>
                <span className="quick-fill-cred">admin@aismartcivic...</span>
              </button>

              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('officer.roads@aismartcivic.local', 'Officer@12345', 'staff')}
              >
                <span className="quick-fill-role">Roads Officer</span>
                <span className="quick-fill-cred">officer.roads@...</span>
              </button>
            </div>
          </div>

          <div className="auth-footer-link">
            <span>Don't have a citizen account?</span>
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
