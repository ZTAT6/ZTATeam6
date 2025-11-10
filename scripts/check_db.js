import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function main() {
  try {
    await connectDB();

    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    const port = mongoose.connection.port;

    // Ping the server via admin command
    const pingRes = await mongoose.connection.db.admin().ping();

    // List collections and attempt to count users (optional)
    const collections = await mongoose.connection.db.listCollections().toArray();
    let usersCount = null;
    try {
      usersCount = await mongoose.connection.db.collection("users").countDocuments();
    } catch (_) {}

    const stateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

    console.log(JSON.stringify({
      ok: true,
      readyState: state,
      readyStateText: stateMap[state] || String(state),
      host,
      port,
      dbName,
      pingOk: !!pingRes?.ok,
      collections: collections.map(c => c.name),
      usersCount,
    }, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e?.message || String(e) }));
    process.exit(1);
  }
}

main();