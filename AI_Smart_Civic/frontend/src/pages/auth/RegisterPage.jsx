import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerCitizen, loginWithCredentials } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace('reg-', '');
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerCitizen({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      // Try automatic login immediately after registration
      try {
        await loginWithCredentials(formData.email, formData.password);
        navigate('/citizen', { replace: true });
        return;
      } catch {
        // If auto-login fails, show success screen
        setRegisteredSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card-wrapper">
          <div className="auth-card-glow" />
          <div className="auth-card text-center" style={{ textAlign: 'center' }}>
            <div
              className="auth-header-icon"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <CheckCircle size={24} />
            </div>
            <h1 className="auth-title">Registration Complete!</h1>
            <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>
              Your citizen account has been created. You can now log in to report and track municipal issues.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              iconRight={<ArrowRight size={16} />}
              style={{ width: '100%' }}
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-glow" />

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-header-icon">
              <UserPlus size={24} />
            </div>
            <h1 className="auth-title">Create Citizen Account</h1>
            <p className="auth-subtitle">
              Join the municipal civic platform to report issues with AI tracking
            </p>
          </div>

          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="reg-name"
              label="Full Name"
              placeholder="e.g. Priya Sharma"
              value={formData.name}
              onChange={handleChange}
              icon={<User size={16} />}
              required
            />

            <Input
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="priya@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={16} />}
              required
            />

            <Input
              id="reg-phone"
              label="Phone Number (Optional)"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone size={16} />}
            />

            <Input
              id="reg-password"
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock size={16} />}
              required
            />

            <Input
              id="reg-confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
              {loading ? 'Creating Account...' : 'Register Citizen Account'}
            </Button>
          </form>

          <div className="auth-footer-link">
            <span>Already have an account?</span>
            <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
