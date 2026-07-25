const express = require("express");
const router = express.Router();
const { Student, Parent } = require("../models");

// Get all students (with filters)
router.get("/", async (req, res) => {
  try {
    const { year, section, search } = req.query;
    let query = {};

    if (year) query.year = year;
    if (section) query.section = section;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { registerNumber: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .populate("parentId", "name mobileNumber whatsappNumber email")
      .select("-__v")
      .sort({ registerNumber: 1 });

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

// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("parentId", "name mobileNumber whatsappNumber email")
      .select("-__v");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      student,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      message: "Error fetching student",
      error: error.message,
    });
  }
});

// Get students by class
router.get("/class/:year/:section", async (req, res) => {
  try {
    const { year, section } = req.params;

    const students = await Student.find({ year, section, isActive: true })
      .populate("parentId", "name mobileNumber whatsappNumber email")
      .select("_id registerNumber name email year section")
      .sort({ registerNumber: 1 });

    if (students.length === 0) {
      return res.json({
        message: `No active students found for ${year} - ${section}`,
        students: [],
        count: 0,
      });
    }

    res.json({
      students,
      count: students.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching class students:", error);
    res.status(500).json({
      message: "Error fetching class students",
      error: error.message,
    });
  }
});

module.exports = router;
