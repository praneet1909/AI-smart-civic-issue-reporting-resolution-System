import React from 'react';
import { Shield, Sparkles, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="flex items-center gap-2">
              <div className="navbar-logo-icon" style={{ width: 32, height: 32 }}>
                <Shield size={16} />
              </div>
              <span className="footer-brand-title">
                SmartCivic <span className="navbar-brand-ai">AI</span>
              </span>
            </div>
            <p className="footer-desc">
              Empowering citizens and municipal departments with intelligent complaint
              triage, real-time resolution verification, and civic accountability.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Portals</h4>
            <ul className="footer-links">
              <li><a href="#citizens" className="footer-link">Citizen Reporting</a></li>
              <li><a href="#officers" className="footer-link">Officer Field Desk</a></li>
              <li><a href="#admin" className="footer-link">Department Admin</a></li>
              <li><a href="#tracking" className="footer-link">Complaint Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Civic Sectors</h4>
            <ul className="footer-links">
              <li><span className="footer-link">Road Maintenance</span></li>
              <li><span className="footer-link">Sanitation & Waste</span></li>
              <li><span className="footer-link">Water & Drainage</span></li>
              <li><span className="footer-link">Electrical & Lights</span></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">AI Engine</h4>
            <ul className="footer-links">
              <li><span className="footer-link">Gemini 1.5 Multimodal Triage</span></li>
              <li><span className="footer-link">Sub-second Auto Categorization</span></li>
              <li><span className="footer-link">Photo Verification Matcher</span></li>
              <li><span className="footer-link">Automated Department Routing</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Municipal Corporation. All civic rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built for Modern Smart Cities</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
