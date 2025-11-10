import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { User, Session, FailedLogin, EmailVerification, SignupVerification, LoginChallenge, PasswordReset } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateCode, sendVerificationEmail, sendLoginConfirmationEmail, sendVerificationSMS } from "../utils/verification.js";

const router = express.Router();

// Limit login and register endpoints specifically
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const registerLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
const forgotLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.post(
  "/register",
  registerLimiter,
  [
    body("username").optional().isString().isLength({ min: 3 }),
    body("password").isString().isLength({ min: 8 }),
    body("email").optional().isEmail(),
    body("phone").optional().isString(),
    body("channel").optional().isIn(["email", "sms"]),
    body("full_name").optional().isString(),
    body("role").optional().isIn(["admin", "teacher", "student"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Zero-trust rule: public registration only allows 'student'
      const role = "student";
      let { username, password, email, full_name, phone } = req.body;
      let channel = req.body.channel || (email ? "email" : "sms");
      // Enforce email-only sending if no SMS provider is desired
      if (channel === "sms") {
        return res.status(400).json({ error: "SMS channel disabled. Use email." });
      }
      channel = "email";

      // Require identifier based on channel
      if (channel === "sms" && !phone) return res.status(400).json({ error: "Missing phone for SMS" });
      if (channel === "email" && !email) return res.status(400).json({ error: "Missing email for Email channel" });

      // Default username if omitted
      if (!username || !username.trim()) {
        username = email || phone;
      }

      // Prevent duplicates if already a verified user exists
      const uniqOr = [];
      if (username) uniqOr.push({ username });
      if (email) uniqOr.push({ email });
      if (phone) uniqOr.push({ phone });
      const existingUser = uniqOr.length ? await User.findOne({ $or: uniqOr }) : null;
      if (existingUser) return res.status(409).json({ error: "Username or email already exists" });

      const hashed = await hashPassword(password);

      // Create a signup verification record (user will be created after verification)
      const code = generateCode();
      const rec = await SignupVerification.create({
        email,
        username,
        password_hashed: hashed,
        full_name,
        role,
        code,
        phone,
        channel,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });

      try {
        const sendRes = await sendVerificationEmail({ to: email, code });
        if (sendRes?.dev) {
          rec.delivery_dev = true;
        } else if (sendRes?.messageId) {
          rec.delivery_message_id = sendRes.messageId;
          rec.delivery_sent_at = new Date();
          rec.delivery_dev = false;
        }
        await rec.save();
      } catch (e) {
        rec.delivery_error = String(e?.message || e);
        await rec.save();
        throw e;
      }

      return res.status(201).json({
        message: "Signup successful. Please verify your email.",
      });
    } catch (err) {
      return res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Dev helper: fetch latest signup verification code from MongoDB
// Only enabled when not in production; useful when SMTP/SMS is not configured
router.get("/dev/latest-code", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }
    const identifier = (req.query.identifier || "").trim();
    if (!identifier) return res.status(400).json({ error: "Missing identifier" });
    const channel = identifier.includes("@") ? "email" : "sms";
    const filter = channel === "email" ? { email: identifier } : { phone: identifier };
    const rec = await SignupVerification.findOne({ ...filter })
      .sort({ created_at: -1 })
      .lean();
    if (!rec) return res.status(404).json({ error: "No code found" });
    return res.status(200).json({
      code: rec.code,
      channel,
      created_at: rec.created_at,
      delivery_message_id: rec.delivery_message_id,
      delivery_sent_at: rec.delivery_sent_at,
      delivery_dev: rec.delivery_dev,
      delivery_error: rec.delivery_error,
    });
  } catch (err) {
    return res.status(500).json({ error: "Fetch code failed" });
  }
});

// Dev helper: fetch latest password reset metadata
router.get("/dev/latest-reset", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }
    const identifier = (req.query.identifier || "").trim();
    if (!identifier) return res.status(400).json({ error: "Missing identifier" });
    const user = await User.findOne({ email: identifier }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const rec = await PasswordReset.findOne({ user_id: user._id, target: identifier })
      .sort({ created_at: -1 })
      .lean();
    if (!rec) return res.status(404).json({ error: "No reset record found" });
    return res.status(200).json({
      code: rec.code,
      channel: rec.channel,
      created_at: rec.created_at,
      delivery_message_id: rec.delivery_message_id,
      delivery_sent_at: rec.delivery_sent_at,
      delivery_dev: rec.delivery_dev,
      delivery_error: rec.delivery_error,
    });
  } catch (err) {
    return res.status(500).json({ error: "Fetch reset failed" });
  }
});

