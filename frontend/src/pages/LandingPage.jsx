import React from "react";
import "./LandingPage.css";

function LandingPage({ onSelectRole }) {
  return (
    <div className="landing-container">
      {/* Top Header Navbar */}
      <header className="landing-header">
        <div className="brand-badge">
          <img src="/college-logo.jpg" alt="Kings College Logo" className="landing-logo-img" />
          <div>
            <span className="brand-title">KINGS ENGINEERING COLLEGE</span>
            <span className="brand-subtitle">CSE Department Parent Notification System</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="nav-btn staff-link" onClick={() => onSelectRole("staff")}>
            Staff Login
          </button>
          <button className="nav-btn hod-link" onClick={() => onSelectRole("hod")}>
            HOD Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="badge-pill">✨ Automated Multilingual Parent Alerts</div>
          <h1 className="hero-title">
            Automated Student Absence <br />
            <span className="gradient-text">Parent Notification System</span>
          </h1>
          <p className="hero-subtitle">
            Eliminate manual phone calling. Mark class attendance in one click and automatically dispatch instant dual English & Tamil notifications via SMS & WhatsApp to absent students' parents.
          </p>

          <div className="role-cards-grid">
            {/* Staff Role Card */}
            <div className="role-card staff-card" onClick={() => onSelectRole("staff")}>
              <div className="card-badge staff-badge">Staff Access</div>
              <div className="icon-wrapper staff-icon">📚</div>
              <h3>Staff Portal</h3>
              <p>
                Select Academic Year, Year, Section, and Staff Name to mark daily attendance and automatically notify parents.
              </p>
              <button className="card-cta staff-cta">
                Access Staff Login →
              </button>
            </div>

            {/* HOD Role Card */}
            <div className="role-card hod-card" onClick={() => onSelectRole("hod")}>
              <div className="card-badge hod-badge">Administrator</div>
              <div className="icon-wrapper hod-icon">🛡️</div>
              <h3>HOD Portal</h3>
              <p>
                Monitor message delivery status, view overall department statistics, manage academic years, classes, faculty & student records.
              </p>
              <button className="card-cta hod-cta">
                Access HOD Login →
              </button>
            </div>
          </div>
        </div>

        {/* Feature Preview Box: Message Template Preview */}
        <section className="message-preview-section">
          <h3>📱 Automated Dual-Language Parent Message Preview</h3>
          <p className="preview-desc">
            The system automatically replaces <code>[Student Name]</code> and dispatches the dual English + Tamil notification below:
          </p>
          <div className="message-bubble">
            <div className="message-lang">
              <span className="lang-flag">🇬🇧 English</span>
              <p className="msg-text">
                Dear Parents, Your Son/Daughter <strong className="highlight">Abdul</strong> has not attended the college today.
              </p>
            </div>
            <div className="msg-divider"></div>
            <div className="message-lang">
              <span className="lang-flag">🇮🇳 தமிழ் (Tamil)</span>
              <p className="msg-text tamil-text">
                அன்புள்ள பெற்றோர்களே, உங்கள் மகன்/மகள் <strong className="highlight">அப்துல்</strong> இன்று கல்லூரிக்கு வரவில்லை.
              </p>
            </div>
            <div className="message-meta">
              <span>⚡ Status: Delivered via SMS & WhatsApp</span>
              <span>🕒 Timestamp: Today 09:30 AM</span>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="stats-strip">
          <div className="stat-box">
            <span className="stat-number">100%</span>
            <span className="stat-label">Automated Delivery</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">Dual</span>
            <span className="stat-label">English & Tamil Alerts</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">Real-Time</span>
            <span className="stat-label">HOD Delivery Monitoring</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">Instant</span>
            <span className="stat-label">SMS & WhatsApp Gateway</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
