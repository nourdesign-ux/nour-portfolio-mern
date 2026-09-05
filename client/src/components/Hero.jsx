import { useEffect } from "react";
import { usePage } from "../api/usePage.js";

export default function Hero() {
  const page = usePage("home", {
    title: "Nour Mastouri",
    eyebrow: "BRANDING / ART DIRECTION / DIGITAL",
    body: "I build visual identities, campaigns and digital experiences that make brands clearer, bolder and more memorable.",
    ctaLabel: "VIEW SELECTED WORK ↗", ctaUrl: "#work", metaTitle: "", metaDescription: ""
  });
  const [firstName = "Nour", ...lastNameParts] = (page.title || "Nour Mastouri").trim().split(/\s+/);
  const lastName = lastNameParts.join(" ") || "Mastouri";
  useEffect(() => {
    if (page.metaTitle) document.title = page.metaTitle;
    if (page.metaDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = page.metaDescription;
    }
  }, [page.metaTitle, page.metaDescription]);
  return (
    <section className="hero" id="top">
      <HeaderOverlay />
      <div className="hero-copy">
        <div className="eyebrow">{page.eyebrow}</div>
        <h1><span>Hello.</span><strong>I’m {firstName}</strong><span>{lastName}.</span></h1>
        <p className="role">SENIOR GRAPHIC DESIGNER / ART DIRECTOR</p>
        <p className="intro">{page.body}</p>
        <div className="hero-actions">
          <a href={page.ctaUrl || "#work"} className="primary">{page.ctaLabel || "VIEW SELECTED WORK ↗"}</a>
          <a href="#contact">START A PROJECT</a>
        </div>
        <div className="stats">
          <div><b>08</b><span>YEARS EXPERIENCE</span></div>
          <div><b>25+</b><span>SELECTED PROJECTS</span></div>
          <div><b>100+</b><span>VISUAL DELIVERABLES</span></div>
        </div>
      </div>

      <div className="portrait-wrap">
        <img src="/assets/nour-hero-transparent.png" alt="Nour Mastouri" />
      </div>

      <div className="experience-badge"><b>+08</b><span>YEARS<br/>DESIGN</span></div>
      <div className="hero-circle" aria-hidden="true" />
    </section>
  );
}

function HeaderOverlay() {
  return (
    <div className="hero-header-space" aria-hidden="true" />
  );
}
