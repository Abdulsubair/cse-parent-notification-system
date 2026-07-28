const mongoose = require("mongoose");
const {
  Student,
  Parent,
  MessageTemplate,
  StaffAssignment,
  User,
  AcademicYear,
  Section,
} = require("./models");
require("dotenv").config();


const sampleStudents = [
  // Second Year - CSE A
  {
    registerNumber: "24CS001",
    name: "Abdul Rasheed",
    email: "abdul.rasheed@kce.ac.in",
    phone: "9876543210",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS002",
    name: "Kumar Jayavelu",
    email: "kumar.jayavelu@kce.ac.in",
    phone: "9876543211",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS003",
    name: "Ravi Chandran",
    email: "ravi.chandran@kce.ac.in",
    phone: "9876543212",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS004",
    name: "Arun Kumar",
    email: "arun.kumar@kce.ac.in",
    phone: "9876543213",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS005",
    name: "Bharath S",
    email: "bharath.s@kce.ac.in",
    phone: "9876543214",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS006",
    name: "Chitra R",
    email: "chitra.r@kce.ac.in",
    phone: "9876543215",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS007",
    name: "Deepika M",
    email: "deepika.m@kce.ac.in",
    phone: "9876543216",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS008",
    name: "Ezhil Arasan",
    email: "ezhil.arasan@kce.ac.in",
    phone: "9876543217",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS009",
    name: "Fancy B",
    email: "fancy.b@kce.ac.in",
    phone: "9876543218",
    year: "Second Year",
    section: "CSE A",
  },
  {
    registerNumber: "24CS010",
    name: "Ganesh K",
    email: "ganesh.k@kce.ac.in",
    phone: "9876543219",
    year: "Second Year",
    section: "CSE A",
  },

  // Second Year - CSE B
  {
    registerNumber: "24CS101",
    name: "Harini V",
    email: "harini.v@kce.ac.in",
    phone: "9876543220",
    year: "Second Year",
    section: "CSE B",
  },
  {
    registerNumber: "24CS102",
    name: "Isha Sharma",
    email: "isha.sharma@kce.ac.in",
    phone: "9876543221",
    year: "Second Year",
    section: "CSE B",
  },
  {
    registerNumber: "24CS103",
    name: "Jasmine T",
    email: "jasmine.t@kce.ac.in",
    phone: "9876543222",
    year: "Second Year",
    section: "CSE B",
  },
  {
    registerNumber: "24CS104",
    name: "Karthik P",
    email: "karthik.p@kce.ac.in",
    phone: "9876543223",
    year: "Second Year",
    section: "CSE B",
  },
  {
    registerNumber: "24CS105",
    name: "Lakshmi N",
    email: "lakshmi.n@kce.ac.in",
    phone: "9876543224",
    year: "Second Year",
    section: "CSE B",
  },

  // Third Year - CSE A
  {
    registerNumber: "23CS001",
    name: "Mani R",
    email: "mani.r@kce.ac.in",
    phone: "9876543225",
    year: "Third Year",
    section: "CSE A",
  },
  {
    registerNumber: "23CS002",
    name: "Nisha D",
    email: "nisha.d@kce.ac.in",
    phone: "9876543226",
    year: "Third Year",
    section: "CSE A",
  },
  {
    registerNumber: "23CS003",
    name: "Omkar S",
    email: "omkar.s@kce.ac.in",
    phone: "9876543227",
    year: "Third Year",
    section: "CSE A",
  },
  {
    registerNumber: "23CS004",
    name: "Priya K",
    email: "priya.k@kce.ac.in",
    phone: "9876543228",
    year: "Third Year",
    section: "CSE A",
  },
  {
    registerNumber: "23CS005",
    name: "Qasim A",
    email: "qasim.a@kce.ac.in",
    phone: "9876543229",
    year: "Third Year",
    section: "CSE A",
  },

  // Third Year - CSE B
  {
    registerNumber: "23CS101",
    name: "Rajesh V",
    email: "rajesh.v@kce.ac.in",
    phone: "9876543230",
    year: "Third Year",
    section: "CSE B",
  },
  {
    registerNumber: "23CS102",
    name: "Sneha P",
    email: "sneha.p@kce.ac.in",
    phone: "9876543231",
    year: "Third Year",
    section: "CSE B",
  },
  {
    registerNumber: "23CS103",
    name: "Tanvi M",
    email: "tanvi.m@kce.ac.in",
    phone: "9876543232",
    year: "Third Year",
    section: "CSE B",
  },

  // Final Year - CSE A
  {
    registerNumber: "22CS001",
    name: "Uday Kumar",
    email: "uday.kumar@kce.ac.in",
    phone: "9876543233",
    year: "Final Year",
    section: "CSE A",
  },
  {
    registerNumber: "22CS002",
    name: "Varun A",
    email: "varun.a@kce.ac.in",
    phone: "9876543234",
    year: "Final Year",
    section: "CSE A",
  },
  {
    registerNumber: "22CS003",
    name: "Waqar Khan",
    email: "waqar.khan@kce.ac.in",
    phone: "9876543235",
    year: "Final Year",
    section: "CSE A",
  },

  // Final Year - CSE B
  {
    registerNumber: "22CS101",
    name: "Xavier D",
    email: "xavier.d@kce.ac.in",
    phone: "9876543236",
    year: "Final Year",
    section: "CSE B",
  },
  {
    registerNumber: "22CS102",
    name: "Yuki Tanaka",
    email: "yuki.tanaka@kce.ac.in",
    phone: "9876543237",
    year: "Final Year",
    section: "CSE B",
  },
];

