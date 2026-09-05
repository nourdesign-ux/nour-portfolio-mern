import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Media from "../models/Media.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(currentDir, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"].includes(file.mimetype);
    cb(ok ? null : new Error("Type de fichier non supporté"), ok);
  }
});

router.get("/", requireAuth, async (_req, res) => res.json(await Media.find().sort({ createdAt: -1 })));

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fichier requis" });
  const item = await Media.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    alt: req.body.alt || "",
    mimeType: req.file.mimetype,
    size: req.file.size
  });
  res.status(201).json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await Media.findByIdAndUpdate(req.params.id, { alt: req.body.alt || "" }, { new: true });
  if (!item) return res.status(404).json({ message: "Media introuvable" });
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Media.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Media introuvable" });
  try { fs.unlinkSync(path.join(uploadDir, item.filename)); } catch {}
  res.json({ ok: true });
});

export default router;
