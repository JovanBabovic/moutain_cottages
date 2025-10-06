import mongoose from "mongoose";
import User from "./models/user.model";
import bcrypt from "bcrypt";

const MONGODB_URI = "mongodb://localhost:27017/mountain-cottage";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      await mongoose.disconnect();
      return;
    }

    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash("Pass123!@", 10);
    const admin = new User({
      username: "admin",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      gender: "M",
      address: "System Address",
      phone: "0000000000",
      email: "admin@mountaincottage.com",
      creditCard: "0000000000000000",
      userType: "admin",
      isActive: true,
    });

    await admin.save();
    console.log("Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: Pass123!@");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding admin:", error);
    await mongoose.disconnect();
  }
}

seedAdmin();
