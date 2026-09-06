import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function sameSecret(value = "", expected = "") {
  const left = Buffer.from(String(value));
  const right = Buffer.from(String(expected));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

router.post("/login", async (req, res) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Trop de tentatives. Réessayez plus tard." });
  }
  const { email, password } = req.body || {};
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: "Authentification non configurée" });
  }
  if (!sameSecret(email, process.env.ADMIN_EMAIL) || !sameSecret(password, process.env.ADMIN_PASSWORD)) {
    attempts.set(key, { count: entry?.resetAt > now ? entry.count + 1 : 1, resetAt: entry?.resetAt > now ? entry.resetAt : now + WINDOW_MS });
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }
  attempts.delete(key);
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: { email, role: "admin" } });
});

export default router;
