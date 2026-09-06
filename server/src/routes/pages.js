import { Router } from "express";
import Page from "../models/Page.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function defaultBlocks(page) {
  const base = [
    { id: `${page.key}-hero`, type: "hero", label: "Hero", sortOrder: 0, content: { eyebrow: page.eyebrow, title: page.title, body: page.body, ctaLabel: page.ctaLabel, ctaUrl: page.ctaUrl } },
    { id: `${page.key}-about`, type: "about", label: "About", sortOrder: 1, content: { title: page.title, body: page.body } }
  ];
  if (["home", "work"].includes(page.key)) base.push({ id: `${page.key}-projects`, type: "projects", label: "Projets", sortOrder: 2, content: { title: "Selected Work", limit: 6 } });
  return base;
}

async function withBlocks(page) {
  if (!page.blocks?.length) {
    page.blocks = defaultBlocks(page);
    await page.save();
  }
  return page;
}

const siteContent = {
  home: { title: "Nour Mastouri", eyebrow: "GRAPHIC DESIGNER / ART DIRECTOR", body: "I turn sharp ideas into bold, coherent brand worlds.", ctaLabel: "VIEW / DOWNLOAD PDF", blocks: [{ id: "home-hero", type: "hero", label: "Hero", sortOrder: 0, content: { eyebrow: "GRAPHIC DESIGNER / ART DIRECTOR", title: "Nour Mastouri", body: "I turn sharp ideas into bold, coherent brand worlds.", ctaLabel: "VIEW / DOWNLOAD PDF", ctaUrl: "/assets/nour-mastouri-portfolio.pdf" } }, { id: "home-projects", type: "projects", label: "Selected Work", sortOrder: 1, content: { title: "Selected work, built to stand out and stay relevant.", limit: 18 } }] },
  about: { title: "Ideas, shaped with intent.", eyebrow: "DESIGNER / ART DIRECTOR", body: "Clear thinking.\nDistinctive design.\nNo noise.", blocks: [{ id: "about-hero", type: "hero", label: "About Hero", sortOrder: 0, content: { eyebrow: "DESIGNER / ART DIRECTOR", title: "Ideas, shaped with intent.", body: "Clear thinking.\nDistinctive design.\nNo noise." } }] },
  work: { title: "Selected work, built to stand out and stay relevant.", eyebrow: "03 / SELECTED WORK", body: "Brand identities, campaigns, packaging and digital experiences.", blocks: [{ id: "work-projects", type: "projects", label: "Selected Work", sortOrder: 0, content: { title: "Selected work, built to stand out and stay relevant.", limit: 18 } }] },
  expertise: { title: "One vision. Every touchpoint.", eyebrow: "04 / EXPERTISE", body: "Brand Identity\nArt Direction\nSocial Media\nPackaging\nPrint Design\nDigital / UI", blocks: [{ id: "expertise-text", type: "text", label: "Expertise", sortOrder: 0, content: { title: "One vision. Every touchpoint.", body: "Brand Identity\nArt Direction\nSocial Media\nPackaging\nPrint Design\nDigital / UI" } }] },
  contact: { title: "Have a vision? Let’s make it real.", eyebrow: "06 / CONTACT", body: "Available for selected projects.", ctaLabel: "START A PROJECT", ctaUrl: "mailto:hello@nourmastouri.com", blocks: [{ id: "contact-hero", type: "hero", label: "Contact", sortOrder: 0, content: { eyebrow: "06 / CONTACT", title: "Have a vision? Let’s make it real.", body: "Available for selected projects.", ctaLabel: "START A PROJECT", ctaUrl: "mailto:hello@nourmastouri.com" } }] }
};

router.post("/sync-site", requireAuth, async (_req, res) => {
  const pages = await Promise.all(Object.entries(siteContent).map(([key, content]) => Page.findOneAndUpdate({ key }, { ...content, key }, { new: true, upsert: true, runValidators: true })));
  await SiteSettings.findOneAndUpdate({ key: "main" }, { $set: { siteTitle: "Nour Mastouri", logoText: "NOUR.", menu: [{ label: "About", url: "#about", sortOrder: 0 }, { label: "Work", url: "#work", sortOrder: 1 }, { label: "Expertise", url: "#expertise", sortOrder: 2 }, { label: "Contact", url: "#contact", sortOrder: 3 }], footer: "© 2026 Nour Mastouri — Tunisia / Worldwide" } }, { upsert: true });
  res.json({ updated: pages.length });
});

router.get("/", async (_req, res) => res.json(await Promise.all((await Page.find({ deletedAt: null }).sort({ key: 1 })).map(withBlocks))));

router.get("/:key", async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(await withBlocks(page));
});

router.put("/:key", requireAuth, async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  const { _id, revisions, createdAt, updatedAt, deletedAt, ...updates } = req.body || {};
  const snapshot = page.toObject();
  delete snapshot.revisions;
  page.revisions = [...(page.revisions || []).slice(-19), { savedAt: new Date(), snapshot }];
  Object.assign(page, updates, { key: req.params.key });
  await page.save();
  res.json(page);
});

router.get("/:key/revisions", requireAuth, async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null }).select("revisions");
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(page.revisions.slice().reverse());
});

router.post("/:key/revisions/:revisionId/restore", requireAuth, async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  const revision = page.revisions.id(req.params.revisionId);
  if (!revision) return res.status(404).json({ message: "Révision introuvable" });
  const snapshot = { ...revision.snapshot };
  delete snapshot._id;
  delete snapshot.revisions;
  Object.assign(page, snapshot);
  const restoredSnapshot = page.toObject();
  delete restoredSnapshot.revisions;
  page.revisions = [...page.revisions, { savedAt: new Date(), snapshot: restoredSnapshot }].slice(-20);
  await page.save();
  res.json(page);
});

export default router;
