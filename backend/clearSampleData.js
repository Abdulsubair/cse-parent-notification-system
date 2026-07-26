/**
 * clearSampleData.js
 * Deletes all sample/demo students and their linked parents from MongoDB Atlas.
 * Leaves users, academic years, sections, and message templates untouched.
 *
 * Run once with:  node backend/clearSampleData.js
 */

const mongoose = require("mongoose");
const { Student, Parent } = require("./models");
require("dotenv").config();

const mongoUri =
  process.env.ATLAS_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://asubair383_db_user:CSEParentDB2026Secure1430@cse-parent-db.1hdsq5d.mongodb.net/cse-parent-notification?retryWrites=true&w=majority";

const clearSampleData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas");

    // Count before
    const studentsBefore = await Student.countDocuments();
    const parentsBefore  = await Parent.countDocuments();
    console.log(`\nBefore cleanup:`);
    console.log(`  Students : ${studentsBefore}`);
    console.log(`  Parents  : ${parentsBefore}`);

    // Delete all existing students and parents (the sample ones)
    const studentsDeleted = await Student.deleteMany({});
    const parentsDeleted  = await Parent.deleteMany({});

    console.log(`\n✅ Cleanup complete:`);
    console.log(`  Deleted students : ${studentsDeleted.deletedCount}`);
    console.log(`  Deleted parents  : ${parentsDeleted.deletedCount}`);
    console.log(`\nParent Contacts will now be empty until the HOD registers real students.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

clearSampleData();
