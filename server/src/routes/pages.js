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

router.get("/", requireAuth, async (req, res) => res.json(await Promise.all((await Page.find(req.query.trash === "1" ? { deletedAt: { $ne: null } } : { deletedAt: null }).sort({ key: 1 })).map(withBlocks))));

router.post("/", requireAuth, async (req, res) => {
  try {
    const key = String(req.body?.key || req.body?.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!key || !req.body?.title?.trim()) return res.status(400).json({ message: "Titre et slug requis" });
    const blocks = Array.isArray(req.body.blocks) ? req.body.blocks.map((block, index) => ({ ...block, id: block.id || `${key}-${block.type}-${Date.now()}-${index}`, sourcePageKey: key, sortOrder: index })) : [];
    const page = await Page.create({ key, title: req.body.title.trim(), status: req.body.status || "draft", blocks, metaTitle: req.body.metaTitle || "", metaDescription: req.body.metaDescription || "" });
    res.status(201).json(page);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Ce slug existe déjà" });
    throw error;
  }
});

router.get("/one-page", requireAuth, async (_req, res) => {
  const pages = await Promise.all((await Page.find({ deletedAt: null })).map(withBlocks));
  const byKey = Object.fromEntries(pages.map(page => [page.key, page]));
  const section = (key, type, label, fallback = {}) => {
    const page = byKey[key];
    const existing = page?.blocks?.find(block => block.type === type) || (["hero", "about", "projects", "expertise", "contact"].includes(type) ? page?.blocks?.[0] : null);
    return {
      ...(existing?.toObject?.() || existing || {}), id: existing?.id || `site-${type}`, type, label,
      content: { ...fallback, ...(existing?.content || {}) }, sourcePageKey: key,
      translations: existing?.translations || page?.translations || {}, visible: existing?.visible !== false
    };
  };
  let blocks = [
    section("home", "header", "Header global", { title: "NOUR MASTOURI" }),
    section("home", "hero", "Hero", { title: byKey.home?.title, eyebrow: byKey.home?.eyebrow, body: byKey.home?.body, ctaLabel: byKey.home?.ctaLabel, ctaUrl: byKey.home?.ctaUrl || "/assets/nour-mastouri-portfolio.pdf", image: byKey.home?.heroImage || "/assets/nour-hero-transparent.png", imageAlt: "Nour Mastouri", stats: "08|YEARS DESIGN\n25+|CLIENTS\n100+|PROJECTS", experienceValue: "08", experienceLabel: "years design", formRecipient: "hello@nourmastouri.com" }),
    section("home", "ticker", "Ticker", { body: "BRAND IDENTITY ↗ ART DIRECTION ↗ PACKAGING ↗ CAMPAIGNS ↗ DIGITAL DESIGN ↗" }),
    section("about", "about", "About", { kicker: "01 / PROFILE", location: "TUNISIA → WORLDWIDE", title: byKey.about?.title, eyebrow: byKey.about?.eyebrow, body: byKey.about?.body, image: byKey.about?.heroImage || "/assets/nour-mastouri.webp", imageAlt: "Nour Mastouri portrait", caption: "NOUR MASTOURI — 2026", years: "08+", yearsLabel: "YEARS OF EXPERIENCE", availability: "AVAILABLE FOR SELECTED PROJECTS" }),
    section("about", "manifesto", "Approach / Manifesto", { eyebrow: "02 / APPROACH", title: "CLARITY FIRST. CHARACTER ALWAYS.", kicker: "THINK / SHAPE / REFINE", body: "Every choice has a reason. Every detail earns its place." }),
    section("work", "projects", "Selected Work", { title: byKey.work?.title, body: byKey.work?.body, limit: 18 }),
    section("expertise", "expertise", "Expertise", { title: byKey.expertise?.title, eyebrow: byKey.expertise?.eyebrow, body: "BRAND IDENTITY|Strategy · Systems · Guidelines\nART DIRECTION|Concept · Campaign · Content\nSOCIAL MEDIA|Creative systems · Launches\nPACKAGING|Product · Label · Range\nPRINT DESIGN|Editorial · OOH · Production\nDIGITAL / UI|Web · Interfaces · Motion" }),
    section("expertise", "experience", "Experience", { title: "8+", body: "YEARS\nSHAPING\nDISTINCTIVE\nBRANDS", eyebrow: "TUNISIA — WORKING WORLDWIDE" }),
    section("expertise", "quote", "Point of View", { eyebrow: "05 / POINT OF VIEW", title: "DESIGN SHOULD FEEL INEVITABLE. NEVER DECORATED." }),
    section("contact", "contact", "Contact", { title: byKey.contact?.title, eyebrow: byKey.contact?.eyebrow, body: byKey.contact?.body, ctaLabel: byKey.contact?.ctaLabel }),
    section("home", "footer", "Footer global", { title: "NOUR MASTOURI" })
  ].map((block, index) => ({ ...block, sortOrder: index }));
  const expertise = blocks.find(block => block.type === "expertise");
  if (expertise && !String(expertise.content?.body || "").includes("|")) {
    const details = ["Strategy · Systems · Guidelines", "Concept · Campaign · Content", "Creative systems · Launches", "Product · Label · Range", "Editorial · OOH · Production", "Web · Interfaces · Motion"];
    expertise.content.body = String(expertise.content?.body || "").split("\n").filter(Boolean).map((name, index) => `${name}|${details[index] || ""}`).join("\n");
  }
  const home = pages.find(page => page.key === "home") || pages[0];
  const knownIds = new Set(blocks.map(block => block.id));
  const extras = pages.flatMap(page => (page.blocks || []).map(block => ({ ...block.toObject(), sourcePageKey: page.key }))).filter(block => !knownIds.has(block.id));
  blocks = [...blocks, ...extras];
  const savedOrder = Array.isArray(home?.editorSettings?.onePageOrder) ? home.editorSettings.onePageOrder : [];
  if (savedOrder.length) {
    const positions = new Map(savedOrder.map((id, index) => [id, index]));
    blocks.sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }
  blocks = blocks.map((block, index) => ({ ...block, sortOrder: index }));
  res.json({
    _id: "one-page", key: "home", title: "Home Page — One Page", status: home?.status || "published",
    metaTitle: home?.metaTitle || "", metaDescription: home?.metaDescription || "", canonicalUrl: home?.canonicalUrl || "",
    socialImage: home?.socialImage || "", robots: home?.robots || "index,follow", keywords: home?.keywords || "", blocks,
    updatedAt: pages.reduce((latest, page) => page.updatedAt > latest ? page.updatedAt : latest, home?.updatedAt || new Date(0))
  });
});

