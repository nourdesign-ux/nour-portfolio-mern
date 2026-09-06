import mongoose from "mongoose";

const savedBlockSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  scope: { type: String, enum: ["saved", "global"], default: "saved" },
  block: { type: mongoose.Schema.Types.Mixed, required: true },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("SavedBlock", savedBlockSchema);
