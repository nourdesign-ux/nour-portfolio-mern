import { useEffect } from "react";
import { usePage } from "../api/usePage.js";

export default function Hero({ previewPage, previewImage, editorMode = false, selectedElement = "", onElementSelect, onElementChange }) {
  const remotePage = usePage("home", { title: "Nour Mastouri", body: "I turn sharp ideas into bold, coherent brand worlds.", metaTitle: "" });
  const page = previewPage || remotePage;
  const [firstName = "Nour", ...rest] = (page.title || "Nour Mastouri").trim().split(/\s+/);
  const lastName = rest.join(" ") || "Mastouri";
  const editorProps = name => editorMode ? { "data-editor-element": name, "data-editor-selected": selectedElement === name ? "true" : undefined, contentEditable: true, suppressContentEditableWarning: true, onClick: event => { event.preventDefault(); event.stopPropagation(); onElementSelect?.(name); }, onBlur: event => onElementChange?.(name, event.currentTarget.textContent) } : {};
  const requestQuote = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Quote request — ${data.get("service")}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nService: ${data.get("service")}\nBudget: ${data.get("budget")}\n\nProject:\n${data.get("project")}`);
    window.location.href = `mailto:hello@nourmastouri.com?subject=${subject}&body=${body}`;
  };
  useEffect(() => { if (page.metaTitle) document.title = page.metaTitle; }, [page.metaTitle]);
  return <section className="hero hero--reference" id="top" {...editorProps("hero") }>
    <div className="hero-ref__copy">
      <h1 className="hero-ref__title" {...editorProps("title")}><span className="hero-ref__hello">Hello.</span><span className="hero-ref__name"><strong>I’m {firstName}</strong></span><span>{lastName}.</span></h1>
      <p className="hero-ref__role" {...editorProps("eyebrow")}>{page.eyebrow || "GRAPHIC DESIGNER / ART DIRECTOR"}</p><p className="hero-ref__intro" {...editorProps("body")}>{page.body || "I turn sharp ideas into bold, coherent brand worlds."}</p>
      <a className="hero-ref__pdf" {...editorProps("cta")} href={page.ctaUrl || "/assets/nour-mastouri-portfolio.pdf"} target="_blank" rel="noreferrer">{page.ctaLabel || "VIEW / DOWNLOAD PDF"} ↗</a>
      <div className="hero-ref__stats"><div><strong>08</strong><span>YEARS<br />DESIGN</span></div><div><strong>25+</strong><span>CLIENTS</span></div><div><strong>100+</strong><span>PROJECTS</span></div></div>
    </div>
    <div className="hero-ref__portrait" {...editorProps("image")}><img src={previewImage || "/assets/nour-hero-transparent.png"} alt="Nour Mastouri" /></div>
    <form className="hero-quote" {...editorProps("form")} onSubmit={requestQuote}>
      <div className="hero-quote__heading"><span>LET'S WORK TOGETHER</span><strong>Request a quote</strong></div>
      <div className="hero-quote__grid">
        <label><span>Name</span><input name="name" type="text" placeholder="Your name" required /></label>
        <label><span>Email</span><input name="email" type="email" placeholder="you@email.com" required /></label>
        <label><span>Service</span><select name="service" defaultValue=""><option value="" disabled>Select</option><option>Brand identity</option><option>Art direction</option><option>Packaging</option><option>Digital design</option><option>Other</option></select></label>
        <label><span>Budget</span><select name="budget" defaultValue=""><option value="" disabled>Your budget</option><option>Under €1,000</option><option>€1,000 — €3,000</option><option>€3,000 — €5,000</option><option>Over €5,000</option></select></label>
        <label className="hero-quote__project"><span>Your project</span><textarea name="project" placeholder="Tell me briefly about your project..." rows="2" required /></label>
      </div>
      <button type="submit">SEND REQUEST ↗</button>
    </form>
    <div className="hero-ref__experience"><span className="hero-ref__plus">+</span><strong>08</strong><span>years<br />design</span></div>
  </section>;
}
