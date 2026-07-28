import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./HODDashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://cse-parent-notification-system.onrender.com";

// PDF.js dynamic CDN loader
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

function HODDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState("summary"); // summary | academic-years | sections | staff | students | parents | attendance | messages

  // Summary state
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // CRUD state data
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [students, setStudents] = useState([]);

  // Form input states
  const [newYearRange, setNewYearRange] = useState("");
  const [newSecYear, setNewSecYear] = useState("Second Year");
  const [newSecName, setNewSecName] = useState("");

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");

  const [newStudent, setNewStudent] = useState({
    registerNumber: "",
    name: "",
    gender: "Male",
    year: "Second Year",
    section: "CSE A",
    academicYear: "2026-2027",
    parentName: "",
    relationship: "Father",
    mobileNumber: "",
    whatsappNumber: "",
  });

  // Student filtering and multi-select deletion state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterYear, setStudentFilterYear] = useState("");
  const [studentFilterSection, setStudentFilterSection] = useState("");

  // Helper: auto-logout on expired/invalid token (fires only once across all concurrent calls)
  // Guard: never display a phone number in a parent name field
  const safeParentName = (val) => {
    if (!val) return "Parent";
    const digits = String(val).replace(/\D/g, "");
    if (digits.length >= 8 && /^\d[\d\s\-+().]{6,}$/.test(String(val).trim())) return "Parent";
    return val;
  };

  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401 && !window._sessionExpiredHandled) {
      window._sessionExpiredHandled = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => {
        alert("Your session has expired. Please log in again.");
        onLogout();
        window._sessionExpiredHandled = false;
      }, 0);
      throw new Error("Session expired");
    }
    return res;
  };

  // Bulk upload state for Student Management tab
  const [previewStudents, setPreviewStudents] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [uploadAcademicYear, setUploadAcademicYear] = useState("2026-2027");
  const [uploadYear, setUploadYear] = useState("Second Year");
  const [uploadSection, setUploadSection] = useState("CSE A");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    try {
      const fileName = file.name.toLowerCase();
      let parsedList = [];

      if (fileName.endsWith(".pdf")) {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let lines = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          const itemsByY = {};
          textContent.items.forEach((item) => {
            const y = Math.round(item.transform[5] * 10) / 10;
            let foundGroup = false;
            for (const groupY of Object.keys(itemsByY)) {
              if (Math.abs(parseFloat(groupY) - y) < 4) {
                itemsByY[groupY].push(item);
                foundGroup = true;
                break;
              }
            }
            if (!foundGroup) itemsByY[y] = [item];
          });

          const sortedYs = Object.keys(itemsByY).sort((a, b) => parseFloat(b) - parseFloat(a));
          sortedYs.forEach((y) => {
            const lineText = itemsByY[y]
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map((item) => item.str)
              .join(" ")
              .trim();
            if (lineText) lines.push(lineText);
          });
        }

        lines.forEach((line) => {
          const mobileMatch = line.match(/\b[6-9]\d{9}\b/) || line.match(/\b\d{10}\b/);
          if (!mobileMatch) return;
          const mobileNumber = mobileMatch[0];

          const regCandidates = line.match(/\b[a-zA-Z0-9-]{5,15}\b/g) || [];
          const registerNumber = regCandidates.find(
            (c) => c !== mobileNumber && !/^\d{1,4}$/.test(c) && !/^(mobile|phone|student|register|number|name|father|mother|parent)$/i.test(c)
          );
          if (!registerNumber) return;

          let remaining = line.replace(registerNumber, "").replace(mobileNumber, "").trim();
          remaining = remaining.replace(/[^a-zA-Z\s.]/g, " ").replace(/\s+/g, " ").trim();
          const words = remaining.split(" ").filter((w) => w.length > 0);

          let name = "Student";
          let parentName = "Parent";

          if (words.length > 0) {
            const nonInitialWords = words.filter((w) => w.length > 2);
            if (nonInitialWords.length <= 1) {
              name = words.join(" ");
              parentName = "Parent";
            } else {
              const mid = Math.ceil(words.length / 2);
              name = words.slice(0, mid).join(" ");
              parentName = words.slice(mid).join(" ");
            }
          }

          let gender = "Male";
          if (/\b(female|girl)\b/i.test(line)) {
            gender = "Female";
          }

          parsedList.push({ registerNumber, name: name || "Student", parentName: parentName || "Parent", mobileNumber, gender, relationship: "Father" });
        });

      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length > 0) {
          const headerRow = rows[0].map((cell) => String(cell).toLowerCase().trim());
          let regIdx = -1, nameIdx = -1, parentIdx = -1, mobileIdx = -1;

          headerRow.forEach((cell, idx) => {
            const c = String(cell).toLowerCase().trim();

            // 1. Mobile/Phone/Contact column check FIRST!
            if (
              mobileIdx === -1 &&
              (c.includes("mobile") || c.includes("phone") || c.includes("contact") || c.includes("whatsapp"))
            ) {
              mobileIdx = idx;
            }
            // 2. Register Number / Roll No / ID check
            else if (
              regIdx === -1 &&
              (c.includes("reg") || c.includes("roll") || c.includes("registration") || c.includes("student id") || c === "id") &&
              !c.includes("guid")
            ) {
              regIdx = idx;
            }
            // 3. Parent Name / Father Name / Mother Name / Guardian Name check
            else if (
              parentIdx === -1 &&
              (c.includes("parent") || c.includes("father") || c.includes("mother") || c.includes("guardian")) &&
              !c.includes("mobile") &&
              !c.includes("phone") &&
              !c.includes("contact") &&
              !c.includes("number")
            ) {
              parentIdx = idx;
            }
            // 4. Student Name check
            else if (
              nameIdx === -1 &&
              (c.includes("student") || c === "name" || c.includes("candidate") || c.includes("student name"))
            ) {
              nameIdx = idx;
            }
          });

          const startIndex = (regIdx !== -1 || nameIdx !== -1 || mobileIdx !== -1) ? 1 : 0;
          for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            let registerNumber = regIdx !== -1 && row[regIdx] ? String(row[regIdx]).trim() : "";
            let name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : "";
            let parentName = parentIdx !== -1 && row[parentIdx] ? String(row[parentIdx]).trim() : "";
            let mobileNumber = mobileIdx !== -1 && row[mobileIdx] ? String(row[mobileIdx]).trim() : "";

            // Fallback matching if headers were missing or ambiguous
            if (!registerNumber || !mobileNumber || !name) {
              row.forEach((cell) => {
                const cellStr = String(cell).trim();
                const digits = cellStr.replace(/\D/g, "");

                // 10-digit mobile number
                if (digits.length === 10 && !mobileNumber) {
                  mobileNumber = digits;
                }
                // Alphanumeric Register Number
                else if (/^[a-zA-Z0-9-]{5,15}$/.test(cellStr) && !/^\d{10}$/.test(digits) && !registerNumber) {
                  registerNumber = cellStr;
                }
                // Text Names
                else if (/^[a-zA-Z\s.]{2,50}$/.test(cellStr) && !/^(male|female|father|mother|guardian)$/i.test(cellStr)) {
                  if (!name) name = cellStr;
                  else if (!parentName && cellStr !== name) parentName = cellStr;
                }
              });
            }

            // Clean mobileNumber (must be 10 digits)
            if (mobileNumber) {
              mobileNumber = mobileNumber.replace(/\D/g, "");
              if (mobileNumber.length > 10) mobileNumber = mobileNumber.slice(-10);
            }

            // Ensure parentName is NEVER a phone number
            if (parentName && /^\d+$/.test(parentName.replace(/\D/g, ""))) {
              parentName = "";
            }

            if (registerNumber && mobileNumber) {
              parsedList.push({
                registerNumber,
                name: name || "Student",
                parentName: parentName || "Parent",
                mobileNumber,
                gender: "Male",
                relationship: "Father",
              });
            }
          }
        }
      } else {
        throw new Error("Unsupported file format. Please upload PDF, Excel (.xlsx/.xls), or CSV.");
      }

      if (parsedList.length === 0) {
        throw new Error("No student records found in the file. Ensure it has Register Numbers and 10-digit mobile numbers.");
      }

      setPreviewStudents(parsedList);
      setShowPreviewModal(true);
    } catch (err) {
      alert(err.message || "Failed to parse file.");
    } finally {
      setParsingFile(false);
      e.target.value = "";
    }
  };

  const handleSaveBulkStudents = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/master/students/bulk`, {
        method: "POST",
        body: JSON.stringify({
          students: previewStudents,
          academicYear: uploadAcademicYear,
          year: uploadYear,
          section: uploadSection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save student list");
      alert(`✅ ${data.message || "Student list saved successfully!"}`);
      setShowPreviewModal(false);
      setPreviewStudents([]);
      fetchAllMasterData();
    } catch (err) {
      if (err.message !== "Session expired") {
        alert("❌ " + err.message);
      }
    }
  };

  const handlePreviewStudentChange = (idx, field, value) => {
    setPreviewStudents((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleDeletePreviewStudent = (idx) => {
    setPreviewStudents((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (!token) return;
    fetchSummary();
    fetchLogs();
    fetchAllMasterData();
  }, [token]);

  const fetchSummary = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/hod/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      if (err.message !== "Session expired") console.error("Summary error:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      console.log("Fetching HOD logs...");
      const res = await authFetch(`${API_BASE}/api/attendance/hod/logs?limit=50`);
      console.log("Logs response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Logs data received:", data);
        setLogs(data.logs || []);
        console.log("Logs set to state:", data.logs?.length || 0);
      } else {
        const errorData = await res.json();
        console.error("Logs API error:", errorData);
      }
    } catch (err) {
      if (err.message !== "Session expired") console.error("Logs error:", err);
    }
  };

  const fetchAllMasterData = async () => {
    setLoading(true);
    try {
      const [ayRes, secRes, staffRes, stRes] = await Promise.all([
        authFetch(`${API_BASE}/api/master/academic-years`),
        authFetch(`${API_BASE}/api/master/sections`),
        authFetch(`${API_BASE}/api/master/staff`),
        authFetch(`${API_BASE}/api/master/students`),
      ]);

      if (ayRes.ok) {
        const data = await ayRes.json();
        setAcademicYears(data.academicYears || []);
      }
      if (secRes.ok) {
        const data = await secRes.json();
        setSections(data.sections || []);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
      if (stRes.ok) {
        const data = await stRes.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      if (err.message !== "Session expired") console.error("Master data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Academic Year
  const handleAddAcademicYear = async (e) => {
    e.preventDefault();
    if (!newYearRange) return;
    try {
      const res = await fetch(`${API_BASE}/api/master/academic-years`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ yearRange: newYearRange, isCurrent: false }),
      });
      if (res.ok) {
        setNewYearRange("");
        fetchAllMasterData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Section
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSecName) return;
    try {
      const res = await fetch(`${API_BASE}/api/master/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ year: newSecYear, sectionName: newSecName }),
      });
      if (res.ok) {
        setNewSecName("");
        fetchAllMasterData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Staff User
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUsername || !newStaffPassword) return;
    try {
      const res = await fetch(`${API_BASE}/api/master/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newStaffName,
          username: newStaffUsername,
          password: newStaffPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewStaffName("");
        setNewStaffUsername("");
        setNewStaffPassword("");
        fetchAllMasterData();
        alert("Staff user created successfully!");
      } else {
        alert(data.message || "Failed to add staff");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/master/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (res.ok) {
        setNewStudent({
          registerNumber: "",
          name: "",
          gender: "Male",
          year: "Second Year",
          section: "CSE A",
          parentName: "",
          relationship: "Father",
          mobileNumber: "",
          whatsappNumber: "",
        });
        fetchAllMasterData();
        alert("Student & Parent registered successfully!");
      } else {
        alert(data.message || "Failed to add student");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Custom Delete Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    studentId: null,
    studentName: "",
    registerNumber: "",
    isBulk: false,
    count: 0,
  });
  const [deleting, setDeleting] = useState(false);

  // Trigger modal for single student delete
  const openDeleteModalForStudent = (studentId, studentName, registerNumber) => {
    setDeleteConfirmModal({
      isOpen: true,
      studentId,
      studentName,
      registerNumber,
      isBulk: false,
      count: 1,
    });
  };

  // Trigger modal for bulk student delete
  const openDeleteModalForBulk = () => {
    if (selectedStudentIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      studentId: null,
      studentName: "",
      registerNumber: "",
      isBulk: true,
      count: selectedStudentIds.length,
    });
  };

  const closeDeleteModal = () => {
    setDeleteConfirmModal({
      isOpen: false,
      studentId: null,
      studentName: "",
      registerNumber: "",
      isBulk: false,
      count: 0,
    });
  };

  // Execute deletion after user confirms in custom modal
  const executeDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      if (deleteConfirmModal.isBulk) {
        let successCount = 0;
        for (const id of selectedStudentIds) {
          const res = await fetch(`${API_BASE}/api/master/students/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) successCount++;
        }
        setSelectedStudentIds([]);
        fetchAllMasterData();
      } else if (deleteConfirmModal.studentId) {
        const res = await fetch(`${API_BASE}/api/master/students/${deleteConfirmModal.studentId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setSelectedStudentIds((prev) => prev.filter((id) => id !== deleteConfirmModal.studentId));
          fetchAllMasterData();
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  // Filtered Students list
  const filteredStudents = students.filter((st) => {
    const matchesYear = !studentFilterYear || st.year === studentFilterYear;
    const matchesSection = !studentFilterSection || st.section === studentFilterSection;
    const matchesSearch =
      !studentSearch ||
      st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.registerNumber.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesYear && matchesSection && matchesSearch;
  });

  const isAllStudentsSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((st) => selectedStudentIds.includes(st._id));

  const handleToggleSelectAllStudents = () => {
    if (isAllStudentsSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((st) => st._id));
    }
  };

  const handleToggleStudentSelect = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="hod-layout">
      {/* Top Header */}
      <header className="hod-header">
        <div className="brand-badge">
          <img src="/college-logo.jpg" alt="Kings College Logo" className="brand-logo-img" />
          <div>
            <h2>CSE HOD Administrator Portal</h2>
            <span>Department Monitoring & Master Data Management</span>
          </div>
        </div>
        <div className="user-control">
          <span>Welcome, <strong>{user?.name || "HOD Admin"}</strong></span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Workspace Container */}
      <div className="hod-workspace">
        {/* Sidebar Nav */}
        <aside className="hod-sidebar">
          <button
            className={`nav-tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            📊 Dashboard Summary
          </button>
          <button
            className={`nav-tab ${activeTab === "academic-years" ? "active" : ""}`}
            onClick={() => setActiveTab("academic-years")}
          >
            📅 Academic Years
          </button>
          <button
            className={`nav-tab ${activeTab === "sections" ? "active" : ""}`}
            onClick={() => setActiveTab("sections")}
          >
            🏫 Classes & Sections
          </button>
          <button
            className={`nav-tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            👨‍🎓 Student Management
          </button>
          <button
            className={`nav-tab ${activeTab === "parents" ? "active" : ""}`}
            onClick={() => setActiveTab("parents")}
          >
            👨‍👩‍👧 Parent Contacts
          </button>
          <button
            className={`nav-tab ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            📱 Message Delivery Logs
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="hod-main-content">
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="tab-pane">
              <h3>📈 Department Absence Notification Overview</h3>

              <div className="summary-cards-grid">
                <div className="summary-card card-total">
                  <span>Total Notifications Dispatched</span>
                  <strong>{summary?.totalMessages ?? logs.length}</strong>
                  <small>SMS & WhatsApp alerts</small>
                </div>
                <div className="summary-card card-success">
                  <span>Successful Deliveries</span>
                  <strong>{summary?.statusSummary?.SUCCESS ?? logs.filter(l => l.overallStatus === 'SUCCESS').length}</strong>
                  <small>Parent phones reached</small>
                </div>
                <div className="summary-card card-failed">
                  <span>Failed Deliveries</span>
                  <strong>{summary?.statusSummary?.FAILED ?? 0}</strong>
                  <small>Requires HOD review</small>
                </div>
              </div>

              <div className="recent-activity-section">
                <h4>Recent Message Deliveries</h4>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Parent Contact</th>
                        <th>SMS Status</th>
                        <th>WhatsApp Status</th>
                        <th>Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 10).map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt || log.date).toLocaleString()}</td>
                          <td>
                            <strong>{log.studentId?.name || "Student"}</strong>
                            <small className="block-sub">{log.studentId?.registerNumber}</small>
                          </td>
                          <td>{log.year} - {log.section}</td>
                          <td>{log.parentId?.name} (📱 {log.sms?.mobileNumber})</td>
                          <td><span className={`badge ${
                            log.sms?.status === 'SENT' || log.sms?.status === 'DELIVERED' ? 'badge-success' :
                            log.sms?.status === 'FAILED' ? 'badge-danger' :
                            'badge-info'
                          }`}>{log.sms?.status || 'PENDING'}</span></td>
                          <td><span className={`badge ${
                            log.whatsapp?.status === 'SENT' || log.whatsapp?.status === 'DELIVERED' || log.whatsapp?.status === 'READ' ? 'badge-success' :
                            log.whatsapp?.status === 'FAILED' ? 'badge-danger' :
                            log.whatsapp?.status === 'DISABLED' ? 'badge-info' :
                            'badge-info'
                          }`}>{log.whatsapp?.status || 'N/A'}</span></td>
                          <td><span className={`badge ${
                            log.overallStatus === 'SUCCESS' ? 'badge-emerald' :
                            log.overallStatus === 'FAILED' ? 'badge-danger' :
                            log.overallStatus === 'PARTIAL' ? 'badge-warning' :
                            'badge-info'
                          }`}>{log.overallStatus || 'PENDING'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC YEARS */}
          {activeTab === "academic-years" && (
            <div className="tab-pane">
              <h3>📅 Academic Year Management</h3>
              <p className="tab-desc">Configure academic sessions for the CSE Department.</p>

              <form onSubmit={handleAddAcademicYear} className="inline-form">
                <input
                  type="text"
                  placeholder="e.g. 2028–2029"
                  value={newYearRange}
                  onChange={(e) => setNewYearRange(e.target.value)}
                  required
                />
                <button type="submit" className="add-btn">+ Add Academic Year</button>
              </form>

              <div className="cards-grid">
                {academicYears.map((ay) => (
                  <div key={ay._id || ay.yearRange} className="info-card">
                    <span className="card-tag">Academic Year</span>
                    <h4>{ay.yearRange}</h4>
                    {ay.isCurrent && <span className="status-pill">Active Current</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SECTIONS */}
          {activeTab === "sections" && (
            <div className="tab-pane">
              <h3>🏫 Year & Section Management</h3>
              <p className="tab-desc">Manage Second Year, Third Year, and Final Year sections (CSE A, CSE B).</p>

              <form onSubmit={handleAddSection} className="inline-form">
                <select value={newSecYear} onChange={(e) => setNewSecYear(e.target.value)}>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
                <input
                  type="text"
                  placeholder="Section Name (e.g. CSE B)"
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  required
                />
                <button type="submit" className="add-btn">+ Add Section</button>
              </form>

              <div className="cards-grid">
                {sections.map((sec) => {
                  let displayName = sec.sectionName || "";
                  if (/CSDA|CSD-A|CSD A/i.test(displayName)) displayName = "CSE A";
                  else if (/CSDB|CSD-B|CSD B/i.test(displayName)) displayName = "CSE B";
                  else displayName = displayName.replace(/CSD/gi, "CSE");

                  let displayYear = sec.year || "";
                  if (/Fourth/i.test(displayYear)) displayYear = "Final Year";

                  return (
                    <div key={sec._id || `${displayYear}-${displayName}`} className="info-card">
                      <span className="card-tag">{displayYear}</span>
                      <h4>{displayName}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: STUDENT MANAGEMENT */}
          {activeTab === "students" && (
            <div className="tab-pane">
              <div className="tab-header-flex">
                <h3>👨‍🎓 CSE Student Database ({students.length} Total Students)</h3>
              </div>

              {/* HOD Bulk Upload Name List */}
              <div className="bulk-upload-card">
                <div className="bulk-upload-header">
                  <span className="bulk-upload-icon">📁</span>
                  <div>
                    <h4>Upload Student Name List</h4>
                    <p>Import students from Excel (.xlsx/.xls), CSV, or PDF. Files persist in the database even after refresh.</p>
                  </div>
                </div>
                <div className="bulk-upload-controls">
                  <div className="bulk-upload-selectors">
                    <select
                      value={uploadAcademicYear}
                      onChange={(e) => setUploadAcademicYear(e.target.value)}
                      className="bulk-select"
                    >
                      <option value="2026-2027">2026–2027</option>
                      <option value="2025-2026">2025–2026</option>
                      <option value="2027-2028">2027–2028</option>
                      {academicYears.filter(ay => !["2025-2026","2026-2027","2027-2028"].includes(ay.yearRange)).map(ay => (
                        <option key={ay.yearRange} value={ay.yearRange}>{ay.yearRange}</option>
                      ))}
                    </select>
                    <select
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      className="bulk-select"
                    >
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                    <select
                      value={uploadSection}
                      onChange={(e) => setUploadSection(e.target.value)}
                      className="bulk-select"
                    >
                      <option value="CSE A">CSE A</option>
                      <option value="CSE B">CSE B</option>
                    </select>
                  </div>
                  <label htmlFor="hod-file-upload" className={`file-upload-btn ${parsingFile ? "parsing" : ""}`}>
                    {parsingFile ? "⏳ Parsing File..." : "📂 Select File & Preview"}
                  </label>
                  <input
                    id="hod-file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={parsingFile}
                  />
                </div>
              </div>

              <form onSubmit={handleAddStudent} className="grid-form-full">
                <h4>Register New Student & Parent</h4>
                <div className="form-row-4">
                  <select
                    value={newStudent.academicYear}
                    onChange={(e) => setNewStudent({ ...newStudent, academicYear: e.target.value })}
                  >
                    <option value="2025-2026">2025–2026</option>
                    <option value="2026-2027">2026–2027</option>
                    <option value="2027-2028">2027–2028</option>
                    {academicYears.filter(ay => !["2025-2026","2026-2027","2027-2028"].includes(ay.yearRange)).map(ay => (
                      <option key={ay.yearRange} value={ay.yearRange}>{ay.yearRange}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Register Number (e.g. 24CS011)"
                    value={newStudent.registerNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, registerNumber: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Student Name (e.g. Abdul)"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    required
                  />
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <select
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                  >
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                <div className="form-row-3">
                  <select
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                  >
                    <option value="CSE A">CSE A</option>
                    <option value="CSE B">CSE B</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Parent Name (e.g. Mr. XYZ)"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Parent Mobile Number (10 Digits)"
                    value={newStudent.mobileNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, mobileNumber: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="add-btn">+ Register Student & Parent</button>
              </form>

              {/* Toolbar & Filter Bar */}
              <div className="student-toolbar">
                <div className="student-filters">
                  <input
                    type="text"
                    className="student-search-input"
                    placeholder="🔍 Search Reg No or Student Name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />

                  <select
                    className="student-filter-select"
                    value={studentFilterYear}
                    onChange={(e) => setStudentFilterYear(e.target.value)}
                  >
                    <option value="">All Academic Years</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>

                  <select
                    className="student-filter-select"
                    value={studentFilterSection}
                    onChange={(e) => setStudentFilterSection(e.target.value)}
                  >
                    <option value="">All Sections</option>
                    <option value="CSE A">CSE A</option>
                    <option value="CSE B">CSE B</option>
                  </select>
                </div>

                {selectedStudentIds.length > 0 && (
                  <button
                    className="bulk-delete-btn"
                    onClick={openDeleteModalForBulk}
                  >
                    🗑️ Delete Selected ({selectedStudentIds.length})
                  </button>
                )}
              </div>

              <div className="table-responsive margin-top-2">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={isAllStudentsSelected}
                          onChange={handleToggleSelectAllStudents}
                          title="Select All Students"
                        />
                      </th>
                      <th>Reg No</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Parent Name</th>
                      <th>Parent Phone</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                          No student records match your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const isSelected = selectedStudentIds.includes(st._id);
                        return (
                          <tr key={st._id} className={isSelected ? "row-selected" : ""}>
                            <td className="checkbox-col">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleStudentSelect(st._id)}
                              />
                            </td>
                            <td><code>{st.registerNumber}</code></td>
                            <td><strong>{st.name}</strong></td>
                            <td>{st.year} - {st.section}</td>
                            <td>{safeParentName(st.parentId?.name)}</td>
                            <td>📱 {st.parentId?.mobileNumber || st.phone}</td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="delete-action-btn"
                                onClick={() => openDeleteModalForStudent(st._id, st.name, st.registerNumber)}
                                title="Delete this student"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PARENT CONTACTS */}
          {activeTab === "parents" && (
            <div className="tab-pane">
              <h3>👨‍👩‍👧 Parent & Guardian Contacts Directory</h3>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Parent Name</th>
                      <th>Relationship</th>
                      <th>Mobile Number</th>
                      <th>WhatsApp Number</th>
                      <th>Linked Student</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                          📋 No parent contacts registered yet. Register a student or upload a student list to display parent contacts here.
                        </td>
                      </tr>
                    ) : (
                      students.map((st) => (
                        <tr key={st._id}>
                          <td><strong>{safeParentName(st.parentId?.name)}</strong></td>
                          <td>{st.parentId?.relationship || "Father"}</td>
                          <td>📱 {st.parentId?.mobileNumber || "N/A"}</td>
                          <td>💬 {st.parentId?.whatsappNumber || st.parentId?.mobileNumber || "N/A"}</td>
                          <td>{st.name} ({st.registerNumber})</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: MESSAGE DELIVERY LOGS */}
          {activeTab === "messages" && (
            <div className="tab-pane">
              <h3>📱 Complete Message Delivery Logs</h3>

              {logs.length === 0 ? (
                <div className="empty-state">
                  <p>No message delivery logs found. Logs will appear here when staff mark attendance as absent and submit.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Parent Contact</th>
                        <th>Dual Message Text</th>
                        <th>Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt || log.date).toLocaleString()}</td>
                          <td><strong>{log.studentId?.name}</strong></td>
                          <td>{log.year} - {log.section}</td>
                          <td>{log.parentId?.name} (📱 {log.sms?.mobileNumber})</td>
                          <td className="msg-cell">
                            <div>🇬🇧 {log.messageTemplate?.english || `Dear Parent, your son/daughter ${log.studentId?.name || "Student"} (CSE Dept) is absent for college today, ${new Date(log.date || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '-')}. Please contact the CSE Head of Department (HOD) immediately. – Kings College of Engineering.`}</div>
                            <div className="tamil-font">🇮🇳 {log.messageTemplate?.tamil || `அன்புள்ள பெற்றோருக்கு, உங்கள் பிள்ளை ${log.studentId?.name || "Student"} (கணினி அறிவியல் துறை) இன்று (${new Date(log.date || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '-')}) கல்லூரிக்கு வரவில்லை. உடனடியாக துறைத் தலைவரை (HOD) தொடர்பு கொள்ளவும். – கிங்ஸ் பொறியியல் கல்லூரி`}</div>
                          </td>
                          <td>
                            <span className={`badge ${
                              log.overallStatus === 'SUCCESS' ? 'badge-emerald' :
                              log.overallStatus === 'FAILED' ? 'badge-danger' :
                              log.overallStatus === 'PARTIAL' ? 'badge-warning' :
                              'badge-info'
                            }`}>
                              {log.overallStatus || 'PENDING'}
                            </span>
                            <div className="status-details">
                              <small>SMS: {log.sms?.status || 'N/A'}</small>
                              {log.whatsapp?.status && log.whatsapp?.status !== 'DISABLED' && (
                                <small>WhatsApp: {log.whatsapp?.status}</small>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Custom Centered Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="custom-modal-backdrop" onClick={closeDeleteModal}>
          <div className="custom-modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon-badge">
              <span>⚠️</span>
            </div>

            <div className="delete-modal-content">
              <h3>Confirm Permanent Deletion</h3>
              {deleteConfirmModal.isBulk ? (
                <p>
                  Are you sure you want to delete <strong>{deleteConfirmModal.count} selected student(s)</strong>?
                </p>
              ) : (
                <p>
                  Are you sure you want to delete student <strong>"{deleteConfirmModal.studentName}"</strong>
                  {deleteConfirmModal.registerNumber ? ` (${deleteConfirmModal.registerNumber})` : ""}?
                </p>
              )}
              <div className="modal-warning-box">
                🚨 This action will permanently remove the student record and associated parent contact link from the system.
              </div>
            </div>

            <div className="custom-modal-actions">
              <button
                type="button"
                className="cancel-modal-btn"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-modal-btn"
                onClick={executeDeleteConfirmed}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "🗑️ Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Upload Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay-hod">
          <div className="modal-content-hod">
            <div className="modal-header-hod">
              <h3>📋 Preview & Edit Student List</h3>
              <button className="modal-close-hod" onClick={() => setShowPreviewModal(false)}>✕</button>
            </div>

            <div className="modal-class-label">
              Target Class: <strong>{uploadAcademicYear} — {uploadYear} — {uploadSection}</strong>
              &nbsp;·&nbsp; <span style={{ color: "#34d399" }}>{previewStudents.length} student{previewStudents.length !== 1 ? "s" : ""} parsed</span>
            </div>

            <div className="modal-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Register No.</th>
                    <th>Student Name</th>
                    <th>Parent Name</th>
                    <th>Mobile Number</th>
                    <th>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {previewStudents.map((st, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={st.registerNumber}
                          onChange={(e) => handlePreviewStudentChange(idx, "registerNumber", e.target.value)}
                          className="preview-cell-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => handlePreviewStudentChange(idx, "name", e.target.value)}
                          className="preview-cell-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={st.parentName}
                          onChange={(e) => handlePreviewStudentChange(idx, "parentName", e.target.value)}
                          className="preview-cell-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={st.mobileNumber}
                          onChange={(e) => handlePreviewStudentChange(idx, "mobileNumber", e.target.value)}
                          className="preview-cell-input"
                        />
                      </td>
                      <td>
                        <button
                          className="preview-delete-btn"
                          onClick={() => handleDeletePreviewStudent(idx)}
                          title="Remove row"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer-hod">
              <button className="modal-cancel-btn-hod" onClick={() => setShowPreviewModal(false)}>
                Cancel
              </button>
              <button
                className="modal-save-btn-hod"
                onClick={handleSaveBulkStudents}
                disabled={previewStudents.length === 0}
              >
                💾 Save {previewStudents.length} Students to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HODDashboard;
