const mongoose = require("mongoose");

const staffAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    assignedClasses: [
      {
        academicYear: {
          type: String,
          enum: ["2023-2024", "2024-2025", "2025-2026", "2026-2027"],
        },

        year: {
          type: String,
          enum: ["Second Year", "Third Year", "Final Year"],
        },

        section: {
          type: String,
          enum: ["CSE A", "CSE B"],
        },
      },
    ],

    department: {
      type: String,
      default: "CSE",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StaffAssignment", staffAssignmentSchema);
