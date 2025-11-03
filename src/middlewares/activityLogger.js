import { ActivityLog } from "../models/index.js";

export async function activityLogger(req, res, next) {
  const start = Date.now();
  const userId = req.user?.id || null;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  const device = req.headers["user-agent"] || "unknown";

  res.on("finish", async () => {
    try {
      await ActivityLog.create({
        user_id: userId,
        action: `${req.method} ${req.originalUrl}`,
        target: req.params?.id || "",
        timestamp: new Date(),
        ip_address: ip,
        device_info: device,
        status: `${res.statusCode}`,
      });
    } catch (e) {
      // Swallow logging errors
    }
  });

  next();
}