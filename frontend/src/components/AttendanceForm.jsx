import { useState, useEffect } from "react";
import StudentAttendanceRow from "./StudentAttendanceRow";
import "./AttendanceForm.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://cse-parent-notification-system.vercel.app";

function AttendanceForm({ selectedClass, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/api/students/class/${selectedClass.year}/${selectedClass.section}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students);

      // Initialize attendance object
      const initialAttendance = {};
      data.students.forEach((student) => {
        initialAttendance[student._id] = "Present";
      });
      setAttendance(initialAttendance);
      setError("");
    } catch (err) {
      setError(err.message);
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const normalizeDate = (dateString) => {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      setError("Please select a valid attendance date.");
      return;
    }

    const selectedDate = new Date(normalizedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError("Cannot mark attendance for future dates");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const records = students.map((student) => ({
        studentId: student._id,
        status: attendance[student._id],
      }));

      const response = await fetch(
        `${API_BASE}/api/attendance/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: normalizedDate,
            academicYear: selectedClass.academicYear,
            year: selectedClass.year,
            section: selectedClass.section,
            records,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      const notificationText = data.notificationSummary
        ? ` Notifications: ${data.notificationSummary.successCount} success, ${data.notificationSummary.partialCount} partial, ${data.notificationSummary.failedCount} failed.`
        : " No absent student notifications were created.";

      setSuccess(
        `✅ Attendance marked for ${records.length} students successfully!${notificationText}`
      );
      setError("");

      // Reset form
      setTimeout(() => {
        setSuccess("");
        onSuccess();
      }, 3000);
    } catch (err) {
      setError(err.message);
      setSuccess("");
      console.error("Error submitting attendance:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  const absentCount = Object.values(attendance).filter(
    (status) => status === "Absent"
  ).length;
  const presentCount = students.length - absentCount;

  return (
    <div className="attendance-form">
      <div className="form-header">
        <div>
          <h2>
            {selectedClass.year} - {selectedClass.section}
          </h2>
          <p>Academic Year: {selectedClass.academicYear}</p>
        </div>
        <div className="attendance-stats">
          <div className="stat present">
            <span className="stat-label">Present</span>
            <span className="stat-value">{presentCount}</span>
          </div>
          <div className="stat absent">
            <span className="stat-label">Absent</span>
            <span className="stat-value">{absentCount}</span>
          </div>
          <div className="stat total">
            <span className="stat-label">Total</span>
            <span className="stat-value">{students.length}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date of Attendance</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
          />
          <small>Select the date for attendance</small>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="students-list-section">
          <h3>
            Student List ({students.length} students)
          </h3>

          <div className="students-list">
            {students.map((student) => (
              <StudentAttendanceRow
                key={student._id}
                student={student}
                status={attendance[student._id]}
                onChange={handleAttendanceChange}
              />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={submitting || students.length === 0}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AttendanceForm;
