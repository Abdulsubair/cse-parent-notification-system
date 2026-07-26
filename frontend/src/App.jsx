import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import HODLoginPage from "./pages/HODLoginPage";
import StaffPage from "./pages/StaffPage";
import HODDashboard from "./pages/HODDashboard";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://cse-parent-notification-system.onrender.com";

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
    let response;
    try {
      response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error(
        `Cannot reach the server at ${API_BASE}. Please try again in a moment.`
      );
    }

    const data = await response.json().catch(() => ({}));
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
      return <StaffPage user={user} token={token} onLogout={handleLogout} />;
    }

    return <HODDashboard user={user} token={token} onLogout={handleLogout} />;
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
