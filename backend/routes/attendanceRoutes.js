const express = require("express");
const router = express.Router();
const { Attendance, Student, Parent, MessageLog } = require("../models");
const { roleMiddleware } = require("../middleware/authMiddleware");
const { sendAbsenceNotifications } = require("../services/messageService");

// Get classes assigned to the logged-in staff
router.get("/my-classes", async (req, res) => {
  try {
    const staffId = req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { StaffAssignment } = require("../models");
    const assignment = await StaffAssignment.findOne({ userId: staffId });

    if (!assignment) {
      return res.status(404).json({
        message: "No classes assigned to this staff member",
      });
    }

    res.json({
      classes: assignment.assignedClasses,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({
      message: "Error fetching assigned classes",
      error: error.message,
    });
  }
});

// Get students for a specific class
router.get("/students/:year/:section", async (req, res) => {
  try {
    const { year, section } = req.params;

    // Validate inputs
    if (!year || !section) {
      return res.status(400).json({
        message: "Year and section are required",
      });
    }

    const students = await Student.find({ year, section })
      .select("_id registerNumber name email phone")
      .sort({ registerNumber: 1 });

    if (students.length === 0) {
      return res.status(404).json({
        message: `No students found for ${year} - ${section}`,
      });
    }

    res.json({
      students,
      count: students.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
});

// Get existing attendance for a date (for editing)
router.get("/get/:date/:year/:section", async (req, res) => {
  try {
    const { date, year, section } = req.params;
    const staffId = req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      date: attendanceDate,
      year,
      section,
      staffId,
    }).populate("records.studentId", "registerNumber name");

    if (!attendance) {
      return res.json({
        message: "No attendance record found for this date",
        records: null,
      });
    }

    res.json({
      attendance,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message,
    });
  }
});

// Submit attendance
router.post("/submit", async (req, res) => {
  try {
    const staffId = req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date, academicYear, year, section, records } = req.body;

    // Validate required fields
    if (!date || !academicYear || !year || !section || !records) {
      return res.status(400).json({
        message: "All fields (date, academicYear, year, section, records) are required",
      });
    }

    // Validate records format
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: "Records must be a non-empty array",
      });
    }

    // Validate each record
    for (const record of records) {
      if (!record.studentId || !record.status) {
        return res.status(400).json({
          message: "Each record must have studentId and status",
        });
      }

      if (!["Present", "Absent"].includes(record.status)) {
        return res.status(400).json({
          message: "Status must be 'Present' or 'Absent'",
        });
      }
    }

    // Parse date and validate it
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    let attendance = await Attendance.findOne({
      date: attendanceDate,
      year,
      section,
      staffId,
    });

    if (attendance) {
      // Update existing attendance
      attendance.records = records;
      attendance.academicYear = academicYear;
    } else {
      // Create new attendance
      attendance = new Attendance({
        date: attendanceDate,
        academicYear,
        year,
        section,
        staffId,
        records,
      });
    }

    await attendance.save();

    const absentRecords = records.filter((record) => record.status === "Absent");
    let notificationSummary = null;

    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map((record) => record.studentId);
      const absentStudents = await Student.find({
        _id: { $in: absentStudentIds },
      }).populate("parentId");

      console.log("Sending absence notifications for", absentRecords.length, "absent students");

      notificationSummary = await sendAbsenceNotifications({
        attendance,
        absentRecords,
        students: absentStudents,
      });

      console.log("Notification summary:", notificationSummary);

      attendance.messagesSent = true;
      attendance.messageSubmittedAt = new Date();
      await attendance.save();
    }

    res.status(201).json({
      message: "Attendance submitted successfully",
      attendanceId: attendance._id,
      success: true,
      notificationSummary,
    });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    res.status(500).json({
      message: "Error submitting attendance",
      error: error.message,
    });
  }
});

// Get message logs for a specific attendance record
router.get("/message-logs/:attendanceId", async (req, res) => {
  try {
    const staffId = req.user?.userId;
    const { attendanceId } = req.params;

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const logs = await MessageLog.find({ attendanceId })
      .populate("studentId", "registerNumber name")
      .populate("parentId", "name mobileNumber whatsappNumber")
      .sort({ createdAt: -1 });

    res.json({
      logs,
      count: logs.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching message logs:", error);
    res.status(500).json({
      message: "Error fetching message logs",
      error: error.message,
    });
  }
});

// HOD: summary of notification delivery status
router.get("/hod/summary", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { year, section, date } = req.query;
    const filters = {};

    if (year) {
      filters.year = year;
    }
    if (section) {
      filters.section = section;
    }
    if (date) {
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD.",
        });
      }
      attendanceDate.setUTCHours(0, 0, 0, 0);
      filters.date = attendanceDate;
    }

    const totalMessages = await MessageLog.countDocuments(filters);

    const statusAggregation = await MessageLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$overallStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusSummary = statusAggregation.reduce((summary, item) => {
      summary[item._id] = item.count;
      return summary;
    }, {
      SUCCESS: 0,
      PARTIAL: 0,
      FAILED: 0,
      PENDING: 0,
    });

    const classAggregation = await MessageLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            year: "$year",
            section: "$section",
          },
          total: { $sum: 1 },
          success: {
            $sum: {
              $cond: [{ $eq: ["$overallStatus", "SUCCESS"] }, 1, 0],
            },
          },
          partial: {
            $sum: {
              $cond: [{ $eq: ["$overallStatus", "PARTIAL"] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$overallStatus", "FAILED"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.section": 1 } },
    ]);

    const classSummary = classAggregation.map((item) => ({
      year: item._id.year,
      section: item._id.section,
      total: item.total,
      success: item.success,
      partial: item.partial,
      failed: item.failed,
    }));

    res.json({
      totalMessages,
      statusSummary,
      classSummary,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching HOD summary:", error);
    res.status(500).json({
      message: "Error fetching HOD summary",
      error: error.message,
    });
  }
});

// HOD: message delivery logs
router.get("/hod/logs", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { year, section, status, date, limit = 100, page = 1 } = req.query;
    const filters = {};

    if (year) filters.year = year;
    if (section) filters.section = section;
    if (status) filters.overallStatus = status;
    if (date) {
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD.",
        });
      }
      attendanceDate.setUTCHours(0, 0, 0, 0);
      filters.date = attendanceDate;
    }

    const skip = (Number(page) - 1) * Number(limit);

    console.log("Fetching HOD logs with filters:", filters);

    const logs = await MessageLog.find(filters)
      .populate("studentId", "registerNumber name")
      .populate("parentId", "name mobileNumber whatsappNumber")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    console.log("Found logs:", logs.length);

    const total = await MessageLog.countDocuments(filters);

    console.log("Total logs count:", total);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching HOD logs:", error);
    res.status(500).json({
      message: "Error fetching HOD logs",
      error: error.message,
    });
  }
});

// Get attendance history for staff
router.get("/history/:year/:section", async (req, res) => {
  try {
    const staffId = req.user?.userId;
    const { year, section } = req.params;

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ year, section, staffId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select("date year section messagesSent messageSubmittedAt")
      .lean();

    const total = await Attendance.countDocuments({
      year,
      section,
      staffId,
    });

    res.json({
      attendance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({
      message: "Error fetching attendance history",
      error: error.message,
    });
  }
});

module.exports = router;
