// System Configuration
const CONFIG = {
  // Academic Years
  academicYears: ["2023-2024", "2024-2025", "2025-2026", "2026-2027"],

  // Years
  years: ["Second Year", "Third Year", "Final Year"],

  // Sections
  sections: ["CSE A", "CSE B"],

  // User Roles
  roles: ["hod", "staff"],

  // Attendance Status
  attendanceStatus: ["Present", "Absent"],

  // Message Types
  messageTypes: ["Absence", "Attendance", "Performance", "General"],

  // SMS Status
  smsStatus: ["PENDING", "SENT", "DELIVERED", "FAILED"],

  // WhatsApp Status
  whatsappStatus: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"],

  // Overall Message Status
  overallStatus: ["PENDING", "SUCCESS", "PARTIAL", "FAILED"],

  // Relationship Types
  relationshipTypes: ["Father", "Mother", "Guardian"],

  // Current Academic Year
  currentAcademicYear: "2026-2027",

  // Department
  department: "CSE",

  // Student Batch Year (update yearly)
  studentBatchYears: {
    "Second Year": "2024-2026",
    "Third Year": "2023-2025",
    "Final Year": "2022-2024",
  },
};

module.exports = CONFIG;
