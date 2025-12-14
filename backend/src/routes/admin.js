import express from "express";
import { body, validationResult } from "express-validator";
import { requireRole } from "../middlewares/auth.js";
import { User, ActivityLog } from "../models/index.js";
import { hashPassword } from "../utils/password.js";

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

export default router;