const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentRoutes = require("./routes/studentRoutes");
const masterRoutes = require("./routes/masterRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// MongoDB: cached lazy connection (works for both serverless & local dev)
// ---------------------------------------------------------------------------
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/cse-parent-notification";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoUri);
  isConnected = true;
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
// Start server (works on both Render and local development)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    console.log(`✅ MongoDB connected to ${mongoUri}`);
    app.listen(PORT, () => {
      console.log(
        `🚀 CSE Parent Notification System Backend running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// Export for Vercel serverless handler
// ---------------------------------------------------------------------------
module.exports = app;