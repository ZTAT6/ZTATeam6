import mongoose from "mongoose";
import { Course } from "../models/index.js";

export async function connectDB() {
  // Use provided URI or default to local MongoDB host
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
  // Select database name via option to work even if URI lacks db segment
  const dbName = process.env.MONGODB_DBNAME || "zero_trust";

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      dbName,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    const safeUri = uri.replace(/\/\/.*@/, "//***@");
    console.log(`MongoDB connected: ${safeUri} (db: ${dbName})`);
    const courseCollection = mongoose.connection.collection("courses");
    const indexes = await courseCollection.indexes();
    const codeIndex = indexes.find((idx) => idx.name === "code_1");
    if (codeIndex) {
      await courseCollection.dropIndex("code_1");
      console.log("Dropped code_1 index from courses (will recreate safely)");
    }
    await Course.syncIndexes();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}