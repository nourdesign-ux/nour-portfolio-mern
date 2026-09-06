import mongoose from "mongoose";

const widgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["map", "text", "image", "button", "video", "form", "cta", "contact", "social", "component"], required: true },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  style: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Widget", widgetSchema);
