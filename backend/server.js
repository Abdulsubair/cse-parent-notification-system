const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentRoutes = require("./routes/studentRoutes");
const masterRoutes = require("./routes/masterRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
const { User } = require("./models");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// MongoDB: cached lazy connection (works for both serverless & local dev)
// ---------------------------------------------------------------------------
const mongoUri =
  process.env.ATLAS_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://asubair383_db_user:CSEParentDB2026Secure1430@cse-parent-db.1hdsq5d.mongodb.net/cse-parent-notification?retryWrites=true&w=majority";

console.log("MongoDB URI configured:", mongoUri.includes("mongodb+srv") ? "Atlas Cloud DB" : "Local DB");
console.log("Environment check:", {
  ATLAS_MONGODB_URI: !!process.env.ATLAS_MONGODB_URI,
  MONGODB_URI: !!process.env.MONGODB_URI,
  JWT_SECRET: !!process.env.JWT_SECRET,
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
});

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  console.log("Attempting to connect to MongoDB...");
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
};

// Ensure DB is ready before every request (required for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    res
      .status(500)
      .json({ message: "Database connection error. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ message: "CSE Parent Notification System Backend is running!" });
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/attendance", authMiddleware, attendanceRoutes);
app.use("/api/students", authMiddleware, studentRoutes);
app.use("/api/master", authMiddleware, masterRoutes);

// ---------------------------------------------------------------------------
// Seed default users, sections & initial master data if empty
// ---------------------------------------------------------------------------
const seedDefaultUsers = async () => {
  try {
    // HOD user — create or fix password to HOD@2026
    const hodExists = await User.findOne({ username: "hod_cse" });
    if (!hodExists) {
      const hodPassword = await bcrypt.hash("HOD@2026", 10);
      await User.create({
        name: "Dr. Subair",
        username: "hod_cse",
        password: hodPassword,
        role: "hod",
      });
      console.log("✅ Default HOD user created (username: hod_cse, password: HOD@2026)");
    } else {
      // Fix password in case it was seeded with the old wrong value
      const correctPassword = await bcrypt.compare("HOD@2026", hodExists.password);
      if (!correctPassword) {
        const hodPassword = await bcrypt.hash("HOD@2026", 10);
        await User.updateOne({ username: "hod_cse" }, { password: hodPassword });
        console.log("✅ HOD user password updated to HOD@2026");
      }
    }

    // Staff user — create if not exists
    const staffExists = await User.findOne({ username: "staff_cse" });
    if (!staffExists) {
      const staffPassword = await bcrypt.hash("Staff@2026", 10);
      await User.create({
        name: "CSE Staff",
        username: "staff_cse",
        password: staffPassword,
        role: "staff",
      });
      console.log("✅ Default Staff user created (username: staff_cse, password: Staff@2026)");
    }

    // Seed Academic Years if empty
    const ayCount = await AcademicYear.countDocuments();
    if (ayCount === 0) {
      await AcademicYear.insertMany([
        { yearRange: "2026–2027", isCurrent: true },
        { yearRange: "2025–2026", isCurrent: false },
        { yearRange: "2027–2028", isCurrent: false },
      ]);
      console.log("✅ Default Academic Years seeded");
    }

    // Clean up legacy CSD / Fourth Year sections from DB
    await Section.deleteMany({
      $or: [
        { sectionName: { $regex: /CSD/i } },
        { year: { $regex: /Fourth/i } }
      ]
    });

    // Ensure the 6 standard CSE sections (CSE A & CSE B for 2nd, 3rd, Final Year) exist
    const canonicalSections = [
      { year: "Second Year", sectionName: "CSE A" },
      { year: "Second Year", sectionName: "CSE B" },
      { year: "Third Year", sectionName: "CSE A" },
      { year: "Third Year", sectionName: "CSE B" },
      { year: "Final Year", sectionName: "CSE A" },
      { year: "Final Year", sectionName: "CSE B" },
    ];

    for (const sec of canonicalSections) {
      const exists = await Section.findOne({ year: sec.year, sectionName: sec.sectionName });
      if (!exists) {
        await Section.create(sec);
      }
    }
    console.log("✅ Canonical Sections (CSE A & CSE B) verified and active");

    // Clean up student records with legacy section names
    await Student.updateMany({ section: { $regex: /CSDA|CSD-A|CSD A/i } }, { section: "CSE A" });
    await Student.updateMany({ section: { $regex: /CSDB|CSD-B|CSD B/i } }, { section: "CSE B" });
    await Student.updateMany({ section: { $regex: /CSD/i } }, { section: "CSE A" });
    await Student.updateMany({ year: { $regex: /Fourth/i } }, { year: "Final Year" });

  } catch (error) {
    console.error("❌ Error seeding default users/master data:", error.message);
  }
};

// ---------------------------------------------------------------------------
// Start server (works on both Render and local development)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
console.log(`Starting server on port ${PORT}...`);

connectDB()
  .then(async () => {
    console.log(`✅ MongoDB connected to ${mongoUri}`);
    await seedDefaultUsers();
    app.listen(PORT, () => {
      console.log(
        `🚀 CSE Parent Notification System Backend running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// Export for Vercel serverless handler
// ---------------------------------------------------------------------------
module.exports = app;