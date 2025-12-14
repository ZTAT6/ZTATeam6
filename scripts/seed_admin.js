import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/index.js";
import { hashPassword } from "../src/utils/password.js";

async function run() {
  const argUser = process.argv[2];
  const argEmail = process.argv[3];
  const argPass = process.argv[4];
  const username = argUser || process.env.ADMIN_USERNAME || "admin";
  const email = argEmail || process.env.ADMIN_EMAIL || "admin@example.com";
  const password = argPass || process.env.ADMIN_PASSWORD || "ChangeMe123!";

  await connectDB();

  let existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const hashed = await hashPassword(password);
    // Try to set desired username if available or already same
    if (existing.username !== username) {
      const conflict = await User.findOne({ username });
      if (!conflict || String(conflict._id) === String(existing._id)) {
        existing.username = username;
      }
    }
    existing.email = email;
    existing.password = hashed;
    existing.role = "admin";
    existing.status = "active";
    await existing.save();
    console.log("Admin updated:", existing.username);
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
