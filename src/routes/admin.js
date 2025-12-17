import express from "express";
import { body, validationResult } from "express-validator";
import { requireRole } from "../middlewares/auth.js";
import { User, ActivityLog, Course, Enrollment, Classroom, TrustedDevice, Session } from "../models/index.js";
import { generateCode } from "../utils/verification.js";
import { hashPassword } from "../utils/password.js";
import mongoose from "mongoose";
import { DEFAULT_TEACHER_PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

// Only admin can access these routes
// Zero Trust: phân quyền – chỉ người dùng có vai trò 'admin' mới được phép truy cập
router.use(requireRole("admin"));

// Enforce admin access only from trusted device or internal network
router.use(async (req, res, next) => {
  try {
    // Zero Trust: chỉ cho phép Admin từ IP nội bộ hoặc thiết bị đã được tin cậy
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const device = req.headers["user-agent"] || "unknown";
    const isInternalIp = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.)/.test(ip);
    const trusted = await TrustedDevice.findOne({ user_id: req.user.id, device_info: device }).lean();
    if (!isInternalIp && !trusted) {
      req.policyInfo = "admin_trusted_or_internal";
      return res.status(403).json({ error: "Admin access requires trusted device or internal network" });
    }
    req.policyInfo = "admin_trusted_or_internal";
    next();
  } catch (err) {
    return res.status(403).json({ error: "Admin access restricted" });
  }
});

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
        permissions: DEFAULT_TEACHER_PERMISSIONS,
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
      .select("username email status created_at full_name permissions")
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
      try { await Session.deleteMany({ user_id: user._id }); } catch (_) {}
      return res.status(200).json({ id: user._id, status: user.status });
    } catch (err) {
      return res.status(500).json({ error: "Failed to update status" });
    }
  }
);

// Update user permissions (admin-only)
router.patch(
  "/users/:id/permissions",
  [
    body("permissions").isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user id" });
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.role !== "teacher") return res.status(400).json({ error: "Only teachers have permissions to manage" });

      user.permissions = permissions;
      await user.save();
      return res.status(200).json({ id: user._id, permissions: user.permissions });
    } catch (err) {
      return res.status(500).json({ error: "Failed to update permissions" });
    }
  }
);

// Block any attempt to create an admin account via API (no route provided).
// For visibility, admin can list activity logs with filters
router.get("/activity", async (req, res) => {
  try {
    // Theo dõi: endpoint cho admin xem nhật ký hoạt động toàn hệ thống (lọc theo user/status)
    const { userId, status, limit = 50 } = req.query;
    const query = {};
    if (userId) query.user_id = userId;
    if (status) query.status = status;
    const items = await ActivityLog.find(query)
      .populate("user_id", "username full_name role")
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// List courses (admin-only)
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({})
      .select("code title status created_at updated_at lecturer_id")
      .populate("lecturer_id", "full_name username")
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post(
  "/courses",
  [
    body("title").isString().isLength({ min: 3 }),
    body("description").optional().isString(),
    body("lecturer_id").optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { title, description, lecturer_id } = req.body;
      let lecturer = null;
      if (lecturer_id) {
        lecturer = await User.findById(lecturer_id);
        if (!lecturer || lecturer.role !== "teacher") {
          return res.status(400).json({ error: "Invalid lecturer_id" });
        }
      }
      let code = generateCode();
      for (let i = 0; i < 3; i++) {
        const exists = await Course.findOne({ code }).lean();
        if (!exists) break;
        code = generateCode();
      }
      const course = await Course.create({
        code,
        title: String(title || "").trim(),
        description: typeof description === "string" ? description : undefined,
        lecturer_id: lecturer ? lecturer._id : undefined,
        updated_at: new Date(),
      });
      return res.status(201).json({ id: course._id, title: course.title, code: course.code });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err?.message || "Create course failed" });
    }
  }
);

// List recent enrollments (admin-only)
router.get("/enrollments", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const items = await Enrollment.find({})
      .populate("student_id", "full_name username email")
      .populate("course_id", "title status")
      .sort({ enrolled_at: -1 })
      .limit(Number(limit))
      .lean();
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

router.get("/classes", async (req, res) => {
  try {
    const classes = await Classroom.find({})
      .select("name status created_at updated_at course_id teacher_id join_code")
      .populate("course_id", "title")
      .populate("teacher_id", "full_name username")
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json(classes);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch classes" });
  }
});

router.post(
  "/classes",
  [
    body("name").isString().isLength({ min: 1 }),
    body("course_id").isMongoId(),
    body("teacher_id").optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, course_id, teacher_id } = req.body;
      const course = await Course.findById(course_id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      let teacher = null;
      if (teacher_id) {
        teacher = await User.findById(teacher_id);
        if (!teacher || teacher.role !== "teacher") {
          return res.status(400).json({ error: "Invalid teacher_id" });
        }
      }
      let code = generateCode();
      for (let i = 0; i < 3; i++) {
        const exists = await Classroom.findOne({ join_code: code }).lean();
        if (!exists) break;
        code = generateCode();
      }
      const classroom = await Classroom.create({
        name,
        course_id: course._id,
        teacher_id: teacher ? teacher._id : undefined,
        updated_at: new Date(),
        join_code: code,
      });
      return res.status(201).json({ id: classroom._id, name: classroom.name, join_code: classroom.join_code });
    } catch (err) {
      return res.status(500).json({ error: "Create class failed" });
    }
  }
);

router.patch("/classes/:id/regenerate-code", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });
  try {
      const cls = await Classroom.findById(id);
      if (!cls) return res.status(404).json({ error: "Class not found" });
      let code = generateCode();
      for (let i = 0; i < 3; i++) {
        const exists = await Classroom.findOne({ join_code: code }).lean();
        if (!exists) break;
        code = generateCode();
      }
      cls.join_code = code;
      cls.updated_at = new Date();
      await cls.save();
      return res.status(200).json({ id: cls._id, join_code: cls.join_code });
    } catch (err) {
      return res.status(500).json({ error: "Regenerate code failed" });
    }
  });

// Delete user (admin-only)
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user id" });
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Prevent deleting self or other admins
    if (user.role === "admin") {
       return res.status(403).json({ error: "Cannot delete admin account" });
    }

    await User.findByIdAndDelete(id);
    // Cleanup related data
    try { await Session.deleteMany({ user_id: id }); } catch (_) {}
    try { await Enrollment.deleteMany({ student_id: id }); } catch (_) {}
    try { await ClassMember.deleteMany({ student_id: id }); } catch (_) {}
    // If teacher, maybe clean up courses/classes? For now, keep it simple or set lecturer_id to null?
    // Doing nothing leaves orphaned courses/classes, which might be okay or handled elsewhere.

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
