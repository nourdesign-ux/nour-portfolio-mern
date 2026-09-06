import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, default: "" },
  alt: { type: String, default: "" },
  caption: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Media", mediaSchema);
