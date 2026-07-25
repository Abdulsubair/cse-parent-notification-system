const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    year: {
      type: String,
      enum: ["Second Year", "Third Year", "Final Year"],
      required: true,
      index: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },

        status: {
          type: String,
          enum: ["Present", "Absent"],
          required: true,
        },
      },
    ],

    messagesSent: {
      type: Boolean,
      default: false,
    },

    messageSubmittedAt: {
      type: Date,
      default: null,
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

module.exports = mongoose.model("Attendance", attendanceSchema);
