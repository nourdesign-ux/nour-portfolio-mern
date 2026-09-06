import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  url: { type: String, default: "" },
  visible: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "main" },
  siteTitle: { type: String, default: "Nour Mastouri" },
  siteDescription: { type: String, default: "" },
  logoText: { type: String, default: "NOUR." },
  theme: {
    accent: { type: String, default: "#d9ff43" },
    background: { type: String, default: "#eeeae3" },
    foreground: { type: String, default: "#11110f" },
    panel: { type: String, default: "#f7f5f0" },
    fontHeading: { type: String, default: "Arial" },
    fontBody: { type: String, default: "Arial" }
  },
  customCss: { type: String, default: "" },
  menu: { type: [menuItemSchema], default: [] },
  footer: { type: String, default: "" },
  profile: {
    name: { type: String, default: "Nour Mastouri" },
    role: { type: String, default: "Senior Graphic Designer & Art Director" },
    email: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" }
  },
  seo: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
    image: { type: String, default: "" }
  }
}, { timestamps: true });

export default mongoose.model("SiteSettings", siteSettingsSchema);
