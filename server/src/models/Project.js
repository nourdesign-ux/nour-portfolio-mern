import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  category: { type: String, default: "" },
  year: { type: Number, min: 1900, max: 2200, default: new Date().getFullYear() },
  description: { type: String, default: "" },
  conceptTitle: { type: String, default: "" },
  concept: { type: String, default: "" },
  role: { type: String, default: "ART DIRECTION\nDESIGN" },
  behanceUrl: { type: String, default: "" },
  services: [{ type: String }],
  cover: { type: String, default: "" },
  images: [{ type: String }],
  status: { type: String, enum: ["draft","published"], default: "published" },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, min: 0, default: 0 },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
