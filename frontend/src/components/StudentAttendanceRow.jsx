import "./StudentAttendanceRow.css";

function StudentAttendanceRow({ student, status, onChange }) {
  return (
    <div className="student-attendance-row">
      <div className="student-info">
        <div className="student-avatar">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="student-details">
          <h4>{student.name}</h4>
          <p>{student.registerNumber}</p>
        </div>
      </div>

      <div className="attendance-options">
        <label className="radio-label">
          <input
            type="radio"
            name={`attendance_${student._id}`}
            value="Present"
            checked={status === "Present"}
            onChange={() => onChange(student._id, "Present")}
          />
          <span className="radio-text present">✓ Present</span>
        </label>

        <label className="radio-label">
          <input
            type="radio"
            name={`attendance_${student._id}`}
            value="Absent"
            checked={status === "Absent"}
            onChange={() => onChange(student._id, "Absent")}
          />
          <span className="radio-text absent">✗ Absent</span>
        </label>
      </div>
    </div>
  );
}

export default StudentAttendanceRow;
