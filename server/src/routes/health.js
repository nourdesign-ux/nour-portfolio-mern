import { Router } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Project from "../models/Project.js";
import Page from "../models/Page.js";
import Media from "../models/Media.js";
import Form from "../models/Form.js";
import Widget from "../models/Widget.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const startedAt = Date.now();
const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
router.get("/", requireAuth, async (_req, res) => {
  const checkedAt = new Date();
  const dbStart = performance.now();
  const connected = mongoose.connection.readyState === 1;
  let counts = null; let databaseLatency = null;
  if (connected) {
    const [pages, projects, media, forms, widgets, drafts, published] = await Promise.all([
      Page.countDocuments({ deletedAt: null }), Project.countDocuments({ deletedAt: null }), Media.countDocuments(),
      Form.countDocuments({ deletedAt: null }), Widget.countDocuments({ deletedAt: null }),
      Project.countDocuments({ deletedAt: null, status: "draft" }), Project.countDocuments({ deletedAt: null, status: "published" })
    ]);
    databaseLatency = Math.round(performance.now() - dbStart);
    const sectionResult = await Page.aggregate([{ $match: { deletedAt: null } }, { $project: { count: { $size: { $ifNull: ["$blocks", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }]);
    counts = { pages, sections: sectionResult[0]?.total || 0, projects, media, forms, widgets, drafts, published };
  }
  const memory = process.memoryUsage();
  let frontend = "unavailable"; let frontendLatency = null;
  try {
    const started = performance.now();
    const response = await fetch(process.env.CLIENT_URL || "http://localhost:5173", { signal: AbortSignal.timeout(1500) });
    frontendLatency = Math.round(performance.now() - started);
    frontend = response.ok ? "healthy" : "error";
  } catch {}
  let storage = "unavailable";
  try { fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK); storage = "healthy"; } catch {}
  const siteSettings = connected ? await SiteSettings.findOne({ key: "main" }).select("siteStatus").lean() : null;
  res.json({
    checkedAt, website: { status: frontend === "healthy" && connected ? "healthy" : "warning", frontend, frontendLatencyMs: frontendLatency, admin: frontend, api: "healthy" },
    server: { status: "healthy", uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000), node: process.version, environment: process.env.NODE_ENV || "development", memoryMb: Math.round(memory.rss / 1024 / 1024) },
    database: { status: connected ? "healthy" : "unavailable", latencyMs: databaseLatency },
    storage: { status: storage, driver: "local uploads" }, counts, publicMode: siteSettings?.siteStatus || "online",
    apis: { cms: "healthy", media: "healthy", forms: "healthy", maps: process.env.MAPS_API_KEY ? "configured" : "unavailable" }
  });
});

export default router;
