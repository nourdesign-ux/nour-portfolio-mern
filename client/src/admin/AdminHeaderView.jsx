import { useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import { Icon, EmptyState, SkeletonRows } from "./AdminUI.jsx";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import { LanguageProvider } from "../context/LanguageContext.jsx";

const defaults = { title: "Nour Mastouri", eyebrow: "GRAPHIC DESIGNER / ART DIRECTOR", body: "I turn sharp ideas into bold, coherent brand worlds.", ctaLabel: "VIEW / DOWNLOAD PDF", ctaUrl: "/assets/nour-mastouri-portfolio.pdf", heroImage: "/assets/nour-hero-transparent.png" };

export default function AdminHeaderView({ notify }) {
  const [form, setForm] = useState(defaults);
  const [mode, setMode] = useState("visual");
  const [language, setLanguage] = useState("en");
  const [themeMode, setThemeMode] = useState("light");
  const [selectedElement, setSelectedElement] = useState("title");
  const [elements, setElements] = useState({ header: true, logo: true, menu: true, eyebrow: true, title: true, body: true, cta: true, image: true, form: true });
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  useEffect(() => { Promise.all([api("/pages/home"), api("/media")]).then(([page, mediaData]) => { setForm(current => ({ ...current, ...page, heroImage: page.heroImage || current.heroImage })); setMedia(mediaData); }).catch(error => notify(error.message, "error")).finally(() => setLoading(false)); }, []);
  const update = (key, value) => { setSaveState("pending"); setForm(current => ({ ...current, [key]: value })); };
  const updateElement = (key, value) => update(key, key === "title" ? value.replace(/^Hello\.\s*I’m\s*/i, "").replace(/\.$/, "").trim() : value);
  async function save(showNotice = true) { setSaving(true); setSaveState("saving"); try { const saved = await api("/pages/home", { method: "PUT", body: JSON.stringify(form) }); setForm(current => ({ ...current, ...saved })); setSaveState("saved"); if (showNotice) notify("Hero enregistré"); } catch (error) { setSaveState("error"); notify(error.message, "error"); } finally { setSaving(false); } }
  useEffect(() => { if (loading || saveState !== "pending") return undefined; const timer = window.setTimeout(() => void save(false), 1200); return () => window.clearTimeout(timer); }, [form, loading, saveState]);
  if (loading) return <SkeletonRows count={5}/>;
  return <div className="header-editor-screen">
    <header className="header-editor-toolbar"><div><span className="admin-kicker">GLOBAL / HEADER & HERO</span><h1>Hero Editor</h1><p>Classic ou Visual, avec aperçu réel de la composition Hero.</p></div><div className="header-editor-actions"><span className={`editor-status ${saveState}`}><i/> {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Unsaved changes"}</span><button className="button primary" onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button></div></header>
    <div className="header-editor-modes"><button className={mode === "classic" ? "active" : ""} onClick={() => setMode("classic")}><Icon name="edit"/> Classic Editor</button><button className={mode === "visual" ? "active" : ""} onClick={() => setMode("visual")}><Icon name="builder"/> Visual Editor</button></div>
    <div className="hero-preview-controls"><div className="preview-control-group"><span>Language</span>{["en", "fr", "ar"].map(value => <button className={language === value ? "active" : ""} key={value} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}</div><div className="preview-control-group"><span>Canvas</span><button className="active">Desktop 1440px</button></div><div className="preview-control-group"><span>Mode</span>{[["light", "Light"], ["dark", "Dark"]].map(([value, label]) => <button className={themeMode === value ? "active" : ""} key={value} onClick={() => setThemeMode(value)}>{label}</button>)}</div></div>
    {mode === "classic" ? <ClassicHero form={form} update={update} media={media} viewport="desktop" language={language} themeMode={themeMode}/> : <VisualHero form={form} update={update} updateElement={updateElement} media={media} elements={elements} setElements={setElements} selectedElement={selectedElement} setSelectedElement={setSelectedElement} viewport="desktop" language={language} themeMode={themeMode}/ >}
  </div>;
}

function ClassicHero({ form, update, media, viewport, language, themeMode }) {
  return <section className="classic-hero-editor"><div className="classic-hero-fields"><div className="editor-section-label">Existing Hero fields</div>{[["eyebrow", "Eyebrow"], ["title", "Title"], ["body", "Introduction"], ["ctaLabel", "Button label"], ["ctaUrl", "Button URL"]].map(([key, label]) => <label className="field" key={key}><span>{label}</span>{key === "body" ? <textarea rows="5" value={form[key]} onChange={event => update(key, event.target.value)}/> : <input value={form[key]} onChange={event => update(key, event.target.value)}/>}</label>)}<label className="field"><span>Existing Hero image</span><select value={form.heroImage} onChange={event => update("heroImage", event.target.value)}><option value="/assets/nour-hero-transparent.png">Default Hero image</option>{media.map(item => <option value={item.url} key={item._id}>{item.title || item.originalName}</option>)}</select></label></div><ProductionHeroPreview form={form} viewport={viewport} language={language}/></section>;
}

function VisualHero({ form, update, updateElement, media, elements, setElements, selectedElement, setSelectedElement, viewport, language, themeMode }) {
  const remove = key => setElements(current => ({ ...current, [key]: false }));
  const restore = key => setElements(current => ({ ...current, [key]: true }));
  const elementNames = { header: "Header", logo: "Logo", menu: "Menu", eyebrow: "Eyebrow", title: "Heading", body: "Paragraph", cta: "Button", image: "Hero image", form: "Quote form" };
  const addElement = key => { setElements(current => ({ ...current, [key]: true })); setSelectedElement(key); };
  const dropElement = event => { event.preventDefault(); const key = event.dataTransfer.getData("text/plain"); if (elementNames[key]) addElement(key); };
  return <section className="visual-hero-editor"><aside className="hero-elements-panel"><div className="editor-section-label">Elements library</div>{Object.keys(elementNames).map(key => <button className="hero-library-item" key={key} draggable onDragStart={event => event.dataTransfer.setData("text/plain", key)} onClick={() => addElement(key)}><Icon name={key === "image" ? "media" : key === "header" || key === "menu" ? "pages" : "plus"}/><span>{elementNames[key]}</span><small>+</small></button>)}<div className="editor-section-label hero-section-label">Layers</div>{Object.entries(elements).map(([key, visible]) => <div className={`hero-element-row ${visible ? "visible" : "hidden"} ${selectedElement === key ? "selected" : ""}`} key={key} onClick={() => setSelectedElement(key)}><span>⠿</span><b>{elementNames[key]}</b>{visible ? <button className="icon-button" title="Supprimer du canvas" onClick={event => { event.stopPropagation(); remove(key); }}><Icon name="trash"/></button> : <button className="button tiny-button" onClick={() => restore(key)}>Ajouter</button>}</div>)}<div className="editor-section-label hero-section-label">Replace image</div><select className="hero-media-select" value={form.heroImage} onChange={event => update("heroImage", event.target.value)}><option value="/assets/nour-hero-transparent.png">Default Hero image</option>{media.map(item => <option value={item.url} key={item._id}>{item.title || item.originalName}</option>)}</select></aside><div className="hero-canvas-wrap" onDragOver={event => event.preventDefault()} onDrop={dropElement}><div className="inline-canvas-label">LIVE HERO CANVAS · PRODUCTION COMPONENT · DROP ELEMENT HERE</div><ProductionHeroPreview form={form} elements={elements} selectedElement={selectedElement} setSelectedElement={setSelectedElement} onElementChange={updateElement} viewport={viewport} language={language}/></div><aside className="hero-inspector"><div className="editor-section-label">Selected: {elementNames[selectedElement]}</div>{selectedElement === "title" && <label className="field"><span>Title live</span><input value={form.title} onChange={event => update("title", event.target.value)}/></label>}{selectedElement === "body" && <label className="field"><span>Text live</span><textarea rows="6" value={form.body} onChange={event => update("body", event.target.value)}/></label>}{selectedElement === "eyebrow" && <label className="field"><span>Eyebrow live</span><input value={form.eyebrow} onChange={event => update("eyebrow", event.target.value)}/></label>}{selectedElement === "cta" && <><label className="field"><span>CTA label</span><input value={form.ctaLabel} onChange={event => update("ctaLabel", event.target.value)}/></label><label className="field"><span>CTA URL</span><input value={form.ctaUrl} onChange={event => update("ctaUrl", event.target.value)}/></label></>}{["header", "logo", "menu", "image", "form"].includes(selectedElement) && <p className="inspector-note">Cet élément utilise le composant réel du site. Ses réglages structurels restent protégés pour préserver le design.</p>}</aside></section>;
}

function ProductionHeroPreview({ form, elements, selectedElement, setSelectedElement, onElementChange, viewport, language }) {
  const page = { ...form, title: elements?.title === false ? "" : form.title, eyebrow: elements?.eyebrow === false ? "" : form.eyebrow, body: elements?.body === false ? "" : form.body, ctaLabel: elements?.cta === false ? "" : form.ctaLabel };
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  const referenceWidth = 1440;
  const referenceHeight = 900;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const updateScale = () => setScale(Math.min(1, frame.clientWidth / referenceWidth));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return <div ref={frameRef} className="scaled-editor-canvas" style={{ height: `${referenceHeight * scale}px` }}><div className="fixed-desktop-viewport" style={{ width: `${referenceWidth}px`, height: `${referenceHeight}px`, transform: `scale(${scale})` }}><LanguageProvider initialLanguage={language}><Header editorMode selectedElement={selectedElement} onElementSelect={setSelectedElement}/><Hero editorMode previewPage={page} previewImage={elements?.image === false ? "" : form.heroImage} selectedElement={selectedElement} onElementSelect={setSelectedElement} onElementChange={onElementChange}/></LanguageProvider></div></div>;
}

function HeroCanvas({ form, elements = { eyebrow: true, title: true, body: true, cta: true, image: true }, update, viewport = "desktop", language = "en", themeMode = "light" }) {
  const [firstName = "Nour", ...rest] = (form.title || "Nour Mastouri").trim().split(/\s+/);
  return <div className={`admin-hero-canvas hero-view-${viewport} hero-mode-${themeMode}`} dir={language === "ar" ? "rtl" : "ltr"}><div className="admin-hero-copy"><div className="hero-site-mark">NOUR MASTOURI <small>CREATIVE PORTFOLIO</small></div>{elements.eyebrow && <span className="hero-live-eyebrow" contentEditable suppressContentEditableWarning onBlur={event => update?.("eyebrow", event.currentTarget.textContent)}>{form.eyebrow}</span>}{elements.title && <h2 contentEditable suppressContentEditableWarning onBlur={event => update?.("title", event.currentTarget.textContent)}><small>Hello.</small>{firstName}<br/>{rest.join(" ")}.</h2>}{elements.body && <p contentEditable suppressContentEditableWarning onBlur={event => update?.("body", event.currentTarget.textContent)}>{form.body}</p>}{elements.cta && <a href={form.ctaUrl} onClick={event => event.preventDefault()}>{form.ctaLabel} ↗</a>}</div>{elements.image && <img src={mediaUrl(form.heroImage)} alt="Hero preview"/>}<span className="hero-view-label">{viewport.toUpperCase()} · {language.toUpperCase()}</span></div>;
}