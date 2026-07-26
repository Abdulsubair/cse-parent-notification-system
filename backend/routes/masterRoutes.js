const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { AcademicYear, Section, User, Student, Parent } = require("../models");
const { roleMiddleware } = require("../middleware/authMiddleware");

// --- ACADEMIC YEARS ---

// GET all academic years
router.get("/academic-years", async (req, res) => {
  try {
    let years = await AcademicYear.find().sort({ yearRange: -1 });
    if (years.length === 0) {
      // Return standard default years if database is newly initialized
      years = [
        { _id: "ay1", yearRange: "2026–2027", isCurrent: true },
        { _id: "ay2", yearRange: "2025–2026", isCurrent: false },
        { _id: "ay3", yearRange: "2027–2028", isCurrent: false },
      ];
    }
    res.json({ success: true, academicYears: years });
  } catch (error) {
    res.status(500).json({ message: "Error fetching academic years", error: error.message });
  }
});

// POST add new academic year (HOD only)
router.post("/academic-years", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { yearRange, isCurrent } = req.body;
    if (!yearRange) return res.status(400).json({ message: "Year range is required" });

    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const newYear = await AcademicYear.create({ yearRange, isCurrent: Boolean(isCurrent) });
    res.status(201).json({ success: true, academicYear: newYear });
  } catch (error) {
    res.status(500).json({ message: "Error creating academic year", error: error.message });
  }
});

// DELETE academic year (HOD only)
router.delete("/academic-years/:id", roleMiddleware(["hod"]), async (req, res) => {
  try {
    await AcademicYear.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Academic year deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting academic year", error: error.message });
  }
});

// --- SECTIONS & CLASSES ---

// GET all sections
router.get("/sections", async (req, res) => {
  try {
    let sections = await Section.find({ sectionName: { $not: /CSD/i } }).sort({ year: 1, sectionName: 1 });
    if (sections.length === 0) {
      // Default standard CSE department sections
      sections = [
        { _id: "s1", year: "Second Year", sectionName: "CSE A" },
        { _id: "s2", year: "Second Year", sectionName: "CSE B" },
        { _id: "s3", year: "Third Year", sectionName: "CSE A" },
        { _id: "s4", year: "Third Year", sectionName: "CSE B" },
        { _id: "s5", year: "Final Year", sectionName: "CSE A" },
        { _id: "s6", year: "Final Year", sectionName: "CSE B" },
      ];
    }
    res.json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ message: "Error fetching sections", error: error.message });
  }
});

// POST add section (HOD only)
router.post("/sections", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { year, sectionName } = req.body;
    if (!year || !sectionName) {
      return res.status(400).json({ message: "Year and sectionName are required" });
    }

    const newSection = await Section.create({ year, sectionName });
    res.status(201).json({ success: true, section: newSection });
  } catch (error) {
    res.status(500).json({ message: "Error creating section", error: error.message });
  }
});

// DELETE section (HOD only)
router.delete("/sections/:id", roleMiddleware(["hod"]), async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Section deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting section", error: error.message });
  }
});

// --- STAFF MANAGEMENT ---

// GET all staff members
router.get("/staff", async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("_id name username isActive createdAt");
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff members", error: error.message });
  }
});

// POST add staff user (HOD only)
router.post("/staff", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ message: "Name, username, and password are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = await User.create({
      name,
      username,
      password: hashedPassword,
      role: "staff",
    });

    res.status(201).json({
      success: true,
      staff: {
        _id: newStaff._id,
        name: newStaff.name,
        username: newStaff.username,
        role: newStaff.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating staff user", error: error.message });
  }
});

// --- STUDENTS & PARENTS ---

