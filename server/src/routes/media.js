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

function publicImages(directory, root = directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return publicImages(fullPath, root);
    return /\.(jpe?g|png|webp|gif|svg)$/i.test(entry.name) ? [fullPath] : [];
  });
}

router.get("/", requireAuth, async (_req, res) => res.json(await Media.find().sort({ createdAt: -1 })));

router.post("/sync-public", requireAuth, async (_req, res) => {
  const publicDir = path.resolve(currentDir, "../../../client/public");
  const files = publicImages(publicDir);
  let imported = 0;
  for (const filePath of files) {
    const relative = path.relative(publicDir, filePath).split(path.sep).join("/");
    const url = `/${relative}`;
    const exists = await Media.exists({ url });
    if (!exists) {
      await Media.create({ filename: relative, originalName: path.basename(filePath), url, mimeType: "image/*", size: fs.statSync(filePath).size });
      imported += 1;
    }
  }
  res.json({ imported, total: files.length });
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fichier requis" });
  const item = await Media.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    title: req.body.title || req.file.originalname,
    alt: req.body.alt || "",
    caption: req.body.caption || "",
    mimeType: req.file.mimetype,
    size: req.file.size
  });
  res.status(201).json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await Media.findByIdAndUpdate(req.params.id, { title: req.body.title || "", alt: req.body.alt || "", caption: req.body.caption || "" }, { new: true });
  if (!item) return res.status(404).json({ message: "Media introuvable" });
  res.json(item);
});

router.post("/:id/replace", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fichier requis" });
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Media introuvable" });
  if (item.url.startsWith("/uploads/")) {
    try { fs.unlinkSync(path.join(uploadDir, item.filename)); } catch {}
  }
  item.filename = req.file.filename;
  item.originalName = req.file.originalname;
  item.url = `/uploads/${req.file.filename}`;
  item.mimeType = req.file.mimetype;
  item.size = req.file.size;
  await item.save();
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Media.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Media introuvable" });
  try { fs.unlinkSync(path.join(uploadDir, item.filename)); } catch {}
  res.json({ ok: true });
});

export default router;
