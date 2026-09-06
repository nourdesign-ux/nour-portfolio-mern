import { mediaUrl } from "../api/client.js";
import { usePage } from "../api/usePage.js";

const defaults = { kicker: "01 / PROFILE", location: "TUNISIA → WORLDWIDE", eyebrow: "DESIGNER / ART DIRECTOR", title: "Ideas, shaped with intent.", image: "/assets/nour-mastouri.webp", imageAlt: "Nour Mastouri portrait", caption: "NOUR MASTOURI — 2026", years: "08+", yearsLabel: "YEARS OF EXPERIENCE", body: "Clear thinking.\nDistinctive design.\nNo noise.", availability: "AVAILABLE FOR SELECTED PROJECTS" };

export default function About() {
  const page = usePage("about", defaults);
  const block = page.blocks?.find(item => item.type === "about") || page.blocks?.[0];
  const content = { ...defaults, ...page, ...(block?.content || {}) };
  const titleParts = String(content.title).split(/,\s*|\s+with\s+/i);
  const yearsWords = String(content.yearsLabel).split(" "); const bodyLines = String(content.body).split("\n");
  return <section className="about about-modern section-pad" id="about"><div className="about-modern__top"><span className="micro">{content.kicker}</span><span className="micro">{content.location}</span></div><div className="about-modern__grid"><div className="about-modern__headline"><p className="micro">{content.eyebrow}</p><h2>{titleParts[0] || "Ideas"},<br/><em>{titleParts[1] || "shaped"}</em><br/>{titleParts[2] ? `with ${titleParts[2]}.` : "with intent."}</h2></div><figure className="about-modern__portrait"><img src={mediaUrl(content.image || page.heroImage || defaults.image)} alt={content.imageAlt}/><figcaption className="micro">{content.caption}</figcaption></figure><div className="about-modern__note"><div className="about-modern__years"><strong>{content.years}</strong><span>{yearsWords.map((part,index)=><span key={`${part}-${index}`}>{part}{index<yearsWords.length-1&&<br/>}</span>)}</span></div><p>{bodyLines.map((line,index)=><span key={`${line}-${index}`}>{line}{index<bodyLines.length-1&&<br/>}</span>)}</p><span className="about-modern__status"><i/> {content.availability}</span></div></div></section>;
}
