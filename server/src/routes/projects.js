import { Router } from "express";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res, next) => {
  if (req.query.all === "1" || req.query.trash === "1") return requireAuth(req, res, next);
  next();
}, async (req, res) => {
  const query = req.query.trash === "1"
    ? { deletedAt: { $ne: null } }
    : req.query.all === "1"
      ? { deletedAt: null }
      : { status: "published", deletedAt: null };
  const items = await Project.find(query).sort({ sortOrder: 1, createdAt: -1 });
  res.json(items);
});

router.get("/:slug", async (req, res) => {
  const item = await Project.findOne({ slug: req.params.slug, status: "published", deletedAt: null });
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json(item);
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const item = await Project.create({ ...req.body, deletedAt: null });
    res.status(201).json(item);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Ce slug existe déjà" });
    throw error;
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { deletedAt: _deletedAt, ...updates } = req.body || {};
    const item = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Projet introuvable" });
    res.json(item);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Ce slug existe déjà" });
    throw error;
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Project.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json({ ok: true, item });
});

router.post("/:id/restore", requireAuth, async (req, res) => {
  const item = await Project.findOneAndUpdate(
    { _id: req.params.id, deletedAt: { $ne: null } },
    { deletedAt: null },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json(item);
});

export default router;
