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
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/cse-parent-notification";

// How long a request waits for a pending connection before giving up on it.
// The attempt itself keeps running in the background, so the service recovers
// on its own once the database becomes reachable again.
const DB_WAIT_MS = 2000;

// Fail fast instead of buffering queries while the database is unreachable
mongoose.set("bufferCommands", false);

let connectAttempt = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!connectAttempt) {
    connectAttempt = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        console.log(`✅ MongoDB connected to ${mongoUri}`);
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
      })
      .finally(() => {
        connectAttempt = null;
      });
  }

  return connectAttempt;
};

// Seed on every successful (re)connection, so a database that only becomes
// reachable after startup still ends up with the default users
let seeding = null;

mongoose.connection.on("connected", () => {
  seeding = seedDefaultUsers();
});

// Diagnostics: must stay reachable even when the database is unavailable
app.get("/", (req, res) => {
  res.json({ message: "CSE Parent Notification System Backend is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
  });
});

// Ensure DB is ready before every request (required for Vercel serverless)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await Promise.race([
      connectDB(),
      new Promise((resolve) => setTimeout(resolve, DB_WAIT_MS)),
    ]);
  }

  if (mongoose.connection.readyState !== 1) {
    return res
      .status(503)
      .json({ message: "Database connection error. Please try again." });
  }

  await seeding;

  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Public routes
app.use("/api/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/attendance", authMiddleware, attendanceRoutes);
app.use("/api/students", authMiddleware, studentRoutes);
app.use("/api/master", authMiddleware, masterRoutes);

// ---------------------------------------------------------------------------
// Seed default users if they don't exist
// ---------------------------------------------------------------------------
const seedDefaultUsers = async () => {
  try {
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
    }

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
  } catch (error) {
    console.error("❌ Error seeding default users:", error.message);
  }
};

// ---------------------------------------------------------------------------
// Start server (works on both Render and local development)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ JWT_SECRET is not set. Login will fail until it is configured."
  );
}

app.listen(PORT, () => {
  console.log(
    `🚀 CSE Parent Notification System Backend running on port ${PORT}`
  );
});

connectDB();

// ---------------------------------------------------------------------------
// Export for Vercel serverless handler
// ---------------------------------------------------------------------------
module.exports = app;