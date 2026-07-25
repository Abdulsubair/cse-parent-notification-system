const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian"],
      required: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },

    whatsappNumber: {
      type: String,
      trim: true,
      match: /^[0-9]{10}$/,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Parent", parentSchema);
