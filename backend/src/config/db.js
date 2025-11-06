import mongoose from "mongoose";

export async function connectDB() {
  // Use provided URI or default to local MongoDB host
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
  // Select database name via option to work even if URI lacks db segment
  const dbName = process.env.MONGODB_DBNAME || "edulearn";

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      dbName,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    const safeUri = uri.replace(/\/\/.*@/, "//***@");
    console.log(`MongoDB connected: ${safeUri} (db: ${dbName})`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}