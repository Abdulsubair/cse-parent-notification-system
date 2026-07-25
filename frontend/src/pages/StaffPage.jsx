import React, { useState, useEffect } from "react";
import "./StaffPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function StaffPage({ user, token, onLogout }) {
  const [academicYears, setAcademicYears] = useState(["2026–2027", "2025–2026", "2027–2028"]);
  const [sections, setSections] = useState(["CSE A", "CSE B"]);
  const [staffList, setStaffList] = useState(["Dr. Subair (HOD/Faculty)", "Prof. Rajesh (Staff)", "Prof. Anitha (Staff)"]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2026–2027");
  const [selectedYear, setSelectedYear] = useState("Second Year");
  const [selectedSection, setSelectedSection] = useState("CSE A");
  const [selectedStaffName, setSelectedStaffName] = useState(user?.name || "CSE Staff");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Confirmation Modal State
  const [submissionResult, setSubmissionResult] = useState(null);

  // Fetch initial dropdown metadata
  useEffect(() => {
    if (!token) return;
    fetchMetadata();
  }, [token]);

  // Fetch students whenever Year or Section changes
  useEffect(() => {
    if (!token) return;
    fetchStudents();
  }, [token, selectedYear, selectedSection]);

  const fetchMetadata = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ayRes, secRes, staffRes] = await Promise.all([
        fetch(`${API_BASE}/api/master/academic-years`, { headers }),
        fetch(`${API_BASE}/api/master/sections`, { headers }),
        fetch(`${API_BASE}/api/master/staff`, { headers }),
      ]);

      if (ayRes.ok) {
        const data = await ayRes.json();
        if (data.academicYears?.length) {
          setAcademicYears(data.academicYears.map((ay) => ay.yearRange));
        }
      }

      if (secRes.ok) {
        const data = await secRes.json();
        if (data.sections?.length) {
          const uniqueSecs = Array.from(new Set(data.sections.map((s) => s.sectionName)));
          setSections(uniqueSecs);
        }
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        if (data.staff?.length) {
          setStaffList(data.staff.map((st) => st.name));
        }
      }
    } catch (err) {
      console.error("Metadata fetch error:", err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/master/students?year=${encodeURIComponent(selectedYear)}&section=${encodeURIComponent(selectedSection)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      
      const fetchedStudents = data.students || [];
      setStudents(fetchedStudents);

      // Default attendance: Present for all students
      const initialMap = {};
      fetchedStudents.forEach((st) => {
        initialMap[st._id] = "Present";
      });
      setAttendance(initialMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st._id] = status;
    });
    setAttendance(updated);
  };

  // Compute live statistics
  const totalCount = students.length;
  const presentCount = Object.values(attendance).filter((st) => st === "Present").length;
  const absentCount = Object.values(attendance).filter((st) => st === "Absent").length;

  const handleSubmitAttendance = async () => {
    if (totalCount === 0) {
      alert("No students in this section to submit attendance.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const records = students.map((st) => ({
        studentId: st._id,
        status: attendance[st._id] || "Present",
      }));

      const todayStr = new Date().toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/api/attendance/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: todayStr,
          academicYear: selectedAcademicYear,
          year: selectedYear,
          section: selectedSection,
          staffName: selectedStaffName,
          records,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      // Collect details of absent students for immediate visual confirmation modal
      const absentStudentDetails = students
        .filter((st) => attendance[st._id] === "Absent")
        .map((st) => ({
          studentName: st.name,
          registerNumber: st.registerNumber,
          parentName: st.parentId?.name || "Parent",
          parentMobile: st.parentId?.mobileNumber || st.phone || "9876543210",
        }));

      setSubmissionResult({
        academicYear: selectedAcademicYear,
        year: selectedYear,
        section: selectedSection,
        staffName: selectedStaffName,
        total: totalCount,
        present: presentCount,
        absent: absentCount,
        absentStudents: absentStudentDetails,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-layout">
      {/* Top Navbar */}
      <nav className="staff-nav">
        <div className="nav-brand">
          <span className="brand-logo">🎓</span>
          <div>
            <h2>CSE Staff Portal</h2>
            <span className="sub-title">Daily Student Absence Parent Notification System</span>
          </div>
        </div>
        <div className="nav-right">
          <div className="logged-user">
            <span className="user-role-tag">STAFF</span>
            <strong>{selectedStaffName}</strong>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Form Content */}
      <main className="staff-main">
        {/* Selection Card */}
        <section className="filter-card">
          <h3 className="section-title">📋 Select Class & Staff Information</h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                {academicYears.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>


          </div>
        </section>

        {/* Student Attendance Section */}
        <section className="attendance-card">
          <div className="attendance-header">
            <div>
              <h3>Student Attendance Roster</h3>
              <p>
                Mark attendance for <strong>{selectedYear} - {selectedSection}</strong> ({selectedAcademicYear})
              </p>
            </div>

            <div className="quick-actions">
              <button className="quick-btn present-all" onClick={() => handleMarkAll("Present")}>
                ✓ Mark All Present
              </button>
              <button className="quick-btn absent-all" onClick={() => handleMarkAll("Absent")}>
                ✗ Mark All Absent
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="loading-spinner">Loading student roster...</div>
          ) : students.length === 0 ? (
            <div className="empty-roster">
              <p>No students registered in <strong>{selectedYear} - {selectedSection}</strong>.</p>
              <span>Please add students via HOD Dashboard or select another section.</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>S.No</th>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Parent Contact</th>
                    <th style={{ textAlign: "center", width: "160px" }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const status = attendance[student._id] || "Present";
                    const isAbsent = status === "Absent";

                    return (
                      <tr key={student._id} className={isAbsent ? "row-absent" : "row-present"}>
                        <td>{idx + 1}</td>
                        <td>
                          <code className="reg-code">{student.registerNumber}</code>
                        </td>
                        <td>
                          <strong className="student-name">{student.name}</strong>
                        </td>
                        <td>
                          <div className="parent-info">
                            <span>{student.parentId?.name || "Parent"}</span>
                            <small>📱 {student.parentId?.mobileNumber || student.phone}</small>
                          </div>
                        </td>
                        <td>
                          <div className="radio-toggle-group">
                            <button
                              type="button"
                              className={`toggle-btn btn-present ${status === "Present" ? "active" : ""}`}
                              onClick={() => handleStatusChange(student._id, "Present")}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`toggle-btn btn-absent ${status === "Absent" ? "active" : ""}`}
                              onClick={() => handleStatusChange(student._id, "Absent")}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Stats & Submit Bar */}
          <div className="attendance-footer">
            <div className="stats-pills">
              <div className="pill total">
                <span>Total Students</span>
                <strong>{totalCount}</strong>
              </div>
              <div className="pill present">
                <span>Present</span>
                <strong>{presentCount}</strong>
              </div>
              <div className="pill absent">
                <span>Absent</span>
                <strong>{absentCount}</strong>
              </div>
            </div>

            <button
              className="submit-attendance-btn"
              onClick={handleSubmitAttendance}
              disabled={submitting || totalCount === 0}
            >
              {submitting ? "Sending Notifications..." : "Submit Attendance & Send Messages 🚀"}
            </button>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {submissionResult && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>✅ Attendance Submitted & Notifications Dispatched!</h3>
              <button className="close-btn" onClick={() => setSubmissionResult(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="summary-banner">
                <div>Class: <strong>{submissionResult.year} - {submissionResult.section}</strong></div>
                <div>Academic Year: <strong>{submissionResult.academicYear}</strong></div>
                <div>Submitted By: <strong>{submissionResult.staffName}</strong></div>
              </div>

              <div className="counts-row">
                <span className="count-badge total">Total: {submissionResult.total}</span>
                <span className="count-badge present">Present: {submissionResult.present}</span>
                <span className="count-badge absent">Absent: {submissionResult.absent}</span>
              </div>

              {submissionResult.absent > 0 ? (
                <div className="absent-preview-list">
                  <h4>📲 Dispatched Dual-Language Messages ({submissionResult.absent} Parents)</h4>
                  {submissionResult.absentStudents.map((st, i) => (
                    <div key={i} className="msg-preview-card">
                      <div className="preview-top">
                        <strong>Student: {st.studentName} ({st.registerNumber})</strong>
                        <span className="dispatch-badge">🟢 SMS & WhatsApp Sent</span>
                      </div>
                      <div className="parent-detail">
                        Parent: {st.parentName} (Mobile: {st.parentMobile})
                      </div>
                      <div className="preview-dual-text">
                        <p>🇬🇧 Dear Parents, Your Son/Daughter <strong>{st.studentName}</strong> has not attended the college today.</p>
                        <p className="tamil-font">🇮🇳 அன்புள்ள பெற்றோர்களே, உங்கள் மகன்/மகள் <strong>{st.studentName}</strong> இன்று கல்லூரிக்கு வரவில்லை.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="all-present-msg">
                  🎉 Great! All students were marked Present today. No absence messages needed!
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="confirm-btn" onClick={() => setSubmissionResult(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
