import express from "express"
import { body, validationResult } from "express-validator"
import mongoose from "mongoose"
import { requireRole } from "../middlewares/auth.js"
import { Course, Classroom } from "../models/index.js"
import { generateCode } from "../utils/verification.js"

const router = express.Router()

router.use(requireRole("teacher"))

router.get("/courses", async (req, res) => {
  try {
    const items = await Course.find({ lecturer_id: req.user.id })
      .select("title status created_at updated_at")
      .sort({ created_at: -1 })
      .lean()
    return res.status(200).json(items)
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch my courses" })
  }
})

router.get("/classes", async (req, res) => {
  try {
    const items = await Classroom.find({ teacher_id: req.user.id })
      .select("name status created_at updated_at course_id teacher_id join_code")
      .sort({ created_at: -1 })
      .lean()
    return res.status(200).json(items)
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch my classes" })
  }
})

router.post(
  "/classes",
  [
    body("name").isString().isLength({ min: 1 }),
    body("course_id").isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
      const { name, course_id } = req.body
      if (!mongoose.Types.ObjectId.isValid(course_id)) return res.status(400).json({ error: "Invalid course_id" })
      const course = await Course.findById(course_id)
      if (!course) return res.status(404).json({ error: "Course not found" })
      if (!course.lecturer_id || course.lecturer_id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not allowed to create class for this course" })
      }
      let code = generateCode()
      for (let i = 0; i < 3; i++) {
        const exists = await Classroom.findOne({ join_code: code }).lean()
        if (!exists) break
        code = generateCode()
      }
      const classroom = await Classroom.create({
        name,
        course_id: course._id,
        teacher_id: req.user.id,
        updated_at: new Date(),
        join_code: code,
      })
      return res.status(201).json({ id: classroom._id, name: classroom.name, join_code: classroom.join_code })
    } catch (err) {
      return res.status(500).json({ error: "Create class failed" })
    }
  }
)

router.patch(
  "/classes/:id",
  [
    body("name").optional().isString().isLength({ min: 1 }),
    body("status").optional().isString().isIn(["active", "inactive", "blocked"]),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" })
    try {
      const cls = await Classroom.findOne({ _id: id, teacher_id: req.user.id })
      if (!cls) return res.status(404).json({ error: "Class not found" })
      const { name, status } = req.body
      if (typeof name === "string") cls.name = name
      if (typeof status === "string") cls.status = status
      cls.updated_at = new Date()
      await cls.save()
      return res.status(200).json({ id: cls._id, name: cls.name, status: cls.status })
    } catch (err) {
      return res.status(500).json({ error: "Update class failed" })
    }
  }
)

router.patch("/classes/:id/regenerate-code", async (req, res) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" })
  try {
    const cls = await Classroom.findOne({ _id: id, teacher_id: req.user.id })
    if (!cls) return res.status(404).json({ error: "Class not found" })
    let code = generateCode()
    for (let i = 0; i < 3; i++) {
      const exists = await Classroom.findOne({ join_code: code }).lean()
      if (!exists) break
      code = generateCode()
    }
    cls.join_code = code
    cls.updated_at = new Date()
    await cls.save()
    return res.status(200).json({ id: cls._id, join_code: cls.join_code })
  } catch (err) {
    return res.status(500).json({ error: "Regenerate code failed" })
  }
})

export default router