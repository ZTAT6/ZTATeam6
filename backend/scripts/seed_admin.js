import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/index.js";
import { hashPassword } from "../src/utils/password.js";

async function run() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  await connectDB();

  const existing = await User.findOne({ username });
  if (existing) {
    console.log("Admin user already exists:", username);
    await mongoose.disconnect();
    return;
  }

  const hashed = await hashPassword(password);
  const admin = await User.create({
    username,
    email,
    password: hashed,
    role: "admin",
    status: "active",
  });
  console.log("Admin created:", admin.username);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});