import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { Course, Classroom } from '../src/models/index.js'

dotenv.config()

async function main() {
  await connectDB()
  const resCourses = await Course.deleteMany({})
  const resClasses = await Classroom.deleteMany({})
  console.log(JSON.stringify({
    deleted: {
      courses: resCourses?.deletedCount ?? 0,
      classes: resClasses?.deletedCount ?? 0
    }
  }, null, 2))
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err?.message || String(err))
  try { await mongoose.disconnect() } catch (_) {}
  process.exit(1)
})
