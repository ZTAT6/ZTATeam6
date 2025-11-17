import express from "express"
import { body, validationResult } from "express-validator"
import mongoose from "mongoose"
import { requireRole } from "../middlewares/auth.js"
import { Classroom, ClassMember, Enrollment } from "../models/index.js"

const router = express.Router()

router.use(requireRole("student"))

router.post(
  "/join",
  [body("code").isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
      const code = (req.body.code || "").trim()
      const cls = await Classroom.findOne({ join_code: code })
      if (!cls) return res.status(404).json({ error: "Class not found" })

      const exists = await ClassMember.findOne({ classroom_id: cls._id, student_id: req.user.id })
      if (!exists) {
        await ClassMember.create({ classroom_id: cls._id, student_id: req.user.id })
      }

      const enrolled = await Enrollment.findOne({ student_id: req.user.id, course_id: cls.course_id })
      if (!enrolled) {
        await Enrollment.create({ student_id: req.user.id, course_id: cls.course_id })
      }

      return res.status(200).json({ ok: true, classroom_id: cls._id })
    } catch (err) {
      return res.status(500).json({ error: "Join class failed" })
    }
  }
)

export default router