import { Router } from "express";
import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import Page from "../models/Page.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const cleanSlug = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
const normalizeFields = fields => (Array.isArray(fields) ? fields : []).map((field, index) => ({ ...field, id: field.id || `field-${Date.now()}-${index}`, sortOrder: index }));

async function ensureLegacyDevisForm() {
  const existing = await Form.findOne({ $or: [{ slug: { $in: ["devis", "quote", "quote-request"] } }, { name: /^devis$/i }], deletedAt: null });
  if (existing) return;
  const home = await Page.findOne({ key: "home", deletedAt: null }).lean();
  // The production Hero already contains the quote form even on installations
  // created before the Form collection existed. Materialize that legacy form
  // once so the Forms screen reflects the real site instead of a false empty state.
  const quote = home?.editorSettings?.quoteForm || {};
  await Form.findOneAndUpdate({ slug: "devis" }, { $set: { name: "Devis", slug: "devis", status: "published", deletedAt: null, settings: { recipient: quote.recipient || "", successMessage: quote.successMessage || "Merci, votre demande a été envoyée." }, fields: [
    { id: "name", type: "text", label: "Nom", required: true, sortOrder: 0 },
    { id: "email", type: "email", label: "Email", required: true, sortOrder: 1 },
    { id: "service", type: "select", label: "Service", options: ["Brand identity", "Art direction", "Packaging", "Digital design", "Other"], required: false, sortOrder: 2 },
    { id: "budget", type: "select", label: "Budget", options: ["Under €1,000", "€1,000 — €3,000", "€3,000 — €5,000", "Over €5,000"], required: false, sortOrder: 3 },
    { id: "project", type: "textarea", label: "Your project", required: true, sortOrder: 4 },
    { id: "submit", type: "submit", label: quote.submitLabel || "SEND REQUEST", sortOrder: 5 }
  ] } }, { upsert: true, new: true, runValidators: true });
}

router.post("/:slug/submit", async (req, res) => {
  const form = await Form.findOne({ slug: req.params.slug, status: "published", deletedAt: null });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  const values = req.body?.values || {};
  const missing = form.fields.filter(field => field.required && field.type !== "submit" && !values[field.id]).map(field => field.label);
  if (missing.length) return res.status(400).json({ message: `Champs requis : ${missing.join(", ")}` });
  const allowed = new Set(form.fields.map(field => field.id));
  const safeValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowed.has(key)).map(([key, value]) => [key, String(value).slice(0, 5000)]));
  await FormSubmission.create({ formId: form._id, values: safeValues });
  res.status(201).json({ ok: true, message: form.settings?.successMessage || "Merci, votre demande a été envoyée." });
});

router.get("/public/:slug", async (req, res) => {
  const form = await Form.findOne({ slug: req.params.slug, status: "published", deletedAt: null }).select("name slug fields settings.successMessage settings.errorMessage settings.title settings.subtitle");
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  res.json(form);
});

router.use(requireAuth);
router.get("/", async (req, res) => { if (req.query.trash !== "1") await ensureLegacyDevisForm(); res.json(await Form.find(req.query.trash === "1" ? { deletedAt: { $ne: null } } : { deletedAt: null }).sort({ updatedAt: -1 })); });
router.post("/", async (req, res) => {
  const slug = cleanSlug(req.body?.slug || req.body?.name);
  if (!req.body?.name?.trim() || !slug) return res.status(400).json({ message: "Nom et slug requis" });
  const form = await Form.create({ name: req.body.name.trim(), slug, status: req.body.status || "draft", fields: normalizeFields(req.body.fields), settings: req.body.settings || {} });
  res.status(201).json(form);
});
router.get("/:id", async (req, res) => {
  const form = await Form.findOne({ _id: req.params.id, deletedAt: null });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  res.json(form);
});
router.put("/:id", async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ["name", "slug", "status", "fields", "settings"].includes(key)));
  if (update.slug) update.slug = cleanSlug(update.slug);
  if (update.fields) update.fields = normalizeFields(update.fields);
  const form = await Form.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, update, { new: true, runValidators: true });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  res.json(form);
});
router.post("/:id/duplicate", async (req, res) => {
  const source = await Form.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!source) return res.status(404).json({ message: "Formulaire introuvable" });
  delete source._id; delete source.createdAt; delete source.updatedAt;
  source.name = `${source.name} (copie)`; source.slug = `${source.slug}-copy-${Date.now()}`; source.status = "draft";
  res.status(201).json(await Form.create(source));
});
router.delete("/:id", async (req, res) => {
  const form = await Form.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { deletedAt: new Date() }, { new: true });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  res.json({ ok: true });
});
router.post("/:id/restore", async (req, res) => {
  const form = await Form.findOneAndUpdate({ _id: req.params.id, deletedAt: { $ne: null } }, { deletedAt: null }, { new: true });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
  res.json(form);
});
router.delete("/:id/permanent", async (req, res) => {
  const form = await Form.findOneAndDelete({ _id: req.params.id, deletedAt: { $ne: null } });
  if (!form) return res.status(404).json({ message: "Formulaire introuvable dans la corbeille" });
  await FormSubmission.deleteMany({ formId: form._id });
  res.json({ ok: true });
});
router.get("/:id/submissions", async (req, res) => res.json(await FormSubmission.find({ formId: req.params.id }).sort({ createdAt: -1 })));
router.put("/:id/submissions/:submissionId", async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ["read", "status"].includes(key)));
  const item = await FormSubmission.findOneAndUpdate({ _id: req.params.submissionId, formId: req.params.id }, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Soumission introuvable" });
  res.json(item);
});
router.delete("/:id/submissions/:submissionId", async (req, res) => {
  const item = await FormSubmission.findOneAndDelete({ _id: req.params.submissionId, formId: req.params.id });
  if (!item) return res.status(404).json({ message: "Soumission introuvable" });
  res.json({ ok: true });
});

export default router;
