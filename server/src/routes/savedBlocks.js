import { Router } from "express";
import SavedBlock from "../models/SavedBlock.js";
import Page from "../models/Page.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => res.json(await SavedBlock.find().sort({ updatedAt: -1 })));

router.post("/", async (req, res) => {
  const { name, scope = "saved", block } = req.body || {};
  if (!name?.trim() || !block?.type) return res.status(400).json({ message: "Nom et bloc requis" });
  const item = await SavedBlock.create({ name: name.trim(), scope, block });
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ["name", "scope", "block"].includes(key)));
  const item = await SavedBlock.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Bloc enregistré introuvable" });
  if (item.scope === "global" && update.block) {
    const pages = await Page.find({ "blocks.globalId": String(item._id) });
    await Promise.all(pages.map(page => {
      page.blocks = page.blocks.map(block => block.globalId === String(item._id) ? { ...update.block, id: block.id, globalId: String(item._id), sortOrder: block.sortOrder } : block);
      return page.save();
    }));
  }
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  const inUse = await Page.countDocuments({ "blocks.globalId": req.params.id });
  if (inUse) return res.status(409).json({ message: `Ce bloc global est utilisé sur ${inUse} page(s). Dissociez-le avant suppression.` });
  const item = await SavedBlock.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Bloc enregistré introuvable" });
  res.json({ ok: true });
});

export default router;
