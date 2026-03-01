import express from "express";
import { ActivityLog, User } from "../models/index.js";

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

export default router;