router.post(
  "/login",
  loginLimiter,
  [body("username").isString(), body("password").isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const device = req.headers["user-agent"] || "unknown";

    try {
      // allow login using username or email
      const user = await User.findOne({ $or: [{ username }, { email: username }] });
      if (!user) {
        await FailedLogin.create({ username, ip_address: ip });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const ok = await comparePassword(password, user.password);
      if (!ok) {
        await FailedLogin.create({ username, ip_address: ip });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ error: "Email not verified" });
      }

      // Always allow immediate login (disable email confirmation)
      user.last_login = new Date();
      await user.save();

      const payload = { sub: user._id.toString(), role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });

      await Session.create({
        user_id: user._id,
        token,
        ip_address: ip,
        device_info: device,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return res.status(200).json({ token, role: user.role });
    } catch (err) {
      return res.status(500).json({ error: "Login failed" });
    }
  }
);

// Confirm login via email link
router.get("/confirm-login", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");
  try {
    const challenge = await LoginChallenge.findOne({ token });
    if (!challenge) return res.status(404).send("Invalid token");
    if (challenge.approved_at) return res.status(200).send("Already confirmed");
    if (challenge.expires_at && challenge.expires_at < new Date()) return res.status(400).send("Token expired");

    const user = await User.findById(challenge.user_id);
    if (!user) return res.status(404).send("User not found");

    const payload = { sub: user._id.toString(), role: user.role };
    const tokenJwt = jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });

    await Session.create({
      user_id: user._id,
      token: tokenJwt,
      ip_address: challenge.ip_address,
      device_info: challenge.device_info,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    challenge.approved_at = new Date();
    challenge.session_token = tokenJwt;
    await challenge.save();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send("<html><body style='font-family:system-ui'><h2>Login confirmed</h2><p>You can return to the app.</p></body></html>");
  } catch (err) {
    return res.status(500).send("Confirmation failed");
  }
});

// Poll challenge status
router.get("/challenge-status", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    const challenge = await LoginChallenge.findById(id);
    if (!challenge) return res.status(404).json({ error: "Not found" });
    const approved = Boolean(challenge.approved_at);
    return res.status(200).json({ approved, token: approved ? challenge.session_token : undefined });
  } catch (err) {
    return res.status(500).json({ error: "Status check failed" });
  }
});

// Verify email code
router.post(
  "/verify-email",
  [body("email").isEmail(), body("code").isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, code } = req.body;

    try {
      // If user already exists and is active, do not verify again
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.status === "active") {
        return res.status(400).json({ error: "Already verified" });
      }

      // Find latest un-used signup verification record matching email and code
      let record = await SignupVerification.findOne({ email, code, used_at: { $exists: false } })
        .sort({ created_at: -1 });

      if (record) {
        if (record.expires_at && record.expires_at < new Date()) return res.status(400).json({ error: "Code expired" });
        // Create the actual user and mark verified
        await User.create({
          username: record.username,
          password: record.password_hashed,
          email: record.email,
          full_name: record.full_name,
          role: record.role || "student",
          status: "active",
        });
        record.used_at = new Date();
        await record.save();
        return res.status(200).json({ ok: true });
      }

      // Fallback: support legacy pending users with EmailVerification records
      const legacyUser = await User.findOne({ email, status: { $ne: "active" } });
      if (!legacyUser) return res.status(400).json({ error: "Invalid or used code" });
      const legacyRec = await EmailVerification.findOne({ user_id: legacyUser._id, code, used_at: { $exists: false } })
        .sort({ created_at: -1 });
      if (!legacyRec) return res.status(400).json({ error: "Invalid or used code" });
      if (legacyRec.expires_at && legacyRec.expires_at < new Date()) return res.status(400).json({ error: "Code expired" });
      legacyRec.used_at = new Date();
      await legacyRec.save();
      legacyUser.status = "active";
      await legacyUser.save();
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Verification failed" });
    }
  }
);

