import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import meRoutes from "./routes/me.js";
import { authMiddleware } from "./middlewares/auth.js";
import { activityLogger } from "./middlewares/activityLogger.js";

const app = express();

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy for rate limiting behind proxies
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS (adjust origin as needed)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Logging
app.use(morgan("combined"));

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
await connectDB();

// Global rate limiter (general)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// In production, serve the React build from frontend/dist
const clientDist = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(clientDist));

// Routes
app.use("/auth", authRoutes);
app.use("/admin", authMiddleware, activityLogger, adminRoutes);
app.use("/me", authMiddleware, activityLogger, meRoutes);

// Health
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// SPA fallback: match any route NOT starting with /auth, /admin, /me, /health
app.get(/^(?!\/(auth|admin|me|health)).*/, (req, res) => {
  return res.sendFile(path.join(clientDist, "index.html"));
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});