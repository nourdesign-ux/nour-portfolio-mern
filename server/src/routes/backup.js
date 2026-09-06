import { Router } from "express";
import Project from "../models/Project.js";
import Page from "../models/Page.js";
import Media from "../models/Media.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/export", requireAuth, async (_req, res) => {
  const [projects, pages, media, settings] = await Promise.all([
    Project.find().lean(),
    Page.find().lean(),
    Media.find().lean(),
    SiteSettings.findOne({ key: "main" }).lean()
  ]);
  const backup = { version: 1, createdAt: new Date().toISOString(), projects, pages, media, settings };
  res.setHeader("Content-Disposition", `attachment; filename=nour-cms-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.json(backup);
});

export default router;