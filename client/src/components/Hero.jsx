import { useEffect, useState } from "react";
import { usePage } from "../api/usePage.js";
import { api, mediaUrl } from "../api/client.js";

const defaultFields = [
  { id:"name",type:"text",label:"Name",placeholder:"Your name",required:true }, { id:"email",type:"email",label:"Email",placeholder:"you@email.com",required:true },
  { id:"service",type:"select",label:"Service",placeholder:"Select",options:["Brand identity","Art direction","Packaging","Digital design","Other"] },
  { id:"budget",type:"select",label:"Budget",placeholder:"Your budget",options:["Under €1,000","€1,000 — €3,000","€3,000 — €5,000","Over €5,000"] },
  { id:"project",type:"textarea",label:"Your project",placeholder:"Tell me briefly about your project...",required:true }, { id:"submit",type:"submit",label:"SEND REQUEST ↗" }
];

export default function Hero({ previewPage, previewImage, editorMode = false, selectedElement = "", onElementSelect, onElementChange }) {
  const remotePage = usePage("home", { title: "Nour Mastouri", body: "I turn sharp ideas into bold, coherent brand worlds.", metaTitle: "" });
  const page = previewPage || remotePage;
  const heroBlock = page.blocks?.find(block => block.type === "hero");
  const content = { ...page, ...(heroBlock?.content || {}) };
  const [quoteForm, setQuoteForm] = useState({ slug:"devis", fields:defaultFields, settings:{ title:"Request a quote", subtitle:"LET'S WORK TOGETHER" } });
  const [formMessage, setFormMessage] = useState("");
  const visibility = page.editorSettings?.heroElements || {};
  const visible = name => visibility[name] !== false;
  const [firstName = "Nour", ...rest] = (content.title || "Nour Mastouri").trim().split(/\s+/);
  const lastName = rest.join(" ") || "Mastouri";
  const editorProps = name => editorMode ? { "data-editor-element": name, "data-editor-selected": selectedElement === name ? "true" : undefined, contentEditable: true, suppressContentEditableWarning: true, onClick: event => { event.preventDefault(); event.stopPropagation(); onElementSelect?.(name); }, onBlur: event => onElementChange?.(name, event.currentTarget.textContent) } : {};
  const requestQuote = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Quote request — ${data.get("service")}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nService: ${data.get("service")}\nBudget: ${data.get("budget")}\n\nProject:\n${data.get("project")}`);
    try { const result = await api(`/forms/${quoteForm.slug}/submit`, { method:"POST", body:JSON.stringify({ values:Object.fromEntries(data.entries()) }) }); setFormMessage(result.message || quoteForm.settings?.successMessage || "Merci, votre demande a été envoyée."); event.currentTarget.reset(); }
    catch (error) { setFormMessage(error.message || quoteForm.settings?.errorMessage || "Impossible d’envoyer le formulaire."); return; }
    window.location.href = `mailto:${content.formRecipient || "hello@nourmastouri.com"}?subject=${subject}&body=${body}`;
  };
  useEffect(() => { api("/forms/public/devis").then(setQuoteForm).catch(()=>{}); }, []);
  useEffect(() => { if (content.metaTitle) document.title = content.metaTitle; }, [content.metaTitle]);
  const stats = String(content.stats || "08|YEARS DESIGN\n25+|CLIENTS\n100+|PROJECTS").split("\n").map(item=>item.split("|"));
  return <section className="hero hero--reference" id="top" {...editorProps("hero") }>
    <div className="hero-ref__copy">
      {visible("title") && <h1 className="hero-ref__title" {...editorProps("title")}><span className="hero-ref__hello">Hello.</span><span className="hero-ref__name"><strong>I’m {firstName}</strong></span><span>{lastName}.</span></h1>}
      {visible("eyebrow") && <p className="hero-ref__role" {...editorProps("eyebrow")}>{content.eyebrow || "GRAPHIC DESIGNER / ART DIRECTOR"}</p>}{visible("body") && <p className="hero-ref__intro" {...editorProps("body")}>{content.body || "I turn sharp ideas into bold, coherent brand worlds."}</p>}
      {visible("cta") && <a className="hero-ref__pdf" {...editorProps("cta")} href={content.ctaUrl || "/assets/nour-mastouri-portfolio.pdf"} target={content.ctaTarget || "_blank"} rel="noreferrer">{content.ctaLabel || "VIEW / DOWNLOAD PDF"} ↗</a>}
      <div className="hero-ref__stats">{stats.map(([value,label],index)=><div key={`${value}-${index}`}><strong>{value}</strong><span>{String(label||"").split(" ").map((word,wordIndex)=><span key={`${word}-${wordIndex}`}>{word}{wordIndex<String(label||"").split(" ").length-1&&<br/>}</span>)}</span></div>)}</div>
    </div>
    {visible("image") && <div className="hero-ref__portrait" {...editorProps("image")}><img src={mediaUrl(previewImage || content.image || page.heroImage || "/assets/nour-hero-transparent.png")} alt={content.imageAlt || "Nour Mastouri"}/></div>}
    {visible("form") && <form className="hero-quote" {...editorProps("form")} onSubmit={requestQuote}>
      <div className="hero-quote__heading"><span>{quoteForm.settings?.subtitle || "LET'S WORK TOGETHER"}</span><strong>{quoteForm.settings?.title || quoteForm.name || "Request a quote"}</strong></div>
      <div className="hero-quote__grid">{quoteForm.fields.filter(field=>field.type!=="submit").map(field=><label className={field.type==="textarea"?"hero-quote__project":undefined} key={field.id}><span>{field.label}</span>{field.type==="textarea"?<textarea name={field.id} placeholder={field.placeholder||""} rows="2" required={field.required}/>:field.type==="select"?<select name={field.id} defaultValue="" required={field.required}><option value="" disabled>{field.placeholder||"Select"}</option>{(field.options||[]).map(option=><option key={option}>{option}</option>)}</select>:<input name={field.id} type={field.type||"text"} placeholder={field.placeholder||""} required={field.required}/>}</label>)}</div>
      <button type="submit">{quoteForm.fields.find(field=>field.type==="submit")?.label || "SEND REQUEST ↗"}</button>{formMessage&&<p role="status">{formMessage}</p>}
    </form>}
    <div className="hero-ref__experience"><span className="hero-ref__plus">+</span><strong>{content.experienceValue || "08"}</strong><span>{content.experienceLabel || <>years<br/>design</>}</span></div>
  </section>;
}
