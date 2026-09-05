export const emptyProject = {
  title: "",
  slug: "",
  category: "",
  year: new Date().getFullYear(),
  description: "",
  services: [],
  cover: "",
  images: [],
  status: "draft",
  featured: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: ""
};

export function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatBytes(value = 0) {
  if (!value) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
