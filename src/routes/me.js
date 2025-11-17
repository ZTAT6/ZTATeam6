import express from "express";
import { ActivityLog, User, Enrollment } from "../models/index.js";

const router = express.Router();

// Get my activity logs
router.get("/activity", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const items = await ActivityLog.find({ user_id: req.user.id })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch my activity logs" });
  }
});

// Get my profile (basic fields)
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("username email full_name role")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get my enrollments
router.get("/enrollments", async (req, res) => {
  try {
    const items = await Enrollment.find({ student_id: req.user.id })
      .populate({ path: "course_id", select: "title status" })
      .sort({ enrolled_at: -1 })
      .lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch my enrollments" });
  }
});

export default router;