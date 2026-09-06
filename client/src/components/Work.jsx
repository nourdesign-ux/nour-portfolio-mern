import { useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import ProjectModal from "./ProjectModal.jsx";

const behanceProject = {
  title: "LEADERS DIGITAL",
  slug: "leaders-digital",
  category: "BRAND IDENTITY · DIGITAL AGENCY",
  year: 2025,
  description: "A complete rebrand for a digital agency ready to move forward. The new identity replaces an outdated image with a bold, flexible system shaped around creativity, communication and digital progress.",
  conceptTitle: "Built to lead. Designed to connect.",
  concept: "The symbol brings together an L for Leaders, a D for Digital and a speech bubble for communication. Violet anchors the master brand, while blue, green and lime create a flexible colour code for its specialist teams.",
  services: ["Brand Strategy", "Logo Design", "Visual Identity", "Art Direction"],
  cover: "/assets/projects/digital-agency/01.jpg",
  images: ["02","03","04","05","06","07","08","09","10","11"].map(name => `/assets/projects/digital-agency/${name}.jpg`),
  behanceUrl: "https://www.behance.net/gallery/235491963/Brand-Identity-Digital-Agency"
};

const wineProject = {
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
  behanceUrl: "https://www.behance.net/gallery/205558191/Wine-Social-Media"
};

const sportsAcademyProject = {
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
  behanceUrl: "https://www.behance.net/gallery/205011451/Sports-Academy-Social-Media-Design"
};

const fallback = [
  behanceProject,
  wineProject,
  sportsAcademyProject,
  {title:"ESPIM",category:"ART DIRECTION · CAMPAIGN",year:2026}, {title:"FREMIGEL",category:"PACKAGING SYSTEM",year:2026},
  {title:"LEADERS TV",category:"BRAND IDENTITY · MOTION",year:2025}, {title:"HEISENBERG",category:"BRAND CAMPAIGN · PRINT",year:2026},
  {title:"NOLYSS ENERGIE",category:"BRAND IDENTITY",year:2025}, {title:"AZALEA FOUNDATION",category:"BRAND · DIGITAL",year:2025},
  {title:"EVENTCELLO",category:"DIGITAL EXPERIENCE",year:2025}, {title:"CLARENIA",category:"PACKAGING · SOCIAL",year:2026},
  {title:"ATELIER N",category:"BRAND IDENTITY",year:2025}, {title:"KIF",category:"CAMPAIGN · SOCIAL",year:2025},
  {title:"NOVA",category:"DIGITAL · UI",year:2025}, {title:"MIRA",category:"PACKAGING SYSTEM",year:2024},
  {title:"ORBIT",category:"ART DIRECTION",year:2024}, {title:"SORA",category:"EDITORIAL DESIGN",year:2024},
  {title:"VERTEX",category:"BRAND STRATEGY",year:2024}
];
const slugs = ["espim","fremigel","leaders","heisenberg","nolyss","azalea","eventcello","clarenia"];

function ProjectCard({ project, index, onOpen }) {
  return <article className="project">
    <button className="project__trigger" type="button" onClick={() => onOpen({ project, index })}>
      <div className={`project-art art-${slugs[index % slugs.length]}`}>{project.cover ? <img className="project-card__cover" src={mediaUrl(project.cover)} alt={`${project.title} cover`} /> : <strong className="project-art__fallback">{project.title}</strong>}</div>
      <div className="project__meta"><span>{String(index + 1).padStart(2,"0")} / {project.title}</span><span>{project.category}</span><span>{project.year}</span></div>
    </button>
  </article>;
}

export default function Work() {
  const [projects, setProjects] = useState(fallback);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState("next");
  const [selected, setSelected] = useState(null);
  const dragStart = useRef(null);
  const didDrag = useRef(false);
  useEffect(() => {
    api("/projects").then(data => {
      if (!data?.length) return;
      // Keep the three original case studies visible while an older API process
      // is still running; the server migration persists the same records in DB.
      const featured = [behanceProject, wineProject, sportsAcademyProject];
      const merged = [
        ...featured.map(original => data.find(item => item.slug === original.slug) || original),
        ...data.filter(item => !featured.some(original => original.slug === item.slug))
      ];
      setProjects(merged.slice(0, 18));
    }).catch(() => {});
  }, []);
  const pages = Array.from({ length: Math.max(1, Math.ceil(projects.length / 6)) }, (_, i) => projects.slice(i * 6, i * 6 + 6));
  const go = (next, movement = next > page ? "next" : "prev") => {
    setDirection(movement);
    setPage((next + pages.length) % pages.length);
  };
  const startDrag = event => {
    didDrag.current = false;
    dragStart.current = event.clientX;
  };
  const endDrag = event => {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) < 55) return;
    didDrag.current = true;
    distance < 0 ? go(page + 1, "next") : go(page - 1, "prev");
  };
  const openProject = selection => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setSelected(selection);
  };

  return <section className="work section-pad" id="work">
    <div className="section-head"><p className="micro">03 / SELECTED WORK</p><h2>Selected work, built to stand out and stay relevant.</h2><span className="section-head__count">{String(projects.length).padStart(2,"0")}</span></div>
    <div className="project-pages" aria-live="polite" onPointerDown={startDrag} onPointerUp={endDrag} onPointerCancel={() => { dragStart.current = null; }}>
      <button className="project-slider-arrow project-slider-arrow--left" type="button" aria-label="Previous projects" onPointerDown={event => event.stopPropagation()} onClick={() => go(page - 1, "prev")} disabled={pages.length === 1}>←</button>
      <div className={`projects projects--featured project-page project-page--${direction}`} key={page}>
        {pages[page].map((project, offset) => <ProjectCard project={project} index={page * 6 + offset} onOpen={openProject} key={project._id || project.title} />)}
      </div>
      <button className="project-slider-arrow project-slider-arrow--right" type="button" aria-label="Next projects" onPointerDown={event => event.stopPropagation()} onClick={() => go(page + 1, "next")} disabled={pages.length === 1}>→</button>
    </div>
    <div className="project-pagination__dots" aria-label="Project pages">{pages.map((_, index) => <button className={index === page ? "is-active" : ""} type="button" aria-label={`Go to project page ${index + 1}`} aria-current={index === page ? "page" : undefined} onClick={() => go(index, index > page ? "next" : "prev")} key={index} />)}</div>
    {selected && <ProjectModal project={selected.project} index={selected.index} slug={slugs[selected.index % slugs.length]} onClose={() => setSelected(null)} />}
  </section>;
}
