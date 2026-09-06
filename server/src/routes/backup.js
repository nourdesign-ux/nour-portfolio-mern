import { Router } from "express";
import Project from "../models/Project.js";
import Page from "../models/Page.js";
import Media from "../models/Media.js";
import SiteSettings from "../models/SiteSettings.js";
import SavedBlock from "../models/SavedBlock.js";
import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import Widget from "../models/Widget.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/status", requireAuth, async (_req, res) => {
  const [projects, pages, media, savedBlocks, forms, widgets, submissions] = await Promise.all([Project.countDocuments(), Page.countDocuments(), Media.countDocuments(), SavedBlock.countDocuments(), Form.countDocuments(), Widget.countDocuments(), FormSubmission.countDocuments()]);
  const mediaStats = await Media.aggregate([{ $group: { _id: null, bytes: { $sum: "$size" } } }]);
  res.json({ ok: true, database: "connected", counts: { projects, pages, media, savedBlocks, forms, widgets, submissions }, mediaBytes: mediaStats[0]?.bytes || 0, checkedAt: new Date().toISOString() });
});

router.post("/validate", requireAuth, async (req, res) => {
  const backup = req.body || {};
  const errors = [];
  if (![1, 2].includes(backup.version)) errors.push("Version de backup non reconnue");
  for (const key of ["projects", "pages", "media"]) if (!Array.isArray(backup[key])) errors.push(`${key} doit être une liste`);
  res.status(errors.length ? 400 : 200).json({ valid: !errors.length, errors, summary: { projects: backup.projects?.length || 0, pages: backup.pages?.length || 0, media: backup.media?.length || 0, savedBlocks: backup.savedBlocks?.length || 0 } });
});

router.get("/export", requireAuth, async (_req, res) => {
  const [projects, pages, media, settings, savedBlocks, forms, submissions, widgets] = await Promise.all([
    Project.find().lean(),
    Page.find().lean(),
    Media.find().lean(),
    SiteSettings.findOne({ key: "main" }).lean(),
    SavedBlock.find().lean(),
    Form.find().lean(),
    FormSubmission.find().lean(),
    Widget.find().lean()
  ]);
  const backup = { version: 2, createdAt: new Date().toISOString(), projects, pages, media, settings, savedBlocks, forms, submissions, widgets };
  res.setHeader("Content-Disposition", `attachment; filename=nour-cms-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.json(backup);
});

export default router;
