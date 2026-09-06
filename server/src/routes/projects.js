import { Router } from "express";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const allowedFields = ["title", "slug", "category", "year", "description", "conceptTitle", "concept", "role", "behanceUrl", "services", "cover", "images", "status", "featured", "sortOrder", "seoTitle", "seoDescription"];
const projectInput = body => Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowedFields.includes(key)));
const legacyProjects = [
  { title:"LEADERS DIGITAL",slug:"leaders-digital",category:"BRAND IDENTITY · DIGITAL AGENCY",year:2025,description:"A complete rebrand for a digital agency ready to move forward. The new identity replaces an outdated image with a bold, flexible system shaped around creativity, communication and digital progress.",conceptTitle:"Built to lead. Designed to connect.",concept:"The symbol brings together an L for Leaders, a D for Digital and a speech bubble for communication. Violet anchors the master brand, while blue, green and lime create a flexible colour code for its specialist teams.",services:["Brand Strategy","Logo Design","Visual Identity","Art Direction"],cover:"/assets/projects/digital-agency/01.jpg",images:["02","03","04","05","06","07","08","09","10","11"].map(name=>`/assets/projects/digital-agency/${name}.jpg`),behanceUrl:"https://www.behance.net/gallery/235491963/Brand-Identity-Digital-Agency" },
  { title:"KURUBIS WINE",slug:"wine-social-media",category:"SOCIAL MEDIA · ART DIRECTION",year:2024,description:"A vibrant social media campaign for Kurubis wine, designed to turn each bottle into an expressive lifestyle moment. The system connects product storytelling, vineyard imagery and editorial typography across red and white wine collections.",conceptTitle:"A richer taste, made visual.",concept:"Deep burgundy, vineyard green and warm cream build a sensorial palette inspired by grapes and terroir. Large serif typography, layered compositions and product-led imagery give every post its own character while keeping the campaign unmistakably Kurubis.",services:["Art Direction","Social Media Design","Advertising","Photo Compositing"],cover:"/assets/projects/wine-social/01.jpg",images:["02","03","04","05"].map(name=>`/assets/projects/wine-social/${name}.jpg`),behanceUrl:"https://www.behance.net/gallery/205558191/Wine-Social-Media" },
  { title:"UNITED ACADEMY",slug:"sports-academy-social-media",category:"SPORTS DESIGN · SOCIAL MEDIA",year:2024,description:"A high-energy communication system for United Academy, connecting football and padel programmes through a consistent social media language. The campaign covers registrations, private lessons, events and brand moments across digital and outdoor formats.",conceptTitle:"One team. One visual rhythm.",concept:"Electric blue creates an immersive stadium atmosphere while lime accents drive attention toward key messages and calls to action. Bold condensed typography, dynamic athlete imagery and layered light effects give the academy a confident, competitive and youth-focused presence.",services:["Art Direction","Sports Design","Social Media","Advertising"],cover:"/assets/projects/sports-academy/01.jpg",images:["02","03","04","05"].map(name=>`/assets/projects/sports-academy/${name}.jpg`),behanceUrl:"https://www.behance.net/gallery/205011451/Sports-Academy-Social-Media-Design" },
  ...[["ESPIM","espim","ART DIRECTION · CAMPAIGN",2026],["FREMIGEL","fremigel","PACKAGING SYSTEM",2026],["LEADERS TV","leaders-tv","BRAND IDENTITY · MOTION",2025],["HEISENBERG","heisenberg","BRAND CAMPAIGN · PRINT",2026],["NOLYSS ENERGIE","nolyss-energie","BRAND IDENTITY",2025],["AZALEA FOUNDATION","azalea-foundation","BRAND · DIGITAL",2025],["EVENTCELLO","eventcello","DIGITAL EXPERIENCE",2025],["CLARENIA","clarenia","PACKAGING · SOCIAL",2026],["ATELIER N","atelier-n","BRAND IDENTITY",2025],["KIF","kif","CAMPAIGN · SOCIAL",2025],["NOVA","nova","DIGITAL · UI",2025],["MIRA","mira","PACKAGING SYSTEM",2024],["ORBIT","orbit","ART DIRECTION",2024],["SORA","sora","EDITORIAL DESIGN",2024],["VERTEX","vertex","BRAND STRATEGY",2024]].map(([title,slug,category,year])=>({title,slug,category,year}))
].map((project,index)=>({ status:"published",featured:index<3,sortOrder:index,...project }));

async function ensureLegacyProjects() {
  const existing = await Project.find({}).select("slug title").lean(); const slugs = new Set(existing.map(item=>item.slug)); const titles = new Set(existing.map(item=>item.title));
  const missing = legacyProjects.filter(item=>!slugs.has(item.slug)&&!titles.has(item.title));
  if (missing.length) await Project.insertMany(missing, { ordered:false });
}

router.get("/", (req, res, next) => {
  if (req.query.all === "1" || req.query.trash === "1") return requireAuth(req, res, next);
  next();
}, async (req, res) => {
  await ensureLegacyProjects();
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
    const item = await Project.create({ ...projectInput(req.body), deletedAt: null });
    res.status(201).json(item);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Ce slug existe déjà" });
    throw error;
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const updates = projectInput(req.body);
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

router.post("/:id/duplicate", requireAuth, async (req, res) => {
  const source = await Project.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!source) return res.status(404).json({ message: "Projet introuvable" });
  delete source._id; delete source.createdAt; delete source.updatedAt;
  source.title = `${source.title} (copie)`;
  source.slug = `${source.slug}-copy-${Date.now()}`;
  source.status = "draft";
  source.featured = false;
  res.status(201).json(await Project.create(source));
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

router.delete("/:id/permanent", requireAuth, async (req, res) => {
  const item = await Project.findOneAndDelete({ _id: req.params.id, deletedAt: { $ne: null } });
  if (!item) return res.status(404).json({ message: "Projet introuvable dans la corbeille" });
  res.json({ ok: true });
});

export default router;
