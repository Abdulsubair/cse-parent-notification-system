const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema(
  {
    yearRange: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("AcademicYear", academicYearSchema);
