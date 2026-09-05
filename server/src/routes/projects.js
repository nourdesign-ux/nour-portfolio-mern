import { Router } from "express";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const query = req.query.all === "1" ? {} : { status: "published" };
  const items = await Project.find(query).sort({ sortOrder: 1, createdAt: -1 });
  res.json(items);
});

router.get("/:slug", async (req, res) => {
  const item = await Project.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json(item);
});

router.post("/", requireAuth, async (req, res) => {
  const item = await Project.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Project.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Projet introuvable" });
  res.json({ ok: true });
});

export default router;
