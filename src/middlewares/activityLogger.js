import { ActivityLog, User, Course, Classroom } from "../models/index.js";

export async function activityLogger(req, res, next) {
  const start = Date.now();
  const userId = req.user?.id || null;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  const device = req.headers["user-agent"] || "unknown";

  res.on("finish", async () => {
    try {
      // Theo dõi: middleware ghi log hoạt động cho mọi request (được bảo vệ),
      // lưu hành động, tài nguyên, chính sách áp dụng, IP/thiết bị và mã trạng thái.
      // Zero Trust: ghi nhận hành động kèm chính sách, IP, thiết bị và mã trạng thái
      const url = (req.originalUrl || "").split("?")[0] || "";
      const method = req.method || "";
      const targetId = req.params?.id || "";
      let resource = "";
      let targetName = "";
      const policy = req.policyInfo || "";
      const isId = typeof targetId === "string" && targetId.length === 24;
      if (url.startsWith("/admin/users") && isId) {
        resource = "user";
        try { const u = await User.findById(targetId).select("full_name username email").lean(); if (u) targetName = u.full_name || u.username || u.email || ""; } catch {}
      } else if (url.startsWith("/admin/courses") && isId) {
        resource = "course";
        try { const c = await Course.findById(targetId).select("title").lean(); if (c) targetName = c.title || ""; } catch {}
      } else if (url.startsWith("/admin/classes") && isId) {
        resource = "class";
        try { const cl = await Classroom.findById(targetId).select("name").lean(); if (cl) targetName = cl.name || ""; } catch {}
      }
      await ActivityLog.create({
        user_id: userId,
        action: `${method} ${url}`,
        target: targetId,
        target_name: targetName,
        resource,
        policy,
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
