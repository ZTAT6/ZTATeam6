import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { User } from '../src/models/index.js'

dotenv.config()

async function main() {
  const [,, usernameArg, statusArg] = process.argv
  const username = usernameArg || process.env.ADMIN_USERNAME || 'admin'
  const status = statusArg || 'active'
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/'
  const dbName = process.env.MONGODB_DBNAME || 'zero_trust'
  await mongoose.connect(uri, { dbName })
  const user = await User.findOne({ username })
  if (!user) {
    console.error('User not found:', username)
    process.exit(1)
  }
  user.status = status
  await user.save()
  console.log('Updated', username, '-> status =', status)
  await mongoose.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })