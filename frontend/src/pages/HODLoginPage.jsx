import React, { useState } from "react";
import "./AuthPages.css";

function HODLoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState("hod_cse");
  const [password, setPassword] = useState("HOD@2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin({ username, password });
    } catch (err) {
      setError(err.message || "Failed to log in as HOD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card hod-auth-theme">
        <button className="back-link" onClick={onBack}>
          ← Back to Main Menu
        </button>

        <div className="auth-header">
          <img src="/college-logo.jpg" alt="Kings College Logo" className="auth-logo-img" />
          <h2>HOD Administrator Login</h2>
          <p>CSE Department Management & Analytics Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>HOD Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. hod_cse"
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

          <button type="submit" className="auth-submit hod-submit" disabled={loading}>
            {loading ? "Authenticating Administrator..." : "Login to HOD Dashboard"}
          </button>
        </form>

        <div className="demo-hint-box hod-hint">
          <span>🔑 Default HOD Login Credentials:</span>
          <code>Username: hod_cse | Password: HOD@2026</code>
        </div>
      </div>
    </div>
  );
}

export default HODLoginPage;
