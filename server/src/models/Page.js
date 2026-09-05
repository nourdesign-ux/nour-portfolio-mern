import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  body: { type: String, default: "" },
  ctaLabel: { type: String, default: "" },
  ctaUrl: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Page", pageSchema);
