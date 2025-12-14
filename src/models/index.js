import mongoose from "mongoose";

// USERS
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  full_name: String,
  role: { type: String, enum: ["admin", "teacher", "student"], required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "active" },
  last_login: Date,
  created_at: { type: Date, default: Date.now },
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// COURSES
const courseSchema = new mongoose.Schema({
  code: { type: String },
  title: String,
  description: String,
  lecturer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  status: { type: String, default: "active" },
});

courseSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: "string" } } });

// MATERIALS
const materialSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  file_url: String,
  type: String,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploaded_at: { type: Date, default: Date.now },
});

// ENROLLMENTS
const enrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolled_at: { type: Date, default: Date.now },
  status: { type: String, default: "active" },
});

// GRADES
const gradeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  score: Number,
  graded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  graded_at: { type: Date, default: Date.now },
});

// SESSIONS
const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  token: String,
  ip_address: String,
  device_info: String,
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
});

// TRUSTED DEVICES
const trustedDeviceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  device_info: String,
  ip_address: String,
  first_seen: { type: Date, default: Date.now },
  trusted_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
});

trustedDeviceSchema.index({ user_id: 1, device_info: 1 });

// ACTIVITY LOGS
const activityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  target: String,
  target_name: String,
  resource: String,
  policy: String,
  timestamp: { type: Date, default: Date.now },
  ip_address: String,
  device_info: String,
  status: String,
});

// FAILED LOGINS
const failedLoginSchema = new mongoose.Schema({
  username: String,
  ip_address: String,
  timestamp: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
export const Course = mongoose.model("Course", courseSchema);
export const Material = mongoose.model("Material", materialSchema);
export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export const Grade = mongoose.model("Grade", gradeSchema);
export const Session = mongoose.model("Session", sessionSchema);
export const TrustedDevice = mongoose.model("TrustedDevice", trustedDeviceSchema);
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export const FailedLogin = mongoose.model("FailedLogin", failedLoginSchema);

// EMAIL VERIFICATIONS
const emailVerificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  code: String,
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
  used_at: Date,
});

export const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);

// SIGNUP VERIFICATIONS (defer user creation until email is verified)
const signupVerificationSchema = new mongoose.Schema({
  email: { type: String },
  username: { type: String, required: true },
  password_hashed: { type: String, required: true },
  full_name: String,
  role: { type: String, enum: ["admin", "teacher", "student"], default: "student" },
  code: { type: String, required: true },
  phone: String,
  channel: { type: String, enum: ["email", "sms"], default: "email" },
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
  used_at: Date,
  // email delivery metadata (synced after actual send)
  delivery_message_id: String,
  delivery_sent_at: Date,
  delivery_dev: Boolean,
  delivery_error: String,
});

signupVerificationSchema.index({ email: 1, created_at: -1 });

export const SignupVerification = mongoose.model("SignupVerification", signupVerificationSchema);

// LOGIN CHALLENGES (email confirmation for repeat logins)
const loginChallengeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  token: { type: String, required: true },
  ip_address: String,
  device_info: String,
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
  approved_at: Date,
  session_token: String,
});

loginChallengeSchema.index({ token: 1 }, { unique: true });

export const LoginChallenge = mongoose.model("LoginChallenge", loginChallengeSchema);

// PASSWORD RESET via OTP
const passwordResetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  code: { type: String, required: true },
  channel: { type: String, enum: ["email", "sms"], required: true },
  target: String, // email or phone used
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
  used_at: Date,
  // delivery metadata
  delivery_message_id: String,
  delivery_sent_at: Date,
  delivery_dev: Boolean,
  delivery_error: String,
});

passwordResetSchema.index({ user_id: 1, created_at: -1 });

export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);

// CLASSES
const classroomSchema = new mongoose.Schema({
  name: String,
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  status: { type: String, default: "active" },
  join_code: { type: String, index: true },
});

export const Classroom = mongoose.model("Classroom", classroomSchema);

// CLASS MEMBERS
const classMemberSchema = new mongoose.Schema({
  classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  joined_at: { type: Date, default: Date.now },
  status: { type: String, default: "active" },
});

classMemberSchema.index({ classroom_id: 1, student_id: 1 }, { unique: true });

export const ClassMember = mongoose.model("ClassMember", classMemberSchema);