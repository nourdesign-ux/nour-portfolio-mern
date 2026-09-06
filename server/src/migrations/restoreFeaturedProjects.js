import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Project from "../models/Project.js";

const projects = [
  {
    title: "LEADERS DIGITAL",
    slug: "leaders-digital",
    category: "BRAND IDENTITY · DIGITAL AGENCY",
    year: 2025,
    description: "A complete rebrand for a digital agency ready to move forward. The new identity replaces an outdated image with a bold, flexible system shaped around creativity, communication and digital progress.",
    conceptTitle: "Built to lead. Designed to connect.",
    concept: "The symbol brings together an L for Leaders, a D for Digital and a speech bubble for communication. Violet anchors the master brand, while blue, green and lime create a flexible colour code for its specialist teams.",
    services: ["Brand Strategy", "Logo Design", "Visual Identity", "Art Direction"],
    cover: "/assets/projects/digital-agency/01.jpg",
    images: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11"].map(name => `/assets/projects/digital-agency/${name}.jpg`),
    behanceUrl: "https://www.behance.net/gallery/235491963/Brand-Identity-Digital-Agency",
    featured: true,
    sortOrder: 0
  },
  {
    title: "KURUBIS WINE",
    slug: "wine-social-media",
    category: "SOCIAL MEDIA · ART DIRECTION",
    year: 2024,
    description: "A vibrant social media campaign for Kurubis wine, designed to turn each bottle into an expressive lifestyle moment. The system connects product storytelling, vineyard imagery and editorial typography across red and white wine collections.",
    conceptTitle: "A richer taste, made visual.",
    concept: "Deep burgundy, vineyard green and warm cream build a sensorial palette inspired by grapes and terroir. Large serif typography, layered compositions and product-led imagery give every post its own character while keeping the campaign unmistakably Kurubis.",
    services: ["Art Direction", "Social Media Design", "Advertising", "Photo Compositing"],
    cover: "/assets/projects/wine-social/01.jpg",
    images: ["02", "03", "04", "05"].map(name => `/assets/projects/wine-social/${name}.jpg`),
    behanceUrl: "https://www.behance.net/gallery/205558191/Wine-Social-Media",
    featured: true,
    sortOrder: 1
  },
  {
    title: "UNITED ACADEMY",
    slug: "sports-academy-social-media",
    category: "SPORTS DESIGN · SOCIAL MEDIA",
    year: 2024,
    description: "A high-energy communication system for United Academy, connecting football and padel programmes through a consistent social media language. The campaign covers registrations, private lessons, events and brand moments across digital and outdoor formats.",
    conceptTitle: "One team. One visual rhythm.",
    concept: "Electric blue creates an immersive stadium atmosphere while lime accents drive attention toward key messages and calls to action. Bold condensed typography, dynamic athlete imagery and layered light effects give the academy a confident, competitive and youth-focused presence.",
    services: ["Art Direction", "Sports Design", "Social Media", "Advertising"],
    cover: "/assets/projects/sports-academy/01.jpg",
    images: ["02", "03", "04", "05"].map(name => `/assets/projects/sports-academy/${name}.jpg`),
    behanceUrl: "https://www.behance.net/gallery/205011451/Sports-Academy-Social-Media-Design",
    featured: true,
    sortOrder: 2
  }
];

await connectDB();
for (const project of projects) {
  await Project.findOneAndUpdate(
    { slug: project.slug },
    { $set: { ...project, status: "published", deletedAt: null } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}
console.log(`Restored ${projects.length} featured projects`);
await mongoose.disconnect();
