import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { User, Session, FailedLogin, EmailVerification, SignupVerification, LoginChallenge } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateCode, sendVerificationEmail, sendLoginConfirmationEmail } from "../utils/verification.js";

const router = express.Router();

// Limit login and register endpoints specifically
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const registerLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.post(
  "/register",
  registerLimiter,
  [
    body("username").isString().isLength({ min: 3 }),
    body("password").isString().isLength({ min: 8 }),
    body("email").isEmail(),
    body("full_name").optional().isString(),
    body("role").optional().isIn(["admin", "teacher", "student"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Zero-trust rule: public registration only allows 'student'
      const role = "student";
      const { username, password, email, full_name } = req.body;

      // Prevent duplicates if already a verified user exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) return res.status(409).json({ error: "Username or email already exists" });

      const hashed = await hashPassword(password);

      // Create a signup verification record (user will be created after verification)
      const code = generateCode();
      await SignupVerification.create({
        email,
        username,
        password_hashed: hashed,
        full_name,
        role,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });

      await sendVerificationEmail({ to: email, code });

      return res.status(201).json({
        message: "Signup successful. Please verify your email.",
      });
    } catch (err) {
      return res.status(500).json({ error: "Registration failed" });
    }
  }
);

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

      // Policy: admin and teacher do NOT require email confirmation.
      // Students require confirmation on repeat logins.
      const isStudent = user.role === "student";
      const isRepeat = Boolean(user.last_login);

      if (!isRepeat || !isStudent) {
        // Allow immediately (first login for anyone, or any admin/teacher login)
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
      }

      // Repeat student login -> require email confirmation link
      const challengeToken = crypto.randomBytes(32).toString("hex");
      const challenge = await LoginChallenge.create({
        user_id: user._id,
        token: challengeToken,
        ip_address: ip,
        device_info: device,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      });
      await sendLoginConfirmationEmail({ to: user.email, token: challengeToken });
      return res.status(202).json({ message: "Check your email to confirm this login.", challenge_id: challenge._id.toString() });
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
      await SignupVerification.create({
        email,
        username: latest.username,
        password_hashed: latest.password_hashed,
        full_name: latest.full_name,
        role: latest.role || "student",
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });
      await sendVerificationEmail({ to: email, code });
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

export default router;