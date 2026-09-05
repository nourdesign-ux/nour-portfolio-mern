import { Router } from "express";
import Page from "../models/Page.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req, res) => res.json(await Page.find().sort({ key: 1 })));

router.get("/:key", async (req, res) => {
  const page = await Page.findOne({ key: req.params.key });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(page);
});

router.put("/:key", requireAuth, async (req, res) => {
  const page = await Page.findOneAndUpdate(
    { key: req.params.key },
    { ...req.body, key: req.params.key },
    { new: true, runValidators: true }
  );
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(page);
});

export default router;