// GET students with filtering
router.get("/students", async (req, res) => {
  try {
    const { year, section, search } = req.query;
    const filter = {};
    if (year) filter.year = year;
    if (section) filter.section = section;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { registerNumber: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(filter)
      .populate("parentId")
      .sort({ registerNumber: 1 });

    res.json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

// POST add single student + parent details (HOD only)
router.post("/students", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const {
      registerNumber,
      name,
      gender = "Male",
      year,
      section,
      academicYear = "2026-2027",
      parentName,
      relationship = "Father",
      mobileNumber,
      whatsappNumber,
      email = "student@college.edu",
      phone = "9876543210",
    } = req.body;

    if (!registerNumber || !name || !year || !section || !parentName || !mobileNumber) {
      return res.status(400).json({ message: "All required student and parent fields must be provided" });
    }

    let parent = await Parent.findOne({ mobileNumber });
    if (!parent) {
      parent = await Parent.create({
        name: parentName,
        relationship,
        mobileNumber,
        whatsappNumber: whatsappNumber || mobileNumber,
      });
    } else {
      // Sync parent name if changed
      parent.name = parentName;
      await parent.save();
    }

    // Try to find if student already exists
    let student = await Student.findOne({ registerNumber });
    if (student) {
      // Update existing student details
      student.name = name;
      student.gender = gender;
      student.year = year;
      student.section = section;
      student.academicYear = academicYear;
      student.parentId = parent._id;
      student.isActive = true;
      // Sync phone and email as well
      student.phone = mobileNumber;
      student.email = `${registerNumber.toLowerCase()}@kce.ac.in`;
      await student.save();
    } else {
      // Create new student record
      const studentEmail = `${registerNumber.toLowerCase()}@kce.ac.in`;
      student = await Student.create({
        registerNumber,
        name,
        gender,
        email: studentEmail,
        phone: mobileNumber,
        year,
        section,
        academicYear,
        parentId: parent._id,
      });
    }

    // Ensure student reference is linked in parent
    if (!parent.students) parent.students = [];
    if (!parent.students.some((id) => id.toString() === student._id.toString())) {
      parent.students.push(student._id);
      await parent.save();
    }

    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error("CRITICAL error in POST /students:", error);
    res.status(500).json({ message: "Error adding student", error: error.message });
  }
});

// POST bulk add students + parents details (HOD only)
router.post("/students/bulk", roleMiddleware(["hod"]), async (req, res) => {
  try {
    const { students, year, section, academicYear = "2026-2027" } = req.body;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: "Invalid students list format" });
    }
    if (!year || !section) {
      return res.status(400).json({ message: "Year and Section are required fields" });
    }

    // 1. Clean & validate incoming record objects
    const cleanedRecords = [];
    for (const rec of students) {
      if (!rec || !rec.registerNumber || !rec.name || !rec.mobileNumber) continue;

      const regNumStr = String(rec.registerNumber).trim();
      const studentNameStr = String(rec.name).trim();

      // Never store a phone number as the parent name
      const isPhoneStr = (v) => typeof v === "string" && v.replace(/\D/g, "").length >= 8 && /^\d[\d\s\-+().]{6,}$/.test(v.trim());
      const rawParentName = rec.parentName ? String(rec.parentName).trim() : "";
      const parentNameStr = rawParentName && !isPhoneStr(rawParentName) ? rawParentName : "Parent";

      let cleanedMobile = String(rec.mobileNumber).replace(/\D/g, "");
      if (cleanedMobile.length > 10) cleanedMobile = cleanedMobile.slice(-10);
      if (cleanedMobile.length < 10) cleanedMobile = cleanedMobile.padStart(10, "9");

      const validGender =
        rec.gender && (String(rec.gender).toLowerCase() === "female" || String(rec.gender).toLowerCase() === "f")
          ? "Female"
          : "Male";

      let validRel = "Father";
      if (rec.relationship) {
        const r = String(rec.relationship).toLowerCase();
        if (r.includes("mother") || r === "m") validRel = "Mother";
        else if (r.includes("guardian") || r === "g") validRel = "Guardian";
      }

      cleanedRecords.push({
        registerNumber: regNumStr,
        name: studentNameStr,
        parentName: parentNameStr,
        mobileNumber: cleanedMobile,
        gender: validGender,
        relationship: validRel,
      });
    }

    if (cleanedRecords.length === 0) {
      return res.status(400).json({ message: "No valid student records provided" });
    }

    // 2. Batch fetch & create parents
    const mobileNumbers = [...new Set(cleanedRecords.map((r) => r.mobileNumber))];
    const regNumbers = [...new Set(cleanedRecords.map((r) => r.registerNumber))];

    const existingParents = await Parent.find({ mobileNumber: { $in: mobileNumbers } });
    const parentMap = new Map();
    existingParents.forEach((p) => parentMap.set(p.mobileNumber, p));

    const newParentsToCreate = [];
    const createdMobileSet = new Set();

    for (const rec of cleanedRecords) {
      if (!parentMap.has(rec.mobileNumber) && !createdMobileSet.has(rec.mobileNumber)) {
        createdMobileSet.add(rec.mobileNumber);
        newParentsToCreate.push({
          name: rec.parentName,
          relationship: rec.relationship,
          mobileNumber: rec.mobileNumber,
          whatsappNumber: rec.mobileNumber,
          students: [],
        });
      }
    }

    if (newParentsToCreate.length > 0) {
      const createdParents = await Parent.insertMany(newParentsToCreate);
      createdParents.forEach((p) => parentMap.set(p.mobileNumber, p));
    }

    // 3. Batch bulkWrite students
    const existingStudents = await Student.find({ registerNumber: { $in: regNumbers } });
    const studentMap = new Map();
    existingStudents.forEach((s) => studentMap.set(s.registerNumber, s));

    const bulkOps = [];
    for (const rec of cleanedRecords) {
      const parent = parentMap.get(rec.mobileNumber);
      if (!parent) continue;
      const parentId = parent._id || parent.id;
      const studentEmail = `${rec.registerNumber.toLowerCase()}@kce.ac.in`;

      if (studentMap.has(rec.registerNumber)) {
        bulkOps.push({
          updateOne: {
            filter: { registerNumber: rec.registerNumber },
            update: {
              $set: {
                name: rec.name,
                gender: rec.gender,
                year,
                section,
                academicYear,
                parentId,
                phone: rec.mobileNumber,
                email: studentEmail,
                isActive: true,
              },
            },
          },
        });
      } else {
        bulkOps.push({
          insertOne: {
            document: {
              registerNumber: rec.registerNumber,
              name: rec.name,
              gender: rec.gender,
              email: studentEmail,
              phone: rec.mobileNumber,
              year,
              section,
              academicYear,
              parentId,
              isActive: true,
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    // 4. Batch link student IDs to parents
    const allStudents = await Student.find({ registerNumber: { $in: regNumbers } });
    const parentStudentsMap = new Map();

    allStudents.forEach((st) => {
      const pId = st.parentId.toString();
      if (!parentStudentsMap.has(pId)) {
        parentStudentsMap.set(pId, new Set());
      }
      parentStudentsMap.get(pId).add(st._id);
    });

    const parentUpdateOps = [];
    for (const [pId, stIdSet] of parentStudentsMap.entries()) {
      parentUpdateOps.push({
        updateOne: {
          filter: { _id: pId },
          update: { $addToSet: { students: { $each: Array.from(stIdSet) } } },
        },
      });
    }

    if (parentUpdateOps.length > 0) {
      await Parent.bulkWrite(parentUpdateOps);
    }

    res.status(201).json({
      success: true,
      count: allStudents.length,
      message: `Successfully processed ${allStudents.length} student records in bulk.`,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Error performing bulk upload", error: error.message });
  }
});

// DELETE student (HOD only)
router.delete("/students/:id", roleMiddleware(["hod"]), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
});

module.exports = router;
