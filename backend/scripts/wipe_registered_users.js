import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import {
  User,
  Session,
  ActivityLog,
  LoginChallenge,
  PasswordReset,
  EmailVerification,
  FailedLogin,
  Enrollment,
  Grade,
} from "../src/models/index.js";

async function run() {
  await connectDB();

  // Find all non-admin users
  const users = await User.find({ role: { $in: ["teacher", "student"] } })
    .select("_id username")
    .lean();

  const userIds = users.map((u) => u._id);
  const usernames = users.map((u) => u.username);

  if (userIds.length === 0) {
    console.log("No registered non-admin accounts found.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${userIds.length} registered accounts to delete (non-admin).`);

  const results = {};
  // Delete related records first, then users
  results.sessions = await Session.deleteMany({ user_id: { $in: userIds } });
  results.activityLogs = await ActivityLog.deleteMany({ user_id: { $in: userIds } });
  results.loginChallenges = await LoginChallenge.deleteMany({ user_id: { $in: userIds } });
  results.passwordResets = await PasswordReset.deleteMany({ user_id: { $in: userIds } });
  results.emailVerifications = await EmailVerification.deleteMany({ user_id: { $in: userIds } });
  results.failedLogins = await FailedLogin.deleteMany({ username: { $in: usernames } });
  // Student-specific relationships
  results.enrollments = await Enrollment.deleteMany({ student_id: { $in: userIds } });
  results.grades = await Grade.deleteMany({ $or: [{ student_id: { $in: userIds } }, { graded_by: { $in: userIds } }] });

  // Finally delete users
  results.users = await User.deleteMany({ _id: { $in: userIds } });

  console.log("Deletion summary:");
  for (const [key, val] of Object.entries(results)) {
    console.log(`- ${key}: ${val?.deletedCount ?? 0}`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Wipe failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});