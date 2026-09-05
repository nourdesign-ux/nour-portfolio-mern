import "dotenv/config";
import { connectDB } from "./config/db.js";
import Project from "./models/Project.js";
import Page from "./models/Page.js";
import mongoose from "mongoose";

const projects = [
  ["ESPIM","espim","ART DIRECTION · CAMPAIGN",2026],
  ["FREMIGEL","fremigel","PACKAGING SYSTEM",2026],
  ["LEADERS TV","leaders-tv","BRAND IDENTITY · MOTION",2025],
  ["HEISENBERG","heisenberg","BRAND CAMPAIGN · PRINT",2026],
  ["NOLYSS","nolyss","BRAND IDENTITY",2025],
  ["AZALEA","azalea","BRAND · DIGITAL",2025],
  ["EVENTCELLO","eventcello","DIGITAL EXPERIENCE",2025],
  ["CLARENIA","clarenia","PACKAGING · SOCIAL",2026]
].map(([title,slug,category,year],i)=>({
  title, slug, category, year, status:"published", featured:i<4, sortOrder:i+1
}));

const pages = [
  { key:"home", title:"Nour Mastouri", eyebrow:"BRANDING / ART DIRECTION / DIGITAL", body:"Senior Graphic Designer & Art Director — Tunisia / Worldwide" },
  { key:"work", title:"Selected Work", body:"Brand identities, campaigns, packaging and digital experiences." },
  { key:"about", title:"About", body:"Senior Graphic Designer and Art Director focused on strong visual systems and real brand impact." },
  { key:"expertise", title:"Expertise", body:"Branding · Art Direction · Packaging · Social Media · Print · Digital" },
  { key:"contact", title:"Let’s work together", body:"Available for selected freelance and art direction projects." }
];

await connectDB();
await Project.deleteMany({});
await Page.deleteMany({});
await Project.insertMany(projects);
await Page.insertMany(pages);
console.log("Seed complete");
await mongoose.disconnect();
