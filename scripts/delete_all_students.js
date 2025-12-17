import mongoose from "mongoose";
import { User, Session, Enrollment, ClassMember, SignupVerification, TrustedDevice, ActivityLog, EmailVerification, Grade } from "../src/models/index.js";
import { connectDB } from "../src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function deleteAllStudents() {
  try {
    await connectDB();
    
    console.log("Finding students...");
    const students = await User.find({ role: "student" });
    const studentIds = students.map(u => u._id);
    
    if (studentIds.length === 0) {
      console.log("No students found.");
      process.exit(0);
    }

    console.log(`Found ${studentIds.length} students. Deleting...`);

    // Delete related data
    await Session.deleteMany({ user_id: { $in: studentIds } });
    await Enrollment.deleteMany({ student_id: { $in: studentIds } });
    try {
        // ClassMember might not be exported in index.js, handle gracefully if undefined
        if (typeof ClassMember !== 'undefined') {
            await ClassMember.deleteMany({ student_id: { $in: studentIds } });
        }
    } catch (e) { console.log("ClassMember cleanup skipped or failed"); }

    await TrustedDevice.deleteMany({ user_id: { $in: studentIds } });
    await ActivityLog.deleteMany({ user_id: { $in: studentIds } });
    await EmailVerification.deleteMany({ user_id: { $in: studentIds } });
    await Grade.deleteMany({ student_id: { $in: studentIds } });
    
    // Delete the users
    const result = await User.deleteMany({ _id: { $in: studentIds } });
    
    console.log(`Deleted ${result.deletedCount} student accounts and all related data.`);
    process.exit(0);
  } catch (error) {
    console.error("Error deleting students:", error);
    process.exit(1);
  }
}

deleteAllStudents();
