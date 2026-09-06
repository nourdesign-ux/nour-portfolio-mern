import { Router } from "express";
import Widget from "../models/Widget.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => res.json(await Widget.find(req.query.trash === "1" ? { deletedAt: { $ne: null } } : { deletedAt: null }).sort({ updatedAt: -1 })));
router.post("/", async (req, res) => {
  if (!req.body?.name?.trim() || !req.body?.type) return res.status(400).json({ message: "Nom et type requis" });
  const item = await Widget.create({ name: req.body.name.trim(), type: req.body.type, content: req.body.content || {}, settings: req.body.settings || {}, style: req.body.style || {}, status: req.body.status || "draft" });
  res.status(201).json(item);
});
router.put("/:id", async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ["name", "type", "content", "settings", "style", "status"].includes(key)));
  const item = await Widget.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Widget introuvable" });
  res.json(item);
});
router.post("/:id/duplicate", async (req, res) => {
  const source = await Widget.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!source) return res.status(404).json({ message: "Widget introuvable" });
  delete source._id; delete source.createdAt; delete source.updatedAt;
  source.name = `${source.name} (copie)`; source.status = "draft";
  res.status(201).json(await Widget.create(source));
});
router.delete("/:id", async (req, res) => {
  const item = await Widget.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { deletedAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ message: "Widget introuvable" });
  res.json({ ok: true });
});
router.post("/:id/restore", async (req, res) => {
  const item = await Widget.findOneAndUpdate({ _id: req.params.id, deletedAt: { $ne: null } }, { deletedAt: null }, { new: true });
  if (!item) return res.status(404).json({ message: "Widget introuvable" });
  res.json(item);
});
router.delete("/:id/permanent", async (req, res) => {
  const item = await Widget.findOneAndDelete({ _id: req.params.id, deletedAt: { $ne: null } });
  if (!item) return res.status(404).json({ message: "Widget introuvable dans la corbeille" });
  res.json({ ok: true });
});

export default router;
