import { usePage } from "../api/usePage.js";
import { usePublicSettings } from "./PublicExperience.jsx";

export default function Contact() {
  const page = usePage("contact", { title: "HAVE A VISION? LET’S MAKE IT REAL.", eyebrow: "06 / CONTACT", body: "AVAILABLE FOR SELECTED PROJECTS", ctaLabel: "START A PROJECT", ctaUrl: "mailto:hello@nourmastouri.com" });
  const settings = usePublicSettings(); const block = page.blocks?.find(item=>item.type==="contact")||page.blocks?.[0];
  const content = { title:page.title,eyebrow:page.eyebrow,body:page.body,ctaLabel:page.ctaLabel,ctaUrl:page.ctaUrl,...(block?.content||{}) };
  const titleMatch=String(content.title||"").replace(/\s+/g," ").match(/^(.*?\?)\s*(LET[’']?S MAKE)\s*(IT REAL\.?)$/i); const titleParts=titleMatch?.slice(1)||[content.title||"HAVE A VISION?","",""];
  const links=[{label:"LINKEDIN",url:settings?.profile?.linkedin||"https://www.linkedin.com/in/nour-mastouri"},{label:"BEHANCE",url:settings?.profile?.behance||"https://www.behance.net/nourmastouri"},{label:"INSTAGRAM",url:settings?.profile?.instagram||"https://www.instagram.com/nourmastouri"}].filter(item=>item.url);
  return <section className="contact section-pad" id="contact"><div className="contact__meta micro"><span>{content.eyebrow}</span><span>{content.body}</span></div><h2>{titleParts[0]}{titleParts[1]&&<><br/><em>{titleParts[1]}</em></>}{titleParts[2]&&<><br/>{titleParts[2]}</>}</h2><a className="contact__cta" href={content.ctaUrl||"mailto:hello@nourmastouri.com"}><span>{content.ctaLabel||"START A PROJECT"}</span><i>↗</i></a><div className="contact__links">{links.map(item=><a href={item.url} target="_blank" rel="noreferrer" key={item.label}>{item.label} ↗</a>)}</div></section>;
}
