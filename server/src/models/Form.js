import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["text", "email", "phone", "textarea", "select", "checkbox", "radio", "number", "date", "submit"], required: true },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  defaultValue: { type: mongoose.Schema.Types.Mixed, default: "" },
  options: { type: [String], default: [] },
  validation: { type: mongoose.Schema.Types.Mixed, default: {} },
  sortOrder: { type: Number, default: 0 }
}, { _id: false });

const formSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  fields: { type: [fieldSchema], default: [] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Form", formSchema);