router.put("/one-page", requireAuth, async (req, res) => {
  const incoming = Array.isArray(req.body?.blocks) ? req.body.blocks : [];
  const pages = await Page.find({ deletedAt: null });
  await Promise.all(pages.map(async page => {
    const ownBlocks = incoming.filter(block => (block.sourcePageKey || "home") === page.key).map((block, index) => ({ ...block, sortOrder: index }));
    if (ownBlocks.length || page.key === "home") page.blocks = ownBlocks;
    if (page.key === "home") {
      page.editorSettings = { ...(page.editorSettings || {}), onePageOrder: incoming.map(block => block.id) };
      for (const field of ["status", "metaTitle", "metaDescription", "canonicalUrl", "socialImage", "robots", "keywords"]) {
        if (Object.hasOwn(req.body, field)) page[field] = req.body[field];
      }
    }
    const primary = ownBlocks.find(block => block.visible !== false && !["projects", "header", "menu", "footer"].includes(block.type));
    if (primary?.content) {
      for (const field of ["title", "eyebrow", "body", "ctaLabel", "ctaUrl"]) if (Object.hasOwn(primary.content, field)) page[field] = primary.content[field];
      if (Object.hasOwn(primary.content, "image")) page.heroImage = primary.content.image;
    }
    await page.save();
  }));
  // Preserve the editor's canonical one-page order in the save response. The
  // physical records are grouped by technical page in MongoDB; flattening
  // those records here made the canvas jump after a successful save.
  res.json({
    ...req.body,
    _id: "one-page",
    key: "home",
    title: "Home Page — One Page",
    blocks: incoming.map((block, index) => ({ ...block, sortOrder: index }))
  });
});

router.get("/admin/:key", requireAuth, async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(await withBlocks(page));
});

router.get("/:key", async (req, res) => {
  const publication = { $or: [
    { status: "published" },
    { status: "scheduled", scheduledAt: { $lte: new Date() } }
  ] };
  const page = await Page.findOne({ key: req.params.key, deletedAt: null, ...publication }).select("-revisions");
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(await withBlocks(page));
});

router.put("/:key", requireAuth, async (req, res) => {
  const page = await Page.findOne({ key: req.params.key, deletedAt: null });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  const { _id, revisions, createdAt, updatedAt, deletedAt, ...updates } = req.body || {};
  if (Array.isArray(updates.blocks)) {
    updates.blocks = updates.blocks.map((block, index) => ({ ...block, sortOrder: index }));
    const primary = updates.blocks.find(block => block.visible !== false && !["projects", "header", "menu", "footer"].includes(block.type));
    if (primary?.content) {
      for (const field of ["title", "eyebrow", "body", "ctaLabel", "ctaUrl"]) {
        if (Object.hasOwn(primary.content, field)) updates[field] = primary.content[field];
      }
      if (Object.hasOwn(primary.content, "image")) updates.heroImage = primary.content.image;
    }
  } else {
    updates.blocks = (page.blocks || []).map(block => {
      if (["projects", "header", "menu", "footer"].includes(block.type)) return block;
      const content = { ...(block.content || {}) };
      for (const field of ["title", "eyebrow", "body", "ctaLabel", "ctaUrl"]) {
        if (Object.hasOwn(updates, field) && Object.hasOwn(content, field)) content[field] = updates[field];
      }
      return { ...block.toObject?.() || block, content };
    });
  }
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

router.delete("/:key", requireAuth, async (req, res) => {
  if (["home", "about", "work", "expertise", "contact"].includes(req.params.key)) return res.status(409).json({ message: "Cette page technique est protégée" });
  const page = await Page.findOneAndUpdate({ key: req.params.key, deletedAt: null }, { deletedAt: new Date() }, { new: true });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json({ ok: true });
});

router.post("/:key/restore", requireAuth, async (req, res) => {
  const page = await Page.findOneAndUpdate({ key: req.params.key, deletedAt: { $ne: null } }, { deletedAt: null }, { new: true });
  if (!page) return res.status(404).json({ message: "Page introuvable" });
  res.json(page);
});

router.delete("/:key/permanent", requireAuth, async (req, res) => {
  const page = await Page.findOneAndDelete({ key: req.params.key, deletedAt: { $ne: null } });
  if (!page) return res.status(404).json({ message: "Page introuvable dans la corbeille" });
  res.json({ ok: true });
});

export default router;