const sampleParents = [
  // Parents for Second Year CSE A
  {
    name: "Mr. Rasheed Ali",
    relationship: "Father",
    mobileNumber: "9876543210",
    whatsappNumber: "9876543210",
    email: "rasheed.ali@gmail.com",
  },
  {
    name: "Mr. Jayavelu K",
    relationship: "Father",
    mobileNumber: "9876543211",
    whatsappNumber: "9876543211",
    email: "jayavelu.k@gmail.com",
  },
  {
    name: "Mr. Chandran R",
    relationship: "Father",
    mobileNumber: "9876543212",
    whatsappNumber: "9876543212",
    email: "chandran.r@gmail.com",
  },
  {
    name: "Mrs. Kumar Priya",
    relationship: "Mother",
    mobileNumber: "9876543213",
    whatsappNumber: "9876543213",
    email: "kumar.priya@gmail.com",
  },
  {
    name: "Mr. Bharath S",
    relationship: "Father",
    mobileNumber: "9876543214",
    whatsappNumber: "9876543214",
    email: "bharath.s@gmail.com",
  },
  {
    name: "Mrs. Chitra M",
    relationship: "Mother",
    mobileNumber: "9876543215",
    whatsappNumber: "9876543215",
    email: "chitra.m@gmail.com",
  },
  {
    name: "Mr. Deepak M",
    relationship: "Father",
    mobileNumber: "9876543216",
    whatsappNumber: "9876543216",
    email: "deepak.m@gmail.com",
  },
  {
    name: "Mr. Arasan E",
    relationship: "Father",
    mobileNumber: "9876543217",
    whatsappNumber: "9876543217",
    email: "arasan.e@gmail.com",
  },
  {
    name: "Mrs. Fancy B",
    relationship: "Mother",
    mobileNumber: "9876543218",
    whatsappNumber: "9876543218",
    email: "fancy.b@gmail.com",
  },
  {
    name: "Mr. Ganesh K",
    relationship: "Father",
    mobileNumber: "9876543219",
    whatsappNumber: "9876543219",
    email: "ganesh.k@gmail.com",
  },

  // Parents for Second Year CSE B
  {
    name: "Mrs. Harini V",
    relationship: "Mother",
    mobileNumber: "9876543220",
    whatsappNumber: "9876543220",
    email: "harini.v@gmail.com",
  },
  {
    name: "Mr. Sharma V",
    relationship: "Father",
    mobileNumber: "9876543221",
    whatsappNumber: "9876543221",
    email: "sharma.v@gmail.com",
  },
  {
    name: "Mr. Thomas J",
    relationship: "Father",
    mobileNumber: "9876543222",
    whatsappNumber: "9876543222",
    email: "thomas.j@gmail.com",
  },
  {
    name: "Mr. Karthik P",
    relationship: "Father",
    mobileNumber: "9876543223",
    whatsappNumber: "9876543223",
    email: "karthik.p@gmail.com",
  },
  {
    name: "Mrs. Lakshmi S",
    relationship: "Mother",
    mobileNumber: "9876543224",
    whatsappNumber: "9876543224",
    email: "lakshmi.s@gmail.com",
  },

  // Parents for Third Year
  {
    name: "Mr. Mani R",
    relationship: "Father",
    mobileNumber: "9876543225",
    whatsappNumber: "9876543225",
    email: "mani.r@gmail.com",
  },
  {
    name: "Mrs. Nisha D",
    relationship: "Mother",
    mobileNumber: "9876543226",
    whatsappNumber: "9876543226",
    email: "nisha.d@gmail.com",
  },
  {
    name: "Mr. Omkar S",
    relationship: "Father",
    mobileNumber: "9876543227",
    whatsappNumber: "9876543227",
    email: "omkar.s@gmail.com",
  },
  {
    name: "Mrs. Priya K",
    relationship: "Mother",
    mobileNumber: "9876543228",
    whatsappNumber: "9876543228",
    email: "priya.k@gmail.com",
  },
  {
    name: "Mr. Qasim A",
    relationship: "Father",
    mobileNumber: "9876543229",
    whatsappNumber: "9876543229",
    email: "qasim.a@gmail.com",
  },
  {
    name: "Mr. Rajesh V",
    relationship: "Father",
    mobileNumber: "9876543230",
    whatsappNumber: "9876543230",
    email: "rajesh.v@gmail.com",
  },
  {
    name: "Mrs. Sneha P",
    relationship: "Mother",
    mobileNumber: "9876543231",
    whatsappNumber: "9876543231",
    email: "sneha.p@gmail.com",
  },
  {
    name: "Mrs. Tanvi M",
    relationship: "Mother",
    mobileNumber: "9876543232",
    whatsappNumber: "9876543232",
    email: "tanvi.m@gmail.com",
  },

  // Parents for Final Year
  {
    name: "Mr. Uday Kumar",
    relationship: "Father",
    mobileNumber: "9876543233",
    whatsappNumber: "9876543233",
    email: "uday.kumar@gmail.com",
  },
  {
    name: "Mr. Varun A",
    relationship: "Father",
    mobileNumber: "9876543234",
    whatsappNumber: "9876543234",
    email: "varun.a@gmail.com",
  },
  {
    name: "Mr. Waqar Khan",
    relationship: "Father",
    mobileNumber: "9876543235",
    whatsappNumber: "9876543235",
    email: "waqar.khan@gmail.com",
  },
  {
    name: "Mr. Xavier D",
    relationship: "Father",
    mobileNumber: "9876543236",
    whatsappNumber: "9876543236",
    email: "xavier.d@gmail.com",
  },
  {
    name: "Mrs. Yuki Tanaka",
    relationship: "Mother",
    mobileNumber: "9876543237",
    whatsappNumber: "9876543237",
    email: "yuki.tanaka@gmail.com",
  },
];

