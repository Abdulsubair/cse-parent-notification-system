const mongoose = require("mongoose");

const messageLogSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: false,
      index: true,
    },

    messageTemplate: {
      english: {
        type: String,
        required: true,
      },
      tamil: {
        type: String,
        required: true,
      },
    },

    sms: {
      status: {
        type: String,
        enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "DISABLED", "NOT_AVAILABLE"],
        default: "PENDING",
      },
      mobileNumber: String,
      messageId: String,
      error: String,
      sentAt: Date,
      deliveredAt: Date,
    },

    whatsapp: {
      status: {
        type: String,
        enum: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "DISABLED", "NOT_AVAILABLE"],
        default: "PENDING",
      },
      whatsappNumber: String,
      messageId: String,
      error: String,
      sentAt: Date,
      deliveredAt: Date,
      readAt: Date,
    },

    overallStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "PARTIAL", "FAILED"],
      default: "PENDING",
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    year: {
      type: String,
      enum: ["Second Year", "Third Year", "Final Year"],
    },

    section: {
      type: String,
      trim: true,
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

module.exports = mongoose.model("MessageLog", messageLogSchema);
