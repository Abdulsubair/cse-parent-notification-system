const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      enum: ["Second Year", "Third Year", "Final Year"],
      required: true,
    },
    sectionName: {
      type: String,
      required: true,
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

sectionSchema.index({ year: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);
