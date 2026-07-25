import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import HODLoginPage from "./pages/HODLoginPage";
import StaffPage from "./pages/StaffPage";
import HODDashboard from "./pages/HODDashboard";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [currentView, setCurrentView] = useState(() => {
    if (user?.role === "staff") return "staff-dashboard";
    if (user?.role === "hod") return "hod-dashboard";
    return "landing";
  });

  // HOD viewing Staff Attendance Mode toggle
  const [viewMode, setViewMode] = useState(null); // 'hod' | 'staff'

  useEffect(() => {
    if (user) {
      setViewMode(user.role === "staff" ? "staff" : "hod");
    } else {
      setViewMode(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  const handleLogin = async ({ username, password }) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Invalid credentials");
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    window._sessionExpiredHandled = false;

    setUser(data.user);
    setToken(data.token);
    setViewMode(data.user.role === "staff" ? "staff" : "hod");
    if (data.user.role === "staff") {
      setCurrentView("staff-dashboard");
    } else {
      setCurrentView("hod-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    setViewMode(null);
    setCurrentView("landing");
  };

  // If user is authenticated
  if (user) {
    if (viewMode === "staff") {
      return (
        <div>
          {user.role === "hod" && (
            <div style={{ background: "#1e1b4b", padding: "0.5rem 1rem", textAlign: "center", color: "#a5b4fc", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <span>⚙️ HOD Mode: Viewing Staff Attendance Entry Portal</span>
              <button 
                onClick={() => setViewMode("hod")}
                style={{ marginLeft: "1rem", background: "#6366f1", color: "white", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}
              >
                Switch Back to HOD Admin Dashboard →
              </button>
            </div>
          )}
          <StaffPage user={user} token={token} onLogout={handleLogout} />
        </div>
      );
    }

    return (
      <div>
        <div style={{ background: "#064e3b", padding: "0.5rem 1rem", textAlign: "center", color: "#6ee7b7", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span>🛡️ HOD Admin Portal</span>
          <button 
            onClick={() => setViewMode("staff")}
            style={{ marginLeft: "1rem", background: "#10b981", color: "white", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}
          >
            Open Staff Attendance Portal 📚
          </button>
        </div>
        <HODDashboard user={user} token={token} onLogout={handleLogout} />
      </div>
    );
  }

  // Unauthenticated Views: landing, staff-login, hod-login
  if (currentView === "staff-login") {
    return (
      <StaffLoginPage
        onLogin={handleLogin}
        onBack={() => setCurrentView("landing")}
      />
    );
  }

  if (currentView === "hod-login") {
    return (
      <HODLoginPage
        onLogin={handleLogin}
        onBack={() => setCurrentView("landing")}
      />
    );
  }

  // Default: Landing Page
  return (
    <LandingPage
      onSelectRole={(role) =>
        setCurrentView(role === "staff" ? "staff-login" : "hod-login")
      }
    />
  );
}

export default App;
