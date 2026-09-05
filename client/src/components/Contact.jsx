import { usePage } from "../api/usePage.js";

export default function Contact() {
  const page = usePage("contact", { title: "LET’S MAKE\nSOMETHING\nMEMORABLE.", eyebrow: "04 — CONTACT", body: "Available for selected freelance, branding and art direction projects.", ctaLabel: "START A PROJECT ↗", ctaUrl: "mailto:hello@nourmastouri.com" });
  return (
    <section className="contact section" id="contact">
      <div className="section-label">{page.eyebrow || "04 — CONTACT"}</div>
      <h2>{page.title || "LET’S MAKE\nSOMETHING\nMEMORABLE."}</h2>
      <p>{page.body}</p>
      <a href={page.ctaUrl || "mailto:hello@nourmastouri.com"}>{page.ctaLabel || "START A PROJECT ↗"}</a>
    </section>
  );
}
