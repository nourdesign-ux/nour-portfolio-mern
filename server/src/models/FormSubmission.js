import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true, index: true },
  values: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  status: { type: String, enum: ["new", "processed", "spam"], default: "new" },
  source: { type: String, default: "website" }
}, { timestamps: true });

export default mongoose.model("FormSubmission", formSubmissionSchema);
