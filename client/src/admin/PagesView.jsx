import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { ConfirmModal, EmptyState, Icon, Modal, SkeletonRows, StatusBadge } from "./AdminUI.jsx";
import { formatDate } from "./adminUtils.js";
import UniversalVisualEditor from "./UniversalVisualEditor.jsx";
import RichTextEditor from "./RichTextEditor.jsx";

export default function PagesView({ search, notify, onCountsChange }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [onePage, allPages] = await Promise.all([api("/pages/one-page"), api("/pages")]);
      const customPages = allPages.filter(item => !["home", "about", "work", "expertise", "contact"].includes(item.key));
      setPages([onePage, ...customPages]);
      onCountsChange?.({ pages: 1 + customPages.length });
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

  if (editor) return <PageEditor key={editor.page._id} page={editor.page} pages={pages} initialMode={editor.mode} notify={notify} onClose={() => setEditor(null)} onSwitch={async key => { const target = pages.find(page => page.key === key); if (target) setEditor({ page: target, mode: "visual" }); }} onSaved={saved => { setPages(current => current.map(page => page._id === saved._id ? saved : page)); setEditor(current => ({ ...current, page: saved })); }}/ >;

  const publishedCount = pages.filter(page => (page.status || "published") === "published").length;
  const sectionCount = pages.reduce((total, page) => total + (page.blocks?.length || 0), 0);

  return <div className="admin-view pages-view">
      <div className="view-heading">
      <div><span className="admin-kicker">CONTENT / ONE PAGE</span><h1>Home Page</h1><p>Votre site One Page complet. Les sections et blocs se gèrent à l’intérieur.</p></div>
      <div className="mini-actions"><button className="button secondary" onClick={async () => { try { const result = await api("/pages/sync-site", { method: "POST" }); notify(`${result.updated} sections importées depuis le site`); await load(); } catch (requestError) { notify(requestError.message, "error"); } }}><Icon name="restore"/> Synchroniser</button><button className="button primary" onClick={() => setCreating(true)}><Icon name="plus"/> Ajouter une page</button></div>
    </div>
    <section className="page-overview-grid" aria-label="Résumé des pages">
      <article><span>Pages</span><strong>{pages.length}</strong><small>dans le CMS</small></article>
      <article><span>Publiées</span><strong>{publishedCount}</strong><small>{pages.length - publishedCount} brouillon(s)</small></article>
      <article><span>Sections</span><strong>{sectionCount}</strong><small>structure totale</small></article>
    </section>
    <section className="cms-card data-panel">
      <div className="panel-heading"><div><b>Pages du CMS</b><span>Cliquez sur une page pour ouvrir ses informations et son Classic Editor.</span></div><span className="panel-count">{filtered.length} résultat(s)</span></div>
      {loading ? <SkeletonRows/> : error ? <EmptyState icon="warning" title="Impossible de charger les pages" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : filtered.length === 0 ?
        <EmptyState icon="pages" title={search ? "Aucun résultat" : "Aucune page existante"} text={search ? "Essayez une autre recherche." : "Aucun enregistrement Page n’est disponible. Le CMS n’en crée pas automatiquement."}/>
        : <div className="data-table page-table">
          <div className="data-row data-head"><span>Page</span><span>Résumé</span><span>Modifiée</span><span aria-label="Actions"/></div>
          {filtered.map(page => <div className="data-row" key={page._id}>
            <button className="page-cell" onClick={() => setEditor({ page, mode: "classic" })}><span className="page-key">{page.key.slice(0,2).toUpperCase()}</span><span><b>{page.title || page.key}</b><small>/{page.key} · {page.blocks?.length || 0} section(s)</small><StatusBadge status={page.status || "published"}/></span></button>
            <p>{(page.body || page.blocks?.find(block => block.content?.body)?.content?.body || "Aucun contenu").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</p>
            <span>{formatDate(page.updatedAt)}</span>
            <div className="row-actions page-actions"><button className="icon-button" title="Ouvrir les informations" onClick={() => setEditor({ page, mode: "classic" })}><Icon name="edit"/></button><a className="icon-button" title="Prévisualiser" href={`/#${page.key === "home" ? "top" : page.key}`} target="_blank" rel="noreferrer"><Icon name="external"/></a>{page._id !== "one-page" && <button className="icon-button" title="Supprimer" onClick={() => setDeleting(page)}><Icon name="trash"/></button>}</div>
          </div>)}
        </div>}
    </section>
    {creating && <NewPageModal
      onClose={() => setCreating(false)}
      onCreate={async value => { try { const saved = await api("/pages", { method: "POST", body: JSON.stringify(value) }); setCreating(false); await load(); setEditor({ page: saved, mode: "classic" }); notify("Page créée"); } catch (requestError) { notify(requestError.message, "error"); } }}
    />}
    {deleting && <ConfirmModal
      title="Supprimer la page ?"
      message={`La page « ${deleting.title} » sera placée dans la corbeille.`}
      onClose={() => setDeleting(null)}
      onConfirm={async () => { try { await api(`/pages/${deleting.key}`, { method: "DELETE" }); setDeleting(null); await load(); notify("Page supprimée"); } catch (requestError) { notify(requestError.message, "error"); } }}
    />}
  </div>;
}

function NewPageModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: "", key: "", status: "draft", blocks: [] });
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  return <Modal title="Ajouter une page" eyebrow="CONTENT / NEW PAGE" onClose={onClose}><div className="form-section"><label className="field full"><span>Titre</span><input autoFocus value={form.title} onChange={event => { const title = event.target.value; setForm(current => ({ ...current, title, key: current.key || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }}/></label><label className="field full"><span>Slug</span><input value={form.key} onChange={event => update("key", event.target.value)}/></label><label className="field"><span>Statut</span><select value={form.status} onChange={event => update("status", event.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option></select></label><label className="field"><span>Structure</span><select onChange={event => update("blocks", event.target.value === "starter" ? [{ id: `hero-${Date.now()}`, type: "hero", label: "Hero", content: { title: form.title || "Nouveau titre", body: "Nouveau contenu" }, visible: true, sortOrder: 0 }] : [])}><option value="blank">Page vide</option><option value="starter">Hero de départ</option></select></label></div><footer className="modal-actions"><button className="button secondary" onClick={onClose}>Annuler</button><button className="button primary" disabled={!form.title || !form.key} onClick={() => void onCreate(form)}>Créer et modifier</button></footer></Modal>;
}

function PageEditor({ page, pages, initialMode = "classic", notify, onClose, onSaved, onSwitch }) {
  const [form, setForm] = useState(page);
  const [editorMode, setEditorMode] = useState(initialMode);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [media, setMedia] = useState([]);
  const [state, setState] = useState("saved");
  const firstRender = useRef(true);
  const latestSave = useRef(0);
  const skipAutosave = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  const persist = async (value = formRef.current) => {
    const saveNumber = ++latestSave.current;
    setState("saving");
    try {
      const endpoint = page._id === "one-page" ? "/pages/one-page" : `/pages/${page.key}`;
      const saved = await api(endpoint, { method: "PUT", body: JSON.stringify(value) });
      if (saveNumber === latestSave.current) {
        setState("saved");
        skipAutosave.current = true;
        setForm(saved);
        onSaved(saved);
      }
      return true;
    } catch (requestError) {
      setState("error");
      notify(requestError.message, "error");
      return false;
    }
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return undefined;
    }
    setState("pending");
    const saveNumber = ++latestSave.current;
    const timer = window.setTimeout(async () => {
      if (saveNumber === latestSave.current) await persist(form);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [form]);

  useEffect(() => {
    if (state === "saved" && page._id !== "one-page") api(`/pages/${page.key}/revisions`).then(setRevisions).catch(() => setRevisions([]));
  }, [page.key, state]);
  useEffect(() => { api("/media").then(setMedia).catch(() => setMedia([])); }, []);
  useEffect(() => { const warn = event => { if (["pending", "saving", "error"].includes(state)) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [state]);

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
  const primaryBlock = form._id === "one-page" ? form.blocks?.find(block => (block.sourcePageKey || "home") === "home" && !["header", "ticker", "projects", "footer"].includes(block.type)) : null;
  const editableContent = primaryBlock?.content || form;
  const update = (field, value) => changeForm(current => {
    if (current._id !== "one-page" || !["title", "eyebrow", "body", "ctaLabel", "ctaUrl", "heroImage"].includes(field)) return { ...current, [field]: value };
    const contentField = field === "heroImage" ? "image" : field;
    return { ...current, blocks: (current.blocks || []).map(block => block.id === primaryBlock?.id ? { ...block, content: { ...(block.content || {}), [contentField]: value } } : block) };
  });
  const previewAnchor = page.key === "home" ? "top" : page.key;
  const seoScore = Math.round([form.metaTitle, form.metaDescription, form.canonicalUrl, form.socialImage].filter(value => String(value || "").trim()).length / 4 * 100);
  const pageStatusLabel = form.status === "draft" ? "Brouillon" : form.status === "scheduled" ? "Planifiée" : "Publiée";
  const switchPage = async key => {
    if (state !== "saved") {
      const saved = await persist();
      if (!saved) return;
    }
    await onSwitch(key);
  };

  if (editorMode === "visual") return <div className="admin-view pages-view page-visual-view">
    <nav className="page-information-nav" aria-label="Navigation du Visual Editor"><button onClick={async () => { if (state !== "saved" && !await persist()) return; setEditorMode("classic"); }}><Icon name="arrow-left"/> Informations de la page</button><span>/</span><b>{form.title || page.key}</b><em className={`editor-save-pill ${state}`}>{state === "saved" ? "Enregistré" : state === "saving" ? "Sauvegarde…" : state === "error" ? "Erreur" : "Non enregistré"}</em></nav>
    <div className="view-heading page-information-heading page-visual-heading"><div><span className="admin-kicker">CONTENT / VISUAL EDITOR</span><h1>Visual Editor</h1><p>{form.title || page.key} · Sélectionnez un bloc dans le canvas pour modifier son contenu, son style ou ses options avancées.</p></div><div className="mini-actions"><button className="button secondary" onClick={() => setEditorMode("classic")}><Icon name="edit"/> Classic Editor</button><button className="button primary" onClick={() => void persist()} disabled={state === "saving"}>{state === "saving" ? "Sauvegarde…" : "Enregistrer"}</button></div></div>
    <section className="visual-workspace-shell" aria-label="Canvas de la page"><UniversalVisualEditor page={form} pages={pages} onChange={changeForm} onSwitch={switchPage} notify={notify} saveState={state} lastModified={form.updatedAt} onBack={() => setEditorMode("classic")}/></section>
  </div>;

  return <div className="admin-view pages-view page-information-view">
    <nav className="page-information-nav" aria-label="Navigation de l’éditeur"><button onClick={async () => { if (state === "pending" || state === "error") { const saved = await persist(); if (!saved) return; } onClose(); }}><Icon name="arrow-left"/> Pages</button><span>/</span><b>{form.title || page.key}</b><em className={`page-state ${form.status || "published"}`}>{pageStatusLabel}</em></nav>
    <div className="view-heading page-information-heading"><div><span className="admin-kicker">CONTENT / PAGE INFORMATION</span><h1>{form.title || page.key}</h1><p>Gérez le contenu, la publication et le référencement. Le canvas visuel reste accessible comme outil de second niveau.</p></div><div className="mini-actions"><button className="button secondary" onClick={() => void persist()} disabled={state === "saving"}>{state === "saving" ? "Sauvegarde…" : "Enregistrer"}</button><button className="button primary" onClick={() => setEditorMode("visual")}><Icon name="builder"/> Ouvrir le Visual Editor</button></div></div>
    <section className="page-overview-grid page-editor-summary" aria-label="Résumé de la page"><article><span>Statut</span><strong className="summary-word">{pageStatusLabel}</strong><small>{state === "saved" ? "Toutes les modifications sont enregistrées" : state === "saving" ? "Sauvegarde en cours" : state === "error" ? "Échec de sauvegarde" : "Modifications en attente"}</small></article><article><span>Structure</span><strong>{form.blocks?.length || 0}</strong><small>section(s) dans la page</small></article><article><span>SEO</span><strong>{seoScore}%</strong><small>{seoScore === 100 ? "Métadonnées complètes" : "Informations à compléter"}</small></article></section>
    <div className="information-toolbar"><div><span className="admin-kicker">CLASSIC EDITOR</span><b>Contenu et informations globales</b></div><div><button className="history-button" title="Annuler" onClick={undo} disabled={!history.length}>Undo</button><button className="history-button" title="Rétablir" onClick={redo} disabled={!future.length}>Redo</button></div></div>
    <div className="page-editor">
      <div className="editor-main">
        {editorMode === "visual" ? <UniversalVisualEditor page={form} pages={pages} onChange={changeForm} onSwitch={switchPage} notify={notify}/> : <>
        <section className="form-section information-section">
          <div className="section-title"><span>Informations principales</span><small>Identité et contenu éditorial de la page</small></div>
          <div className="field full"><label>Clé système</label><input value={page.key} disabled/><small>La clé reste verrouillée pour préserver la structure du site.</small></div>
          <div className="field full"><label htmlFor="page-title">Titre principal</label><input id="page-title" value={editableContent.title || ""} onChange={event => update("title", event.target.value)} autoFocus/></div>
          <div className="field full"><label htmlFor="page-eyebrow">Eyebrow</label><input id="page-eyebrow" value={editableContent.eyebrow || ""} onChange={event => update("eyebrow", event.target.value)}/></div>
          <div className="field full"><RichTextEditor value={editableContent.body || ""} onChange={value => update("body", value)} media={media} onPickMedia={url => update("heroImage", url)} label="Contenu principal"/></div>
        </section>
        </>}
        <section className="form-section information-section">
          <div className="section-title"><span>Call to action</span><small>Libellé et destination du bouton principal</small></div>
          <div className="field"><label htmlFor="page-cta-label">Libellé</label><input id="page-cta-label" value={editableContent.ctaLabel || ""} onChange={event => update("ctaLabel", event.target.value)}/></div>
          <div className="field"><label htmlFor="page-cta-url">URL</label><input id="page-cta-url" value={editableContent.ctaUrl || ""} onChange={event => update("ctaUrl", event.target.value)}/></div>
        </section>
        <section className="form-section information-section">
          <div className="section-title"><span>Référencement SEO</span><small>Métadonnées propres à cette page</small></div>
          <div className="field full"><label htmlFor="page-meta-title">Meta title</label><input id="page-meta-title" value={form.metaTitle || ""} onChange={event => update("metaTitle", event.target.value)}/><small>{(form.metaTitle || "").length}/60 caractères</small></div>
          <div className="field full"><label htmlFor="page-meta-description">Meta description</label><textarea id="page-meta-description" rows="4" value={form.metaDescription || ""} onChange={event => update("metaDescription", event.target.value)}/><small>{(form.metaDescription || "").length}/160 caractères</small></div>
          <div className="field full"><label htmlFor="page-canonical">URL canonique</label><input id="page-canonical" type="url" value={form.canonicalUrl || ""} onChange={event => update("canonicalUrl", event.target.value)} placeholder="https://example.com/page"/></div>
          <div className="field full"><label htmlFor="page-social-image">Image sociale</label><input id="page-social-image" value={form.socialImage || ""} onChange={event => update("socialImage", event.target.value)} placeholder="/uploads/social.webp"/></div>
          <div className="field full"><label htmlFor="page-robots">Robots</label><select id="page-robots" value={form.robots || "index,follow"} onChange={event => update("robots", event.target.value)}><option value="index,follow">Index, follow</option><option value="noindex,follow">Noindex, follow</option><option value="noindex,nofollow">Noindex, nofollow</option></select></div>
        </section>
      </div>
      <aside className="editor-side"><div className="publish-card"><div className="publish-state"><span className={`state-dot ${form.status || "published"}`}/><div><b>{form.status === "draft" ? "Brouillon" : form.status === "scheduled" ? "Planifiée" : "Publiée"}</b><small>{state === "saved" ? "Enregistré" : state === "saving" ? "Sauvegarde…" : state === "error" ? "Échec de la sauvegarde" : "Modifications non enregistrées"}</small></div></div><div className="field"><label htmlFor="page-status">Statut</label><select id="page-status" value={form.status || "published"} onChange={event => update("status", event.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="scheduled">Planifié</option></select></div>{form.status === "scheduled" && <div className="field"><label htmlFor="page-scheduled">Date de publication</label><input id="page-scheduled" type="datetime-local" value={form.scheduledAt ? new Date(form.scheduledAt).toISOString().slice(0, 16) : ""} onChange={event => update("scheduledAt", event.target.value)}/></div>}<div className="information-meta"><span>Dernière modification</span><b>{formatDate(form.updatedAt)}</b><span>Visibilité</span><b>{form.status === "draft" ? "Privée / brouillon" : "Publique"}</b></div><a className="button secondary" href={`/#${previewAnchor}`} target="_blank" rel="noreferrer"><Icon name="external"/> Prévisualiser</a><button className="button primary wide-action" onClick={() => setEditorMode("visual")}><Icon name="builder"/> Ouvrir le Visual Editor</button></div><div className="publish-card revision-card"><b>Historique des révisions</b>{revisions.length ? revisions.slice(0, 6).map(revision => <button className="revision-row" key={revision._id} onClick={() => void restoreRevision(revision)}><span>{formatDate(revision.savedAt)}</span><small>Restaurer</small></button>) : <small>Aucune révision enregistrée.</small>}</div></aside>
    </div>
  </div>;
}

function InlineVisualEditor({ page, onChange }) {
  const [selectedId, setSelectedId] = useState(page.blocks?.[0]?.id || null);
  const [draggingId, setDraggingId] = useState(null);
  const [viewport, setViewport] = useState("desktop");
  const blocks = [...(page.blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = blocks.find(block => block.id === selectedId);
  const updateBlocks = nextBlocks => onChange({ ...page, blocks: nextBlocks.map((block, index) => ({ ...block, sortOrder: index })) });
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
  const addBlock = type => {
    const id = `${page.key}-${type}-${Date.now()}`;
    const labels = { hero: "Hero", about: "À propos", text: "Texte", projects: "Projets", expertise: "Expertise", quote: "Citation", contact: "Contact" };
    const content = type === "projects" ? { title: "Selected Work", limit: 6 } : { title: labels[type], body: "Nouveau contenu" };
    updateBlocks([...blocks, { id, type, label: labels[type], content, settings: {}, visible: true, sortOrder: blocks.length }]);
    setSelectedId(id);
  };
  const duplicate = id => {
    const source = blocks.find(block => block.id === id);
    if (!source) return;
    const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, label: `${source.label} (copie)`, content: { ...source.content }, settings: { ...source.settings } };
    const index = blocks.findIndex(block => block.id === id);
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    updateBlocks(next);
    setSelectedId(copy.id);
  };
  const remove = id => {
    const next = blocks.filter(block => block.id !== id);
    updateBlocks(next);
    setSelectedId(next[0]?.id || null);
  };
  return <div className="inline-visual-editor">
    <aside className="inline-visual-layers"><div className="inline-panel-title"><b>Structure</b><small>{blocks.length} blocs</small></div><label className="field"><span>Ajouter un bloc</span><select value="" onChange={event => { if (event.target.value) addBlock(event.target.value); }}><option value="">Choisir…</option>{["hero", "about", "text", "projects", "expertise", "quote", "contact"].map(type => <option key={type} value={type}>{type}</option>)}</select></label><div className="layer-group"><span className="layer-group-label">Blocs de la page</span>{blocks.map(block => <button className={selectedId === block.id ? "active" : ""} key={block.id} onClick={() => setSelectedId(block.id)}><span>↳</span><b>{block.label}</b><small>{block.visible === false ? "Masqué" : `#${block.sortOrder + 1}`}</small></button>)}</div></aside>
    <div className={`inline-visual-canvas canvas-${viewport}`}><div className="inline-canvas-toolbar"><span className="inline-canvas-label">LIVE PAGE CANVAS</span><div role="group" aria-label="Taille de prévisualisation">{["desktop", "tablet", "mobile"].map(size => <button key={size} className={viewport === size ? "active" : ""} onClick={() => setViewport(size)}>{size}</button>)}</div></div>{blocks.length ? blocks.map(block => <InlineBlock key={block.id} block={block} selected={selectedId === block.id} dragging={draggingId === block.id} onSelect={() => setSelectedId(block.id)} onDragStart={() => setDraggingId(block.id)} onDrop={fromId => move(fromId, block.id)} onDragEnd={() => setDraggingId(null)} />) : <EmptyState icon="pages" title="Aucune section" text="Ajoutez un bloc depuis le panneau Structure."/>}</div>
    <aside className="inline-visual-inspector">{selected ? <><div className="inline-panel-title"><b>{selected.label}</b><small>Section sélectionnée</small></div><label className="field"><span>Nom du bloc</span><input value={selected.label} onChange={event => updateBlock(selected.id, { label: event.target.value })}/></label><label className="visibility-toggle"><input type="checkbox" checked={selected.visible !== false} onChange={event => updateBlock(selected.id, { visible: event.target.checked })}/><span>Visible sur le site</span></label>{Object.entries(selected.content || {}).map(([key, value]) => <label className="field" key={key}><span>{key}</span>{typeof value === "number" ? <input type="number" min="0" value={value} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: Number(event.target.value) } })}/> : key === "body" || key === "items" ? <textarea rows="5" value={value ?? ""} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: event.target.value } })}/> : <input value={value ?? ""} onChange={event => updateBlock(selected.id, { content: { ...selected.content, [key]: event.target.value } })}/>}</label>)}<div className="block-actions"><button className="button secondary" onClick={() => duplicate(selected.id)}>Dupliquer</button><button className="button danger" onClick={() => remove(selected.id)}>Supprimer</button></div></> : <div className="inspector-empty"><Icon name="edit"/><b>Sélectionnez une section</b></div>}</aside>
  </div>;
}

function InlineBlock({ block, selected, dragging, onSelect, onDragStart, onDrop, onDragEnd }) {
  const content = block.content || {};
  return <article className={`inline-visual-block block-${block.type} ${selected ? "selected" : ""} ${dragging ? "dragging" : ""} ${block.visible === false ? "is-hidden" : ""}`} draggable onClick={onSelect} onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", block.id); onDragStart(); }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); onDrop(event.dataTransfer.getData("text/plain")); }} onDragEnd={onDragEnd}><header><span>⠿</span><b>{block.label}</b><small>{block.visible === false ? "Masqué" : ["header", "menu", "footer"].includes(block.type) ? "Global" : "Section"}</small></header><div><span className="preview-kicker">{block.type.toUpperCase()}</span><h3>{content.title || content.logo || content.eyebrow || content.text || block.label}</h3><p>{content.body || content.items || content.emphasis || content.ctaLabel || "Section content"}</p></div></article>;
}
