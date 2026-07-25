const mongoose = require("mongoose");

const messageTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    english: {
      type: String,
      required: true,
      trim: true,
    },

    tamil: {
      type: String,
      required: true,
      trim: true,
    },

    placeholders: [
      {
        name: String,
        description: String,
      },
    ],

    type: {
      type: String,
      enum: ["Absence", "Attendance", "Performance", "General"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MessageTemplate", messageTemplateSchema);
