import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: "Authentification non configurée" });
    }
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
