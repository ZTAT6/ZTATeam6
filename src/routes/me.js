import express from "express";
import { ActivityLog } from "../models/index.js";

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

export default router;