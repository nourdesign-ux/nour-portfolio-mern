import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { EmptyState, Icon, SkeletonRows } from "./AdminUI.jsx";
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

  if (editor) return <PageEditor page={editor} notify={notify} onClose={() => setEditor(null)} onSaved={saved => { setPages(current => current.map(page => page._id === saved._id ? saved : page)); setEditor(saved); }}/ >;

  return <>
      <div className="view-heading">
      <div><span className="admin-kicker">CONTENT / PAGES</span><h1>Pages</h1><p>Uniquement les sections déjà présentes dans le portfolio.</p></div>
      <button className="button secondary" onClick={async () => { try { const result = await api("/pages/sync-site", { method: "POST" }); notify(`${result.updated} sections importées depuis le site`); await load(); } catch (requestError) { notify(requestError.message, "error"); } }}><Icon name="restore"/> Importer le contenu du site</button>
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
            <div className="row-actions"><button className="icon-button" title="Modifier la page" onClick={() => setEditor(page)}><Icon name="edit"/></button></div>
          </div>)}
        </div>}
    </section>
  </>;
}

function PageEditor({ page, notify, onClose, onSaved }) {
  const [form, setForm] = useState(page);
  const [editorMode, setEditorMode] = useState("classic");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [revisions, setRevisions] = useState([]);
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

  useEffect(() => {
    api(`/pages/${page.key}/revisions`).then(setRevisions).catch(() => setRevisions([]));
  }, [page.key, state]);

  async function restoreRevision(revision) {
    try {
      const restored = await api(`/pages/${page.key}/revisions/${revision._id}/restore`, { method: "POST" });
      setForm(restored);
      setRevisions(restored.revisions || []);
      onSaved(restored);
      notify("Révision restaurée");
    } catch (requestError) { notify(requestError.message, "error"); }
  }

  const changeForm = updater => setForm(current => {
    const next = typeof updater === "function" ? updater(current) : updater;
    if (JSON.stringify(next) === JSON.stringify(current)) return current;
    setHistory(items => [...items.slice(-29), current]);
    setFuture([]);
    return next;
  });
  const undo = () => setHistory(items => { if (!items.length) return items; const previous = items[items.length - 1]; setFuture(itemsFuture => [form, ...itemsFuture].slice(0, 30)); setForm(previous); return items.slice(0, -1); });
  const redo = () => setFuture(items => { if (!items.length) return items; const next = items[0]; setHistory(itemsHistory => [...itemsHistory.slice(-29), form]); setForm(next); return items.slice(1); });
  const update = (field, value) => changeForm(current => ({ ...current, [field]: value }));
  const previewAnchor = page.key === "home" ? "top" : page.key;

  return <div className="page-editor-screen">
    <header className="page-editor-header"><button className="button secondary" onClick={onClose}><Icon name="arrow-left"/> Retour aux Pages</button><div><span className="admin-kicker">PAGE / {page.key.toUpperCase()}</span><h1>{form.title || page.key}</h1></div><div className="page-editor-header-actions"><span className={`editor-status ${state}`}><i/>{state === "saved" ? "Enregistré" : state === "saving" ? "Sauvegarde…" : "Non enregistré"}</span><button className="button primary" onClick={() => setEditorMode(editorMode === "classic" ? "visual" : "classic")}><Icon name={editorMode === "classic" ? "builder" : "edit"}/> {editorMode === "classic" ? "Visual Editor" : "Classic Editor"}</button></div></header>
    <div className="editor-mode-switch"><div><span className="admin-kicker">EDITING MODE</span><b>{form.title || page.key}</b></div><div><button className="history-button" title="Undo" onClick={undo} disabled={!history.length}>Undo</button><button className="history-button" title="Redo" onClick={redo} disabled={!future.length}>Redo</button><button className={editorMode === "classic" ? "active" : ""} onClick={() => setEditorMode("classic")}><Icon name="edit"/> Classic Editor</button><button className={editorMode === "visual" ? "active" : ""} onClick={() => setEditorMode("visual")}><Icon name="builder"/> Visual Editor</button></div></div>
    <div className="autosave-bar" aria-live="polite">
      <span className={`save-dot ${state}`}/>
      {state === "saved" && "Toutes les modifications sont enregistrées"}
      {state === "pending" && "Modifications non enregistrées — sauvegarde automatique…"}
      {state === "saving" && "Sauvegarde…"}
      {state === "error" && "Échec de la sauvegarde"}
    </div>
    <div className="page-editor">
      <div className="editor-main">
        {editorMode === "visual" ? <InlineVisualEditor page={form} onChange={changeForm}/> : <>
        <section className="form-section">
          <div className="field full"><label>Clé système</label><input value={page.key} disabled/><small>La clé reste verrouillée pour préserver la structure du site.</small></div>
          <div className="field full"><label htmlFor="page-title">Titre</label><input id="page-title" value={form.title} onChange={event => update("title", event.target.value)} autoFocus/></div>
          <div className="field full"><label htmlFor="page-eyebrow">Eyebrow</label><input id="page-eyebrow" value={form.eyebrow} onChange={event => update("eyebrow", event.target.value)}/></div>
          <div className="field full"><label htmlFor="page-body">Contenu</label><textarea id="page-body" rows="9" value={form.body} onChange={event => update("body", event.target.value)}/></div>
        </section>
        </>}
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
      <aside className="editor-side"><div className="publish-card"><div className="publish-state"><span className={`state-dot ${form.status || "published"}`}/><div><b>{form.status === "draft" ? "Brouillon" : form.status === "scheduled" ? "Planifiée" : "Publiée"}</b><small>{state === "saved" ? "Dernière version enregistrée" : "Modifications en cours"}</small></div></div><div className="field"><label htmlFor="page-status">Statut</label><select id="page-status" value={form.status || "published"} onChange={event => update("status", event.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="scheduled">Planifié</option></select></div>{form.status === "scheduled" && <div className="field"><label htmlFor="page-scheduled">Date de publication</label><input id="page-scheduled" type="datetime-local" value={form.scheduledAt ? new Date(form.scheduledAt).toISOString().slice(0, 16) : ""} onChange={event => update("scheduledAt", event.target.value)}/></div>}<b>Preview</b><p>Ouvre la section correspondante du site public, sans modifier son design.</p><a className="button secondary" href={`/#${previewAnchor}`} target="_blank" rel="noreferrer"><Icon name="external"/> Voir la section</a></div><div className="publish-card revision-card"><b>Historique des révisions</b>{revisions.length ? revisions.slice(0, 6).map(revision => <button className="revision-row" key={revision._id} onClick={() => void restoreRevision(revision)}><span>{formatDate(revision.savedAt)}</span><small>Restaurer</small></button>) : <small>Aucune révision enregistrée.</small>}</div></aside>
    </div>
  </div>;
}

function InlineVisualEditor({ page, onChange }) {
  const [selectedId, setSelectedId] = useState(page.blocks?.[0]?.id || null);
  const [draggingId, setDraggingId] = useState(null);
  const blocks = [...(page.blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = blocks.find(block => block.id === selectedId);
  const updateBlocks = blocks => onChange({ ...page, blocks: blocks.map((block, index) => ({ ...block, sortOrder: index })) });
  const updateBlock = (id, patch) => updateBlocks(blocks.map(block => block.id === id ? { ...block, ...patch } : block));
  const move = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const next = [...blocks];
    const from = next.findIndex(block => block.id === fromId);
    const to = next.findIndex(block => block.id === toId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateBlocks(next);
  };
  return <div className="inline-visual-editor">
    <aside className="inline-visual-layers"><div className="inline-panel-title"><b>Page Navigator</b><small>{blocks.length} blocs de cette page</small></div><div className="layer-group"><span className="layer-group-label">Blocs de la page</span>{blocks.map(block => <button className={selectedId === block.id ? "active" : ""} key={block.id} onClick={() => setSelectedId(block.id)}><span>↳</span><b>{block.label}</b><small>#{block.sortOrder + 1}</small></button>)}</div></aside>
    <div className="inline-visual-canvas"><div className="inline-canvas-label">LIVE PAGE CANVAS</div>{blocks.length ? blocks.map(block => <InlineBlock key={block.id} block={block} selected={selectedId === block.id} dragging={draggingId === block.id} onSelect={() => setSelectedId(block.id)} onDragStart={() => setDraggingId(block.id)} onDragOver={fromId => move(fromId, block.id)} onDragEnd={() => setDraggingId(null)} />) : <EmptyState icon="pages" title="Aucune section" text="Cette page ne contient pas encore de section."/>}</div>
    <aside className="inline-visual-inspector">{selected ? <><div className="inline-panel-title"><b>{selected.label}</b><small>Section sélectionnée</small></div>{Object.entries(selected.content || {}).map(([key, value]) => <label className="field" key={key}><span>{key}</span>{typeof value === "number" ? <input type="number" value={value} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: Number(event.target.value) } })}/> : key === "body" || key === "items" ? <textarea rows="5" value={value} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: event.target.value } })}/> : <input value={value} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: event.target.value } })}/>}</label>)}</> : <div className="inspector-empty"><Icon name="edit"/><b>Sélectionnez une section</b></div>}</aside>
  </div>;
}

function InlineBlock({ block, selected, dragging, onSelect, onDragStart, onDragOver, onDragEnd }) {
  const content = block.content || {};
  return <article className={`inline-visual-block block-${block.type} ${selected ? "selected" : ""} ${dragging ? "dragging" : ""}`} draggable onClick={onSelect} onDragStart={event => { event.dataTransfer.setData("text/plain", block.id); onDragStart(); }} onDragOver={event => { event.preventDefault(); onDragOver(event.dataTransfer.getData("text/plain")); }} onDragEnd={onDragEnd}><header><span>⠿</span><b>{block.label}</b><small>{["header", "menu", "footer"].includes(block.type) ? "Global" : "Section"}</small></header><div><span className="preview-kicker">{block.type.toUpperCase()}</span><h3>{content.title || content.logo || content.eyebrow || content.text || block.label}</h3><p>{content.body || content.items || content.emphasis || content.ctaLabel || "Section content"}</p></div></article>;
}
