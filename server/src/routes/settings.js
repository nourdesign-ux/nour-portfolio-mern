import { Router } from "express";
import SiteSettings from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const defaultSettings = {
  key: "main",
  menu: [
    { label: "Work", url: "#work", sortOrder: 0 },
    { label: "About", url: "#about", sortOrder: 1 },
    { label: "Contact", url: "#contact", sortOrder: 2 }
  ]
};

router.get("/", requireAuth, async (_req, res) => {
  const settings = await SiteSettings.findOneAndUpdate({ key: "main" }, { $setOnInsert: defaultSettings }, { new: true, upsert: true });
  res.json(settings);
});

router.get("/public", async (_req, res) => {
  const settings = await SiteSettings.findOneAndUpdate({ key: "main" }, { $setOnInsert: defaultSettings }, { new: true, upsert: true });
  res.json({
    siteTitle: settings.siteTitle || "Nour Mastouri",
    siteDescription: settings.siteDescription || "",
    logoText: settings.logoText || "NOUR MASTOURI",
    menu: (settings.menu || []).filter(item => item.visible !== false).sort((a, b) => a.sortOrder - b.sortOrder),
    menuStyle: settings.menuStyle || {}, footer: settings.footer || "", footerEditor: settings.footerEditor || {},
    profile: settings.profile || {}, seo: settings.seo || {}, siteStatus: settings.siteStatus || "online",
    cookies: settings.cookies || {}, comingSoon: settings.comingSoon || {}, maintenance: settings.maintenance || {}
  });
});

router.put("/", requireAuth, async (req, res) => {
  const allowed = ["siteTitle", "siteDescription", "logoText", "theme", "customCss", "menu", "menuStyle", "footer", "footerEditor", "profile", "seo", "siteStatus", "cookies", "comingSoon", "maintenance"];
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
  const settings = await SiteSettings.findOneAndUpdate({ key: "main" }, { $set: update }, { new: true, upsert: true, runValidators: true });
  res.json(settings);
});

export default router;