// Verify signup via email or SMS (generic)
router.post(
  "/verify-signup",
  [
    body("identifier").isString(), // email or phone
    body("code").isString().isLength({ min: 6, max: 6 }),
    body("channel").optional().isIn(["email", "sms"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { identifier } = req.body;
    const code = req.body.code;
    const channel = req.body.channel || (identifier.includes("@") ? "email" : "sms");

    try {
      // If user already exists and is active, do not verify again
      const existingUser = await User.findOne(channel === "email" ? { email: identifier } : { phone: identifier });
      if (existingUser && existingUser.status === "active") {
        return res.status(400).json({ error: "Already verified" });
      }

      // Find latest un-used signup verification record matching identifier and code
      const filter = channel === "email" ? { email: identifier } : { phone: identifier };
      let record = await SignupVerification.findOne({ ...filter, code, used_at: { $exists: false } })
        .sort({ created_at: -1 });

      if (!record) return res.status(400).json({ error: "Invalid or used code" });
      if (record.expires_at && record.expires_at < new Date()) return res.status(400).json({ error: "Code expired" });

      // Create the actual user and mark verified
      await User.create({
        username: record.username,
        password: record.password_hashed,
        email: record.email,
        phone: record.phone,
        full_name: record.full_name,
        role: record.role || "student",
        status: "active",
      });
      record.used_at = new Date();
      await record.save();
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Verification failed" });
    }
  }
);

// Resend code
router.post(
  "/resend-code",
  [body("email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;
    try {
      // If already verified user exists, no need to resend
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.status === "active") return res.status(400).json({ error: "Already verified" });

      // Find the latest signup verification with payload for this email
      const latest = await SignupVerification.findOne({ email }).sort({ created_at: -1 });
      if (!latest || !latest.password_hashed) return res.status(404).json({ error: "Signup not found" });
      const code = generateCode();
      const rec = await SignupVerification.create({
        email,
        username: latest.username,
        password_hashed: latest.password_hashed,
        full_name: latest.full_name,
        role: latest.role || "student",
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });
      try {
        const sendRes = await sendVerificationEmail({ to: email, code });
        if (sendRes?.dev) {
          rec.delivery_dev = true;
        } else if (sendRes?.messageId) {
          rec.delivery_message_id = sendRes.messageId;
          rec.delivery_sent_at = new Date();
          rec.delivery_dev = false;
        }
        await rec.save();
      } catch (e) {
        rec.delivery_error = String(e?.message || e);
        await rec.save();
        throw e;
      }
      return res.status(200).json({ message: "Verification code sent" });
    } catch (err) {
      return res.status(500).json({ error: "Resend failed" });
    }
  }
);

router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(200).json({ ok: true });
  try {
    await Session.deleteOne({ token });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Logout failed" });
  }
});

// Forgot password: request OTP via email or SMS
router.post(
  "/forgot-password/request",
  forgotLimiter,
  [
    body("identifier").isString(),
    body("channel").optional().isIn(["email", "sms"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { identifier } = req.body;
    // Force email-only channel for password reset requests
    const channel = "email";

    try {
      const user = await User.findOne({ email: identifier });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.status !== "active") return res.status(403).json({ error: "User not active" });

      const code = generateCode();
      const rec = await PasswordReset.create({
        user_id: user._id,
        code,
        channel,
        target: identifier,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      });
      try {
        const sendRes = await sendVerificationEmail({ to: user.email, code });
        if (sendRes?.dev) {
          rec.delivery_dev = true;
        } else if (sendRes?.messageId) {
          rec.delivery_message_id = sendRes.messageId;
          rec.delivery_sent_at = new Date();
          rec.delivery_dev = false;
        }
        await rec.save();
      } catch (e) {
        rec.delivery_error = String(e?.message || e);
        await rec.save();
        throw e;
      }
      return res.status(200).json({ message: "Reset code sent" });
    } catch (err) {
      return res.status(500).json({ error: "Request failed" });
    }
  }
);

// Forgot password: verify code and reset
router.post(
  "/forgot-password/reset",
  forgotLimiter,
  [
    body("identifier").isString(),
    body("code").isString().isLength({ min: 6, max: 6 }),
    body("new_password").isString().isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { identifier, code, new_password } = req.body;
    const channel = identifier.includes("@") ? "email" : "sms";

    try {
      const user = await User.findOne(channel === "email" ? { email: identifier } : { phone: identifier });
      if (!user) return res.status(404).json({ error: "User not found" });

      const record = await PasswordReset.findOne({ user_id: user._id, target: identifier, code, used_at: { $exists: false } })
        .sort({ created_at: -1 });
      if (!record) return res.status(400).json({ error: "Invalid or used code" });
      if (record.expires_at && record.expires_at < new Date()) return res.status(400).json({ error: "Code expired" });

      const hashed = await hashPassword(new_password);
      user.password = hashed;
      await user.save();
      record.used_at = new Date();
      await record.save();
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Reset failed" });
    }
  }
);

export default router;