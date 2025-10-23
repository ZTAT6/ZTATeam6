const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/zt_learning", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: "student" },
});

const User = mongoose.model("User", userSchema);

// Activity schema
const activitySchema = new mongoose.Schema({
  userId: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
});
const Activity = mongoose.model("Activity", activitySchema);

// JWT Middleware (Zero Trust)
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "Token required" });
  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// Register route
app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, role });
  await newUser.save();
  res.json({ message: "User registered successfully" });
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ id: user._id, role: user.role }, "secretkey");
  await Activity.create({ userId: user._id, action: "User logged in" });
  res.json({ token, role: user.role });
});

// Protected route (Zero Trust)
app.get("/dashboard", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  await Activity.create({ userId: user._id, action: "Accessed dashboard" });
  res.json({
    message: `Welcome to the dashboard, ${user.username}!`,
    role: user.role,
  });
});

// Activity log view
app.get("/activity", verifyToken, async (req, res) => {
  const logs = await Activity.find({ userId: req.user.id });
  res.json(logs);
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
