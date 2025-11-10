import express from "express";
import { body, validationResult } from "express-validator";
import { requireRole } from "../middlewares/auth.js";
import { User, ActivityLog, Course, Enrollment } from "../models/index.js";
import { hashPassword } from "../utils/password.js";
import mongoose from "mongoose";

const router = express.Router();

// Only admin can access these routes
router.use(requireRole("admin"));

// Create a teacher account (admin-only)
router.post(
  "/users/teacher",
  [
    body("username").isString().isLength({ min: 3 }),
    body("password").isString().isLength({ min: 8 }),
    body("email").isEmail(),
    body("full_name").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password, email, full_name } = req.body;
      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) return res.status(409).json({ error: "Username or email already exists" });

      const hashed = await hashPassword(password);
      const teacher = await User.create({
        username,
        password: hashed,
        email,
        full_name,
        role: "teacher",
        created_by: req.user.id,
      });

      return res.status(201).json({ id: teacher._id, username: teacher.username, role: teacher.role });
    } catch (err) {
      return res.status(500).json({ error: "Create teacher failed" });
    }
  }
);

// List all students (admin-only)
router.get("/users/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("username email status created_at")
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json(students);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch students" });
  }
});

// List all teachers (admin-only)
router.get("/users/teachers", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("username email status created_at full_name")
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json(teachers);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// Update user status (admin-only)
router.patch(
  "/users/:id/status",
  [
    body("status").isString().isIn(["active", "inactive", "blocked"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user id" });
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      // Prevent demoting/altering other admins' status except self? For now allow, but block if target is admin and not self
      if (user.role === "admin" && req.user.id !== user._id.toString()) {
        return res.status(403).json({ error: "Cannot modify another admin" });
      }
      user.status = status;
      await user.save();
      return res.status(200).json({ id: user._id, status: user.status });
    } catch (err) {
      return res.status(500).json({ error: "Failed to update status" });
    }
  }
);

// Block any attempt to create an admin account via API (no route provided).
// For visibility, admin can list activity logs with filters
router.get("/activity", async (req, res) => {
  try {
    const { userId, status, limit = 50 } = req.query;
    const query = {};
    if (userId) query.user_id = userId;
    if (status) query.status = status;
    const items = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(Number(limit)).lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// List courses (admin-only)
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({}).select("title status created_at updated_at lecturer_id").sort({ created_at: -1 }).lean();
    return res.status(200).json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// List recent enrollments (admin-only)
router.get("/enrollments", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const items = await Enrollment.find({}).sort({ enrolled_at: -1 }).limit(Number(limit)).lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

export default router;