import express from "express";
import { ActivityLog, User, Enrollment, TrustedDevice } from "../models/index.js";

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

// Trust status for current device
router.get("/trust-status", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const device = req.headers["user-agent"] || "unknown";
    const isInternalIp = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.)/.test(ip);
    const trusted = await TrustedDevice.findOne({ user_id: req.user.id, device_info: device }).lean();
    return res.status(200).json({ trusted: !!trusted, internalIp: isInternalIp });
  } catch (err) {
    return res.status(500).json({ error: "Failed to check trust status" });
  }
});

// List my trusted devices
router.get("/devices", async (req, res) => {
  try {
    const items = await TrustedDevice.find({ user_id: req.user.id })
      .select("device_info ip_address trusted_at last_seen")
      .sort({ last_seen: -1 })
      .lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// Remove a trusted device
router.delete("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await TrustedDevice.deleteOne({ _id: id, user_id: req.user.id });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to remove device" });
  }
});

export default router;