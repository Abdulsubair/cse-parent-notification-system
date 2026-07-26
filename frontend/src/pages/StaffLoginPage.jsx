import React, { useState } from "react";
import "./AuthPages.css";

function StaffLoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState("staff_cse");
  const [password, setPassword] = useState("Staff@2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin({ username, password });
    } catch (err) {
      setError(err.message || "Failed to log in as Staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card staff-auth-theme">
        <button className="back-link" onClick={onBack}>
          ← Back to Main Menu
        </button>

        <div className="auth-header">
          <img src="/college-logo.jpg" alt="Kings College Logo" className="auth-logo-img" />
          <h2>Staff Portal Login</h2>
          <p>CSE Department Absence Notification Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Staff Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. cse_staff"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit staff-submit" disabled={loading}>
            {loading ? "Verifying Credentials..." : "Login to Staff Dashboard"}
          </button>
        </form>

        <div className="demo-hint-box">
          <span>🔑 Default Staff Login Credentials:</span>
          <code>Username: staff_cse | Password: Staff@2026</code>
        </div>
      </div>
    </div>
  );
}

export default StaffLoginPage;
