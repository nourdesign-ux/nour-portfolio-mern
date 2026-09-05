import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import pageRoutes from "./routes/pages.js";
import mediaRoutes from "./routes/media.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true, stack: "MERN" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/media", mediaRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
