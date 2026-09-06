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

router.get("/", async (_req, res) => {
  const settings = await SiteSettings.findOneAndUpdate({ key: "main" }, { $setOnInsert: defaultSettings }, { new: true, upsert: true });
  res.json(settings);
});

router.put("/", requireAuth, async (req, res) => {
  const allowed = ["siteTitle", "siteDescription", "logoText", "theme", "customCss", "menu", "footer", "profile", "seo"];
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
  const settings = await SiteSettings.findOneAndUpdate({ key: "main" }, { $set: update }, { new: true, upsert: true, runValidators: true });
  res.json(settings);
});

export default router;