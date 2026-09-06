import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import pageRoutes from "./routes/pages.js";
import mediaRoutes from "./routes/media.js";
import settingsRoutes from "./routes/settings.js";
import backupRoutes from "./routes/backup.js";
import savedBlockRoutes from "./routes/savedBlocks.js";
import formRoutes from "./routes/forms.js";
import widgetRoutes from "./routes/widgets.js";
import healthRoutes from "./routes/health.js";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 5000;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(currentDir, "../uploads");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (_req, res) => res.json({ ok: true, stack: "MERN", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/saved-blocks", savedBlockRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/api/site-health", healthRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route introuvable" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.name === "ValidationError" || err?.name === "CastError" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (10 Mo maximum)" : "Données invalides" });
  }
  if (err?.name === "MongooseError" || err?.name === "MongoServerSelectionError") {
    return res.status(503).json({ message: "Base de données temporairement indisponible" });
  }
  if (err?.message?.startsWith("Type de fichier")) return res.status(415).json({ message: err.message });
  res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Erreur serveur" : (err.message || "Erreur serveur") });
});

let reconnectTimer;
async function connectWithRetry() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    reconnectTimer = setTimeout(connectWithRetry, 30000);
    reconnectTimer.unref();
  }
}

async function start() {
  // Finish the first database attempt before accepting CMS requests. This
  // removes the short startup window where valid dashboard calls returned 503.
  await connectWithRetry();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

void start();
