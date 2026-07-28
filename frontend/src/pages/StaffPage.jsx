import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./StaffPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://cse-parent-notification-system.onrender.com";

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

  // Guard: never display a phone number in a parent name field
  const safeParentName = (val) => {
    if (!val) return "Parent";
    const digits = String(val).replace(/\D/g, "");
    if (digits.length >= 8 && /^\d[\d\s\-+().]{6,}$/.test(String(val).trim())) return "Parent";
    return val;
  };

  // Compute live statistics
  const totalCount = students.length;
  const presentCount = Object.values(attendance).filter((st) => st === "Present").length;
  const absentCount = Object.values(attendance).filter((st) => st === "Absent").length;

  // ─── PDF Report Generator ───────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (students.length === 0) {
      alert("No students to generate report for.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const todayDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    // ── Fetch logo and embed ──
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/college-logo.jpg";

    const renderPDF = () => {
      // ═══════════════════════════════════════════════════════════
      // HEADER  — white background, logo left, text right
      // ═══════════════════════════════════════════════════════════

      // Logo — left side (same position as reference image)
      try {
        doc.addImage(logoImg, "JPEG", 10, 4, 22, 22);
      } catch (_) { /* skip if logo fails */ }

      // College name block — centred to the right of the logo
      const textX = pageW / 2 + 5; // shift slightly right to balance logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("KINGS COLLEGE OF ENGINEERING", textX, 10, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("(AUTONOMOUS)", textX, 15.5, { align: "center" });

      // Affiliation lines — right side (small, normal weight)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Approved by AICTE, New Delhi", pageW - 10, 8, { align: "right" });
      doc.text("Affiliated to Anna University, Chennai", pageW - 10, 12.5, { align: "right" });
      doc.text("Recognized under 2(f) & 12(B), UGC", pageW - 10, 17, { align: "right" });
      doc.text("NAAC Accredited Institution", pageW - 10, 21.5, { align: "right" });

      // ── Full-width horizontal rule (matches reference image thick border) ──
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(10, 27, pageW - 10, 27);
      doc.setLineWidth(0.3);
      doc.line(10, 28.5, pageW - 10, 28.5);

      // ── Sub-header lines (centred, black) ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Department of Computer Science and Engineering", pageW / 2, 34.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Academic Year ${selectedAcademicYear}`, pageW / 2, 40.5, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("Daily Attendance Report", pageW / 2, 46.5, { align: "center" });

      // ── Class meta info row (exactly like the reference) ──
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const metaY = 54;
      doc.text(`Year / Sem :  ${selectedYear}`, 10, metaY);
      doc.text(`Section :  ${selectedSection}`, pageW / 2 - 10, metaY);
      doc.text(`Date :  ${todayDate}`, 10, metaY + 6);
      doc.text(`Class Strength :  ${students.length}`, pageW / 2 - 10, metaY + 6);
      doc.text(`Present :  ${presentCount}`, 10, metaY + 12);
      doc.text(`Absent :  ${absentCount}`, pageW / 2 - 10, metaY + 12);

      // ── Attendance Table ──
      const isPhoneNumber = (val) =>
        typeof val === "string" && val.replace(/\D/g, "").length >= 8 && /^\d[\d\s\-+().]{6,}$/.test(val.trim());

      const tableRows = students.map((st, idx) => {
        const status = attendance[st._id] || "Present";

        // Parent name: never show a phone number — if the stored value looks like
        // a mobile number (caused by an older upload bug), show "—" instead.
        const rawName = st.parentId?.name || "";
        const parentName = rawName && !isPhoneNumber(rawName) ? rawName : "—";

        // Parent mobile: prefer parentId.mobileNumber, fall back to st.phone
        const parentMobile = st.parentId?.mobileNumber || st.phone || "—";

        return [idx + 1, st.registerNumber, st.name, parentName, parentMobile, status];
      });

      autoTable(doc, {
        startY: metaY + 18,
        head: [["S.No", "Reg No", "Student Name", "Parent Name", "Parent Mobile", "Status"]],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 2.2,
          halign: "center",
          valign: "middle",
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          fillColor: [255, 255, 255],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "center",
          lineColor: [0, 0, 0],
          lineWidth: 0.4,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 50, halign: "left" },
          3: { cellWidth: 38, halign: "left" },
          4: { cellWidth: 32, halign: "center" },
          5: { cellWidth: 18, halign: "center" },
        },
        margin: { left: 10, right: 10 },
      });

      // ── Signature footer ──
      const finalY = doc.lastAutoTable.finalY + 16;
      const sigY = Math.min(finalY, 272);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.line(10, sigY - 3, 55, sigY - 3);
      doc.text("Class Coordinator", 32, sigY + 2, { align: "center" });
      doc.line(pageW - 55, sigY - 3, pageW - 10, sigY - 3);
      doc.text("Head of Department", pageW - 32, sigY + 2, { align: "center" });

      // ── Page number ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, pageW / 2, 293, { align: "center" });
      }

      const filename = `Attendance_${selectedYear.replace(/ /g, "-")}_${selectedSection.replace(/ /g, "-")}_${todayDate.replace(/\//g, "-")}.pdf`;
      doc.save(filename);
    };

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      renderPDF();
    } else {
      logoImg.onload = renderPDF;
      logoImg.onerror = renderPDF; // render even if logo fails
    }
  };

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
        .map((st) => {
          const logMatch = data.notificationSummary?.logs?.find(
            (l) => String(l.studentId) === String(st._id) || String(l.studentId?._id) === String(st._id)
          );
          return {
            studentName: st.name,
            registerNumber: st.registerNumber,
            parentName: safeParentName(st.parentId?.name),
            parentMobile: st.parentId?.mobileNumber || st.phone || "9876543210",
            smsStatus: logMatch?.sms?.status || "PENDING",
            smsError: logMatch?.sms?.error || null,
          };
        });

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
          <img src="/college-logo.jpg" alt="Kings College Logo" className="brand-logo-img" />
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
                            <span>{safeParentName(student.parentId?.name)}</span>
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

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                className="download-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={students.length === 0}
                title="Download Attendance Report as PDF"
              >
                📄 Download PDF
              </button>
              <button
                className="submit-attendance-btn"
                onClick={handleSubmitAttendance}
                disabled={submitting || totalCount === 0}
              >
                {submitting ? "Sending Notifications..." : "Submit Attendance & Send Messages 🚀"}
              </button>
            </div>
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
                        <span className={`dispatch-badge ${st.smsStatus === 'SENT' || st.smsStatus === 'DELIVERED' ? '' : 'failed-badge'}`} style={{
                          backgroundColor: st.smsStatus === 'SENT' || st.smsStatus === 'DELIVERED' ? '#059669' : '#dc2626',
                          color: '#ffffff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}>
                          {st.smsStatus === 'SENT' || st.smsStatus === 'DELIVERED'
                            ? '🟢 Fast2SMS Dispatched'
                            : '⚠️ API Error (₹100 Recharge Needed)'}
                        </span>
                      </div>
                      <div className="parent-detail">
                        Parent: {st.parentName} (Mobile: {st.parentMobile})
                      </div>
                      {st.smsError && (
                        <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: '4px' }}>
                          ⚠️ <strong>Fast2SMS Response:</strong> {st.smsError}
                        </div>
                      )}
                      <div className="preview-dual-text">
                        <p>🇬🇧 Dear Parent, your son/daughter <strong>{st.studentName}</strong> (CSE Dept) is absent for college today, {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}. Please contact the CSE Head of Department (HOD) immediately. – Kings College of Engineering.</p>
                        <p className="tamil-font">🇮🇳 அன்புள்ள பெற்றோருக்கு, உங்கள் பிள்ளை <strong>{st.studentName}</strong> (கணினி அறிவியல் துறை) இன்று ({new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}) கல்லூரிக்கு வரவில்லை. உடனடியாக துறைத் தலைவரை (HOD) தொடர்பு கொள்ளவும். – கிங்ஸ் பொறியியல் கல்லூரி</p>
                      </div>
                      <div style={{ marginTop: "0.6rem" }}>
                        <a
                          href={`sms:${st.parentMobile}?body=${encodeURIComponent(`Dear Parent, your son/daughter ${st.studentName} (CSE Dept) is absent for college today, ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}. Please contact the CSE Head of Department (HOD) immediately. – Kings College of Engineering.\n\nஅன்புள்ள பெற்றோருக்கு, உங்கள் பிள்ளை ${st.studentName} (கணினி அறிவியல் துறை) இன்று (${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}) கல்லூரிக்கு வரவில்லை. உடனடியாக துறைத் தலைவரை (HOD) தொடர்பு கொள்ளவும். – கிங்ஸ் பொறியியல் கல்லூரி`)}`}
                          className="add-btn"
                          style={{ textDecoration: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem", backgroundColor: "#2563eb", display: "inline-block" }}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📱 Send via Mobile Phone SIM (Free Fallback)
                        </a>
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

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                className="download-pdf-btn"
                onClick={handleDownloadPDF}
                style={{ fontSize: "0.85rem", padding: "0.5rem 1.2rem" }}
              >
                📄 Download Attendance PDF
              </button>
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
