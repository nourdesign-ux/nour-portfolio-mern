import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import Work from "../components/Work.jsx";
import About from "../components/About.jsx";
import Expertise from "../components/Expertise.jsx";
import Contact from "../components/Contact.jsx";
import { usePublicSettings } from "../components/PublicExperience.jsx";
import { usePage } from "../api/usePage.js";

const fallback = {
  ticker: { body: "BRAND IDENTITY ↗ ART DIRECTION ↗ PACKAGING ↗ CAMPAIGNS ↗ DIGITAL DESIGN ↗" },
  manifesto: { eyebrow: "02 / APPROACH", title: "CLARITY FIRST. CHARACTER ALWAYS.", kicker: "THINK / SHAPE / REFINE", body: "Every choice has a reason. Every detail earns its place." },
  experience: { title: "8+", body: "YEARS\nSHAPING\nDISTINCTIVE\nBRANDS", eyebrow: "TUNISIA — WORKING WORLDWIDE" },
  quote: { eyebrow: "05 / POINT OF VIEW", title: "DESIGN SHOULD FEEL INEVITABLE. NEVER DECORATED." }
};
const blockOf = (page, type) => page?.blocks?.find(block => block.type === type);
const setMeta = (name, value, attribute = "name") => { if (!value) return; let node = document.head.querySelector(`meta[${attribute}="${name}"]`); if (!node) { node = document.createElement("meta"); node.setAttribute(attribute, name); document.head.appendChild(node); } node.setAttribute("content", value); };
const sectionBackground = type => ["ticker", "projects", "expertise", "contact"].includes(type) ? "dark" : type === "about" ? "soft" : type === "quote" ? "gray" : "paper";

export default function Portfolio() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const home = usePage("home", {}); const about = usePage("about", {}); const work = usePage("work", {}); const expertise = usePage("expertise", {}); const contact = usePage("contact", {}); const settings = usePublicSettings();
  const pages = [home, about, work, expertise, contact]; const blocks = pages.flatMap(page => page.blocks || []);
  const get = type => blockOf(pages.find(page => blockOf(page, type)), type); const enabled = type => get(type)?.visible !== false;
  const ticker = { ...fallback.ticker, ...(get("ticker")?.content || {}) }; const manifesto = { ...fallback.manifesto, ...(get("manifesto")?.content || {}) }; const experience = { ...fallback.experience, ...(get("experience")?.content || {}) }; const quote = { ...fallback.quote, ...(get("quote")?.content || {}) };

  useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 140); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  useEffect(() => {
    const seo = settings?.seo || {}; const title = home.metaTitle || seo.title || settings?.siteTitle; if (title) document.title = title;
    setMeta("description", home.metaDescription || seo.description || settings?.siteDescription); setMeta("keywords", home.keywords || seo.keywords); setMeta("robots", home.robots || "index,follow"); setMeta("og:title", title, "property"); setMeta("og:description", home.metaDescription || seo.description, "property"); setMeta("og:image", home.socialImage || seo.image, "property");
    if (home.canonicalUrl) { let canonical = document.head.querySelector('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); } canonical.href = home.canonicalUrl; }
  }, [home.metaTitle, home.metaDescription, home.keywords, home.robots, home.socialImage, home.canonicalUrl, settings]);

  const mainSections = useMemo(() => {
    const entries = [
      { type: "hero", element: <Hero/> },
      { type: "ticker", element: <section className="ticker"><div className="ticker__track"><span>{ticker.body}</span><span>{ticker.body}</span></div></section> },
      { type: "about", element: <About/> },
      { type: "manifesto", element: <section className="manifesto section-pad"><p className="manifesto__kicker micro">{manifesto.eyebrow}</p><h2 className="manifesto__line">{String(manifesto.title).split(".")[0]}.<br/><em>{String(manifesto.title).split(".").slice(1).join(".").trim()}</em></h2><div className="manifesto__foot"><span className="micro">{manifesto.kicker}</span><p>{manifesto.body}</p></div></section> },
      { type: "projects", element: <Work/> }, { type: "expertise", element: <Expertise/> },
      { type: "experience", element: <section className="experience-statement"><div className="experience-statement__number">{experience.title}</div><div className="experience-statement__words">{String(experience.body).split("\n").map(word=><span key={word}>{word}</span>)}</div><p className="micro">{experience.eyebrow}</p></section> },
      { type: "quote", element: <section className="quote section-pad"><p className="micro">{quote.eyebrow}</p><blockquote>{String(quote.title).split(".")[0]}.<br/><em>{String(quote.title).split(".").slice(1).join(".").trim()}</em></blockquote></section> },
      { type: "contact", element: <Contact/> }
    ].filter(entry => enabled(entry.type));
    const order = home.editorSettings?.onePageOrder || []; const positions = new Map(order.map((id,index)=>[blocks.find(block=>block.id===id)?.type,index]));
    return entries.sort((a,b)=>(positions.get(a.type)??Number.MAX_SAFE_INTEGER)-(positions.get(b.type)??Number.MAX_SAFE_INTEGER));
  }, [blocks.map(block=>`${block.id}:${block.visible}`).join("|"), home.editorSettings?.onePageOrder, ticker.body, manifesto.title, manifesto.body, manifesto.eyebrow, manifesto.kicker, experience.title, experience.body, experience.eyebrow, quote.title, quote.eyebrow]);

  const footer = settings?.footerEditor || {}; const copyright = settings?.footer || "© 2026 NOUR MASTOURI"; const footerRole = footer.role || settings?.profile?.role || "SENIOR GRAPHIC DESIGNER\n& ART DIRECTOR";
  return <><Header/><main id="main">{mainSections.map(entry => <div className={`portfolio-section-bg portfolio-section-bg--${sectionBackground(entry.type)}`} key={entry.type}>{entry.element}</div>)}</main><button className={`floating-back-to-top${showBackToTop ? " is-visible" : ""}`} type="button" aria-label="Back to top" title="Back to top" onClick={() => scrollTo({top:0,behavior:"smooth"})}><span aria-hidden="true">↑</span></button>{enabled("footer")&&<div className="portfolio-footer-bg"><footer className="footer"><div className="footer__brand">{footer.brand || settings?.logoText || "NOUR MASTOURI"}</div><div className="footer__role micro"><span>{String(footerRole).split("\n").map((line,index)=><span key={`${line}-${index}`}>{line}{index<String(footerRole).split("\n").length-1&&<br/>}</span>)}</span><span>{footer.location || settings?.profile?.location || "TUNISIA — WORLDWIDE"}</span></div><div className="footer__bottom micro"><span>{copyright}</span>{footer.showBackToTop!==false&&<button className="back-to-top" type="button" aria-label="Back to top" title="Back to top" onClick={() => scrollTo({top:0,behavior:"smooth"})}><span aria-hidden="true">↑</span></button>}</div></footer></div>}</>;
}
