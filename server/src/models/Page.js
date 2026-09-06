import mongoose from "mongoose";

const localizedPageSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  body: { type: String, default: "" },
  ctaLabel: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["header", "menu", "hero", "about", "text", "image", "gallery", "ticker", "manifesto", "projects", "expertise", "experience", "quote", "contact", "form", "widget", "blank", "footer"], default: "hero" },
  label: { type: String, default: "Bloc" },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  visible: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  globalId: { type: String, default: "" },
  children: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seo: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourcePageKey: { type: String, default: "" },
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  sortOrder: { type: Number, default: 0 }
}, { _id: false });

const revisionSchema = new mongoose.Schema({
  savedAt: { type: Date, default: Date.now },
  snapshot: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: true });

const pageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  body: { type: String, default: "" },
  ctaLabel: { type: String, default: "" },
  ctaUrl: { type: String, default: "" },
  heroImage: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  keywords: { type: String, default: "" },
  socialImage: { type: String, default: "" },
  canonicalUrl: { type: String, default: "" },
  robots: { type: String, default: "index,follow" }
  ,blocks: { type: [blockSchema], default: [] }
  ,status: { type: String, enum: ["draft", "published", "scheduled"], default: "published" }
  ,scheduledAt: { type: Date, default: null }
  ,deletedAt: { type: Date, default: null }
  ,revisions: { type: [revisionSchema], default: [] }
  ,editorSettings: { type: mongoose.Schema.Types.Mixed, default: {} }
  ,translations: {
    en: { type: localizedPageSchema, default: () => ({}) },
    fr: { type: localizedPageSchema, default: () => ({}) },
    ar: { type: localizedPageSchema, default: () => ({}) }
  }
}, { timestamps: true });

export default mongoose.model("Page", pageSchema);
