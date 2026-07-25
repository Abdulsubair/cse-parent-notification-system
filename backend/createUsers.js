const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { User } = require("./models");

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    const hodPassword = await bcrypt.hash("HOD@2026", 10);
    const staffPassword = await bcrypt.hash("Staff@2026", 10);

    await User.deleteMany({});

    await User.create([
      {
        name: "CSE HOD",
        username: "hod_cse",
        password: hodPassword,
        role: "hod",
      },
      {
        name: "CSE Staff",
        username: "staff_cse",
        password: staffPassword,
        role: "staff",
      },
    ]);

    console.log("HOD and Staff users created successfully!");

    console.log("");
    console.log("HOD Login");
    console.log("Username: hod_cse");
    console.log("Password: HOD@2026");

    console.log("");
    console.log("Staff Login");
    console.log("Username: staff_cse");
    console.log("Password: Staff@2026");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
};

createUsers();