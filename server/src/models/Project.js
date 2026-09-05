import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  description: { type: String, default: "" },
  services: [{ type: String }],
  cover: { type: String, default: "" },
  images: [{ type: String }],
  status: { type: String, enum: ["draft","published"], default: "published" },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
