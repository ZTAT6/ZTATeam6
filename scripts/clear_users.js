import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import {
  User,
  Session,
  TrustedDevice,
  ActivityLog,
  Enrollment,
  Grade,
  LoginChallenge,
  PasswordReset,
  ClassMember,
} from '../src/models/index.js'

dotenv.config()

async function main() {
  const includeAdmin = process.argv.includes('--include-admin')
  const roleArg = (process.argv.find(a => a.startsWith('--role=')) || '').split('=')[1]
  const onlyTeacher = process.argv.includes('--only-teacher')

  await connectDB()

  let userFilter
  if (roleArg) {
    userFilter = { role: roleArg }
  } else if (onlyTeacher) {
    userFilter = { role: 'teacher' }
  } else {
    userFilter = includeAdmin ? {} : { role: { $ne: 'admin' } }
  }
  const users = await User.find(userFilter).select('_id username role')
  const ids = users.map(u => u._id)

  if (ids.length === 0) {
    console.log('No users matched filter. Nothing to delete.')
    await mongoose.disconnect()
    return
  }

  const usernames = users.map(u => `${u.username}(${u.role})`)
  console.log('Deleting users:', usernames)

  const results = {}

  results.users = await User.deleteMany({ _id: { $in: ids } })
  results.sessions = await Session.deleteMany({ user_id: { $in: ids } })
  results.trustedDevices = await TrustedDevice.deleteMany({ user_id: { $in: ids } })
  results.activityLogs = await ActivityLog.deleteMany({ user_id: { $in: ids } })
  results.enrollments = await Enrollment.deleteMany({ student_id: { $in: ids } })
  results.grades = await Grade.deleteMany({ student_id: { $in: ids } })
  results.loginChallenges = await LoginChallenge.deleteMany({ user_id: { $in: ids } })
  results.passwordResets = await PasswordReset.deleteMany({ user_id: { $in: ids } })
  results.classMembers = await ClassMember.deleteMany({ student_id: { $in: ids } })

  console.log('Deletion summary:', JSON.stringify({
    matchedUsers: users.length,
    deleted: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v?.deletedCount ?? 0])),
  }, null, 2))

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Error during clear_users:', err?.message || String(err))
  try { await mongoose.disconnect() } catch (_) {}
  process.exit(1)
})

