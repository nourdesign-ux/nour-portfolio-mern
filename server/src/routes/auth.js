import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: { email, role: "admin" } });
});

export default router;
