import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { EmptyState, Icon, Modal, SkeletonRows } from "./AdminUI.jsx";
import { formatDate } from "./adminUtils.js";

export default function PagesView({ search, notify, onCountsChange }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/pages");
      setPages(data);
      onCountsChange?.({ pages: data.length });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => pages.filter(page =>
    `${page.key} ${page.title} ${page.body}`.toLowerCase().includes(search.toLowerCase())
  ), [pages, search]);

  return <>
    <div className="view-heading">
      <div><span className="admin-kicker">CONTENT / PAGES</span><h1>Pages</h1><p>Uniquement les sections déjà présentes dans le portfolio.</p></div>
    </div>
    <section className="cms-card data-panel">
      <div className="panel-heading"><div><b>Sections existantes</b><span>{filtered.length} section{filtered.length > 1 ? "s" : ""}</span></div></div>
      {loading ? <SkeletonRows/> : error ? <EmptyState icon="warning" title="Impossible de charger les pages" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : filtered.length === 0 ?
        <EmptyState icon="pages" title={search ? "Aucun résultat" : "Aucune page existante"} text={search ? "Essayez une autre recherche." : "Aucun enregistrement Page n’est disponible. Le CMS n’en crée pas automatiquement."}/>
        : <div className="data-table page-table">
          <div className="data-row data-head"><span>Section</span><span>Contenu</span><span>Modifié</span><span aria-label="Actions"/></div>
          {filtered.map(page => <div className="data-row" key={page._id}>
            <button className="page-cell" onClick={() => setEditor(page)}><span className="page-key">{page.key.slice(0,2).toUpperCase()}</span><span><b>{page.title || page.key}</b><small>Clé verrouillée : {page.key}</small></span></button>
            <p>{page.body || "Aucun texte"}</p>
            <span>{formatDate(page.updatedAt)}</span>
            <button className="icon-button" title="Modifier" onClick={() => setEditor(page)}><Icon name="edit"/></button>
          </div>)}
        </div>}
    </section>
    {editor && <PageEditor page={editor} notify={notify} onClose={() => setEditor(null)} onSaved={saved => setPages(current => current.map(page => page._id === saved._id ? saved : page))}/>}
  </>;
}

function PageEditor({ page, notify, onClose, onSaved }) {
  const [form, setForm] = useState(page);
  const [state, setState] = useState("saved");
  const firstRender = useRef(true);
  const latestSave = useRef(0);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    setState("pending");
    const saveNumber = ++latestSave.current;
    const timer = window.setTimeout(async () => {
      setState("saving");
      try {
        const saved = await api(`/pages/${page.key}`, { method: "PUT", body: JSON.stringify(form) });
        if (saveNumber === latestSave.current) {
          setState("saved");
          onSaved(saved);
        }
      } catch (requestError) {
        setState("error");
        notify(requestError.message, "error");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [form]);

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const previewAnchor = page.key === "home" ? "top" : page.key;

  return <Modal title={form.title || page.key} eyebrow={`PAGE / ${page.key.toUpperCase()}`} onClose={onClose} wide>
    <div className="autosave-bar" aria-live="polite">
      <span className={`save-dot ${state}`}/>
      {state === "saved" && "Toutes les modifications sont enregistrées"}
      {state === "pending" && "Modifications non enregistrées — sauvegarde automatique…"}
      {state === "saving" && "Sauvegarde…"}
      {state === "error" && "Échec de la sauvegarde"}
    </div>
    <div className="page-editor">
      <div className="editor-main">
        <section className="form-section">
          <div className="field full"><label>Clé système</label><input value={page.key} disabled/><small>La clé reste verrouillée pour préserver la structure du site.</small></div>
          <div className="field full"><label htmlFor="page-title">Titre</label><input id="page-title" value={form.title} onChange={event => update("title", event.target.value)} autoFocus/></div>
          <div className="field full"><label htmlFor="page-eyebrow">Eyebrow</label><input id="page-eyebrow" value={form.eyebrow} onChange={event => update("eyebrow", event.target.value)}/></div>
          <div className="field full"><label htmlFor="page-body">Contenu</label><textarea id="page-body" rows="9" value={form.body} onChange={event => update("body", event.target.value)}/></div>
        </section>
        <section className="form-section">
          <div className="section-title"><span>Call to action existant</span></div>
          <div className="field"><label htmlFor="page-cta-label">Libellé</label><input id="page-cta-label" value={form.ctaLabel} onChange={event => update("ctaLabel", event.target.value)}/></div>
          <div className="field"><label htmlFor="page-cta-url">URL</label><input id="page-cta-url" value={form.ctaUrl} onChange={event => update("ctaUrl", event.target.value)}/></div>
        </section>
        <section className="form-section">
          <div className="section-title"><span>SEO existant</span><small>Champs du modèle Page</small></div>
          <div className="field full"><label htmlFor="page-meta-title">Meta title</label><input id="page-meta-title" value={form.metaTitle} onChange={event => update("metaTitle", event.target.value)}/><small>{form.metaTitle.length}/60 caractères</small></div>
          <div className="field full"><label htmlFor="page-meta-description">Meta description</label><textarea id="page-meta-description" rows="4" value={form.metaDescription} onChange={event => update("metaDescription", event.target.value)}/><small>{form.metaDescription.length}/160 caractères</small></div>
        </section>
      </div>
      <aside className="editor-side"><div className="publish-card"><b>Preview</b><p>Ouvre la section correspondante du site public, sans modifier son design.</p><a className="button secondary" href={`/#${previewAnchor}`} target="_blank" rel="noreferrer"><Icon name="external"/> Voir la section</a></div></aside>
    </div>
  </Modal>;
}
