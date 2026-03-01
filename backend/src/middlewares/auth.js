import jwt from "jsonwebtoken";
import { User, Session } from "../models/index.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const session = await Session.findOne({ token }).lean();
    if (!session) return res.status(401).json({ error: "Session invalid" });

    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== "active") return res.status(401).json({ error: "User inactive" });

    req.user = { id: user._id.toString(), role: user.role, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}