const sampleMessageTemplates = [
  {
    name: "Absence Notification",
    description: "Default absence notification template",
    english:
      "Dear Parent, your son/daughter [Student Name] (CSE Dept) is absent for college today, [Date]. Please contact the CSE Head of Department (HOD) immediately. – Kings College of Engineering.",
    tamil:
      "அன்புள்ள பெற்றோருக்கு, உங்கள் பிள்ளை [மாணவர் பெயர்] (கணினி அறிவியல் துறை) இன்று ([தேதி]) கல்லூரிக்கு வரவில்லை. உடனடியாக துறைத் தலைவரை (HOD) தொடர்பு கொள்ளவும். – கிங்ஸ் பொறியியல் கல்லூரி",
    type: "Absence",
    isActive: true,
    isDefault: true,
    placeholders: [
      {
        name: "[Student Name]",
        description: "Student's name will be auto-filled",
      },
      {
        name: "[Date]",
        description: "Attendance date will be auto-filled",
      },
    ],
  },
  {
    name: "Multiple Absence Notification",
    description: "Notification for repeated absences",
    english:
      "Dear Parents,\n\nWe notice that your ward [Student Name] has been absent for [Number] days in the past [Period].\n\nKindly ensure regular attendance as per college regulations.\n\nRegards,\nCSE Department",
    tamil:
      "அன்புள்ள பெற்றோர்களே,\n\nஉங்கள் மாணவர் [மாணவர் பெயர்] கடந்த [காலம்] நாட்களில் [எண்] நாட்கள் வரவில்லை என்பதை நாம் கவனிக்கிறோம்.\n\nகல்லூரி விதிகளுக்கு ஏற்ப தொடர்ந்து வருமாறு கேட்டுக் கொள்கிறோம்.\n\nவணக்கம்,\nCSE பிரிவு",
    type: "Absence",
    isActive: true,
    isDefault: false,
    placeholders: [
      {
        name: "[Student Name]",
        description: "Student's name",
      },
      {
        name: "[Number]",
        description: "Number of absences",
      },
      {
        name: "[Period]",
        description: "Time period",
      },
    ],
  },
  {
    name: "Perfect Attendance Award",
    description: "Congratulations message for perfect attendance",
    english:
      "Congratulations!\n\nYour ward [Student Name] has maintained perfect attendance this month.\n\nKeep up the excellent work!\n\nRegards,\nCSE Department",
    tamil:
      "வாழ்த்துக்கள்!\n\nஉங்கள் மாணவர் [மாணவர் பெயர்] இந்த மாதம் சரியான வருகை பராமரித்துள்ளார்.\n\nஇந்த சிறந்த செயல்பாட்டை தொடர்ந்து வைக்கவும்!\n\nவணக்கம்,\nCSE பிரிவு",
    type: "Attendance",
    isActive: true,
    isDefault: false,
    placeholders: [
      {
        name: "[Student Name]",
        description: "Student's name",
      },
    ],
  },
  {
    name: "Low Performance Alert",
    description: "Alert for low academic performance",
    english:
      "Dear Parents,\n\nWe would like to inform you that [Student Name] is showing low performance in academics.\n\nPlease schedule a meeting with the department to discuss this matter.\n\nRegards,\nCSE Department",
    tamil:
      "அன்புள்ள பெற்றோர்களே,\n\n[மாணவர் பெயர்] கல்வியில் குறைந்த செயல்பாட்டை காட்டுகிறார் என்பதை நாம் உங்களுக்கு தெரிவிக்க விரும்புகிறோம்.\n\nஇந்த விஷயத்தை விவாதிக்க பிரிவுடன் சந்திப்பு நேரமாக நிர்ணயிக்கவும்.\n\nவணக்கம்,\nCSE பிரிவு",
    type: "Performance",
    isActive: true,
    isDefault: false,
    placeholders: [
      {
        name: "[Student Name]",
        description: "Student's name",
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data (optional - comment out to preserve data)
    console.log("\n📊 Clearing existing data...");
    await Student.deleteMany({});
    await Parent.deleteMany({});
    await MessageTemplate.deleteMany({});
    await StaffAssignment.deleteMany({});
    await AcademicYear.deleteMany({});
    await Section.deleteMany({});
    console.log("✅ Cleared old data");

    // Seed Academic Years
    console.log("\n📅 Seeding Academic Years...");
    await AcademicYear.insertMany([
      { yearRange: "2026–2027", isCurrent: true },
      { yearRange: "2025–2026", isCurrent: false },
      { yearRange: "2027–2028", isCurrent: false },
    ]);
    console.log("✅ Academic Years seeded");

    // Seed Sections
    console.log("\n🏫 Seeding Sections & Classes...");
    await Section.insertMany([
      { year: "Second Year", sectionName: "CSE A" },
      { year: "Second Year", sectionName: "CSE B" },
      { year: "Third Year", sectionName: "CSE A" },
      { year: "Third Year", sectionName: "CSE B" },
      { year: "Final Year", sectionName: "CSE A" },
      { year: "Final Year", sectionName: "CSE B" },
    ]);
    console.log("✅ Sections seeded");


    // Create parents first
    console.log("\n👨‍👩‍👧‍👦 Creating parents...");
    const createdParents = await Parent.insertMany(sampleParents);
    console.log(`✅ Created ${createdParents.length} parents`);

    // Create students with parent references
    console.log("\n👨‍🎓 Creating students...");
    let studentIndex = 0;
    for (const student of sampleStudents) {
      student.parentId = createdParents[studentIndex]._id;
      studentIndex++;
    }
    const createdStudents = await Student.insertMany(sampleStudents);
    console.log(`✅ Created ${createdStudents.length} students`);

    // Update parents with student references
    console.log("\n🔗 Linking parents to students...");
    for (let i = 0; i < createdParents.length; i++) {
      await Parent.findByIdAndUpdate(createdParents[i]._id, {
        students: [createdStudents[i]._id],
      });
    }
    console.log("✅ Parents linked to students");

    // Create message templates
    console.log("\n📝 Creating message templates...");
    const createdTemplates = await MessageTemplate.insertMany(
      sampleMessageTemplates
    );
    console.log(`✅ Created ${createdTemplates.length} message templates`);

    // Create staff assignments
    console.log("\n👨‍🏫 Creating staff assignments...");
    const staff = await User.findOne({ role: "staff" });
    if (staff) {
      const staffAssignment = await StaffAssignment.create({
        userId: staff._id,
        assignedClasses: [
          {
            academicYear: "2026-2027",
            year: "Second Year",
            section: "CSE A",
          },
          {
            academicYear: "2026-2027",
            year: "Second Year",
            section: "CSE B",
          },
          {
            academicYear: "2026-2027",
            year: "Third Year",
            section: "CSE A",
          },
          {
            academicYear: "2026-2027",
            year: "Third Year",
            section: "CSE B",
          },
          {
            academicYear: "2026-2027",
            year: "Final Year",
            section: "CSE A",
          },
          {
            academicYear: "2026-2027",
            year: "Final Year",
            section: "CSE B",
          },
        ],
        department: "CSE",
      });
      console.log("✅ Staff assignments created");
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SAMPLE DATA CREATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`\n📍 Students Created: ${createdStudents.length}`);
    console.log(`📍 Parents Created: ${createdParents.length}`);
    console.log(`📍 Message Templates: ${createdTemplates.length}`);
    console.log(`📍 Staff Assignments: 1`);

    console.log("\n📋 Students by Year and Section:");
    console.log("   Second Year CSE A: 10 students");
    console.log("   Second Year CSE B: 5 students");
    console.log("   Third Year CSE A: 5 students");
    console.log("   Third Year CSE B: 3 students");
    console.log("   Final Year CSE A: 3 students");
    console.log("   Final Year CSE B: 2 students");
    console.log("   Total: 28 students");

    console.log("\n📝 Message Templates:");
    console.log("   1. Absence Notification (Default)");
    console.log("   2. Multiple Absence Notification");
    console.log("   3. Perfect Attendance Award");
    console.log("   4. Low Performance Alert");

    console.log("\n✅ Sample data seeding complete!");
    console.log("=".repeat(60));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
