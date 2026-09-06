import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { ConfirmModal, EmptyState, Icon, SkeletonRows, StatusBadge } from "./AdminUI.jsx";
import RichTextEditor from "./RichTextEditor.jsx";
import UniversalVisualEditor from "./UniversalVisualEditor.jsx";
import { confirmAction } from "./confirmAction.js";
import { ActionMenu, ActionMenuButton, ActionMenuLink, ContentFilterBar, ContentIdentity, ContentPageHeader, ContentPagination, ContentRow, ContentTable, useContentPagination } from "./ContentManagementUI.jsx";
import { formatDate } from "./adminUtils.js";

export default function SectionsView({ search, notify, onCountsChange }) {
  const [page, setPage] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [mode, setMode] = useState("classic");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const editing = page?.blocks?.find(block => block.id === editingId) || null;

  const load = () => api("/pages/one-page").then(data => {
    setPage(data);
    onCountsChange?.({ sections: data.blocks?.length || 0 });
  }).catch(error => notify(error.message, "error"));
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!dirty || !editingId || saving || saveError) return undefined;
    const timer = window.setTimeout(() => void save(), 1200);
    return () => window.clearTimeout(timer);
  }, [page, dirty, editingId, saving, saveError]);

  const allSections = page?.blocks || [];
  const sections = useMemo(() => allSections.filter(block => {
    const matchesSearch = `${block.label} ${block.type}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "published" && block.visible !== false) || (statusFilter === "draft" && block.visible === false) || (statusFilter === "global" && !!block.globalId) || (statusFilter === "local" && !block.globalId);
    return matchesSearch && matchesStatus;
  }), [page, search, statusFilter]);
  const pagination = useContentPagination(sections);
  const remember = current => { if (current) setHistory(items => [...items.slice(-29), structuredClone(current)]); setFuture([]); };
  const updateBlock = next => { remember(editing); setSaveError(false); setDirty(true); setPage(current => ({ ...current, blocks: current.blocks.map(block => block.id === next.id ? next : block) })); };
  const updatePage = next => { remember(editing); setSaveError(false); setDirty(true); setPage(next); };
  const undo = () => setHistory(items => {
    if (!items.length || !editing) return items;
    const previous = items.at(-1);
    setFuture(next => [structuredClone(editing), ...next].slice(0, 30));
    setPage(current => ({ ...current, blocks: current.blocks.map(block => block.id === previous.id ? previous : block) }));
    setDirty(true);
    return items.slice(0, -1);
  });
  const redo = () => setFuture(items => {
    if (!items.length || !editing) return items;
    const next = items[0];
    setHistory(previous => [...previous.slice(-29), structuredClone(editing)]);
    setPage(current => ({ ...current, blocks: current.blocks.map(block => block.id === next.id ? next : block) }));
    setDirty(true);
    return items.slice(1);
  });

  async function save() {
    setSaving(true);
    try { const saved = await api("/pages/one-page", { method: "PUT", body: JSON.stringify(page) }); setPage(saved); setDirty(false); setSaveError(false); notify("Section enregistrée"); }
    catch (error) { setSaveError(true); notify(error.message, "error"); }
    finally { setSaving(false); }
  }
  const create = () => {
    const block = { id: `section-${Date.now()}`, type: "blank", label: "Nouvelle section", sourcePageKey: "home", visible: true, content: { title: "Nouveau titre", body: "Nouveau contenu" }, settings: {}, children: [], translations: {}, sortOrder: page.blocks.length };
    setPage(current => ({ ...current, blocks: [...current.blocks, block] }));
    setDirty(true); setMode("classic"); setEditingId(block.id); setHistory([]); setFuture([]);
  };
  async function duplicate(block) {
    const copy = structuredClone(block); copy.id = `${block.id}-copy-${Date.now()}`; copy.label = `${block.label} (copie)`; copy.globalId = "";
    const index = page.blocks.findIndex(item => item.id === block.id) + 1;
    const next = { ...page, blocks: [...page.blocks.slice(0, index), copy, ...page.blocks.slice(index)].map((item, order) => ({ ...item, sortOrder: order })) };
    try { setPage(await api("/pages/one-page", { method: "PUT", body: JSON.stringify(next) })); notify("Section dupliquée"); }
    catch (error) { notify(error.message, "error"); }
  }
  async function remove(block) {
    if (["header", "footer"].includes(block.type)) return notify("Cette section globale est protégée", "error");
    try { setPage(await api("/pages/one-page", { method: "PUT", body: JSON.stringify({ ...page, blocks: page.blocks.filter(item => item.id !== block.id) }) })); notify("Section supprimée"); }
    catch (error) { notify(error.message, "error"); }
  }
  async function reusable(block) {
    try { await api("/saved-blocks", { method: "POST", body: JSON.stringify({ name: block.label, scope: "saved", block }) }); notify("Section enregistrée dans la bibliothèque"); }
    catch (error) { notify(error.message, "error"); }
  }
  const open = (block, editorMode) => { setEditingId(block.id); setMode(editorMode); setHistory([]); setFuture([]); };
  const close = async () => {
    if (dirty && !await confirmAction({ title: "Abandonner les modifications ?", message: "Les changements non enregistrés de cette section seront perdus.", confirmLabel: "Quitter sans enregistrer" })) return;
    setEditingId(""); setDirty(false); setHistory([]); setFuture([]); void load();
  };

  if (!page) return <SkeletonRows/>;
  if (editing) return <SectionEditor page={page} block={editing} mode={mode} setMode={setMode} update={updateBlock} updatePage={updatePage} save={save} saving={saving} dirty={dirty} saveError={saveError} notify={notify} history={history} future={future} undo={undo} redo={redo} close={close}/>;
  const columns = [{ label: "Section", width: "minmax(250px,1.2fr)" }, { label: "Type", width: "110px" }, { label: "Portée", width: "100px" }, { label: "Statut", width: "105px" }, { label: "Modifiée", width: "120px" }, { label: "", width: "54px" }];
  return <div className="admin-view content-management-view">
    <ContentPageHeader eyebrow="CONTENT / ONE PAGE" title="Sections" description="Gérez les sections de la Home Page avec le même workflow que les Pages." action={<button className="button primary" onClick={create}><Icon name="plus"/> Ajouter une section</button>}/>
    <ContentFilterBar value={statusFilter} onChange={setStatusFilter} count={sections.length} filters={[{ value: "all", label: "Toutes", count: allSections.length }, { value: "published", label: "Publiées", count: allSections.filter(item => item.visible !== false).length }, { value: "draft", label: "Brouillons", count: allSections.filter(item => item.visible === false).length }, { value: "global", label: "Globales", count: allSections.filter(item => item.globalId).length }, { value: "local", label: "Locales", count: allSections.filter(item => !item.globalId).length }]}/>
    <section className="cms-card data-panel"><div className="panel-heading"><div><b>Sections de la Home Page</b><span>Cliquez sur le nom pour ouvrir les informations de la section.</span></div><span className="panel-count">{sections.length} résultat(s)</span></div>
      {!sections.length ? <EmptyState icon="pages" title={search || statusFilter !== "all" ? "Aucune section trouvée" : "Aucune section"} text={search || statusFilter !== "all" ? "Modifiez la recherche ou les filtres." : "Créez votre première section."} action={!search && statusFilter === "all" ? <button className="button primary" onClick={create}>Ajouter une section</button> : null}/> : <><ContentTable columns={columns} className="sections-content-table">{pagination.paginated.map(block => <ContentRow columns={columns} key={block.id}>
        <ContentIdentity title={block.label} meta={block.content?.title || block.content?.body || "Aucun contenu"} initials={block.type.slice(0,2).toUpperCase()} onClick={() => open(block, "classic")}/>
        <span>{block.type}</span><StatusBadge status={block.globalId ? "global" : "local"}/><StatusBadge status={block.visible === false ? "draft" : "published"}/><time>{formatDate(page.updatedAt)}</time>
        <ActionMenu label={`Actions pour ${block.label}`}><ActionMenuButton icon="edit" onClick={() => open(block, "classic")}>Informations</ActionMenuButton><ActionMenuButton icon="builder" onClick={() => open(block, "visual")}>Éditeur visuel</ActionMenuButton><ActionMenuLink icon="external" href={`/#${block.sourcePageKey === "home" ? block.id : block.sourcePageKey || block.id}`} target="_blank" rel="noreferrer">Prévisualiser</ActionMenuLink><ActionMenuButton icon="restore" onClick={() => void duplicate(block)}>Dupliquer</ActionMenuButton><ActionMenuButton icon="archive" onClick={() => void reusable(block)}>Enregistrer comme bloc</ActionMenuButton>{!["header", "footer"].includes(block.type) && <ActionMenuButton icon="trash" danger onClick={() => setDeleting(block)}>Supprimer</ActionMenuButton>}</ActionMenu>
      </ContentRow>)}</ContentTable><ContentPagination page={pagination.page} pageCount={pagination.pageCount} onChange={pagination.setPage}/></>}
    </section>
    {deleting && <ConfirmModal title="Supprimer la section ?" message={`« ${deleting.label} » sera retirée de la Home Page. Cette action est enregistrée immédiatement et ne peut pas être annulée.`} confirmLabel="Supprimer" onClose={() => setDeleting(null)} onConfirm={async () => { await remove(deleting); setDeleting(null); }}/>} 
  </div>;
}

function SectionEditor({ page, block, mode, setMode, update, updatePage, save, saving, dirty, saveError, close, notify, history, future, undo, redo }) {
  const content = block.content || {};
  const translations = block.translations || {};
  const setContent = (key, value) => update({ ...block, content: { ...content, [key]: value } });
  const setTranslation = (language, key, value) => update({ ...block, translations: { ...translations, [language]: { ...(translations[language] || {}), [key]: value } } });
  const visualState = saveError ? "error" : saving ? "saving" : dirty ? "pending" : "saved";
  if (mode === "visual") return <div className="section-editor-screen visual-editor-screen"><header className="page-editor-header visual-editor-header"><button className="button secondary" onClick={() => setMode("classic")}><Icon name="arrow-left"/> Retour aux informations de la section</button><div><span className="admin-kicker">VISUAL EDITOR / SECTION</span><h1>{block.label}</h1></div><button className="button primary" onClick={() => void save()} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer"}</button></header><UniversalVisualEditor page={page} pages={[page]} context="section" focusBlockId={block.id} onChange={updatePage} notify={notify} saveState={visualState} lastModified={page.updatedAt} onBack={() => setMode("classic")}/></div>;
  return <div className="admin-view pages-view page-information-view section-information-view">
    <nav className="page-information-nav" aria-label="Navigation de la section"><button onClick={() => void close()}><Icon name="arrow-left"/> Sections</button><span>/</span><b>{block.label}</b><em className={`page-state ${block.visible === false ? "draft" : "published"}`}>{block.visible === false ? "Masquée" : "Visible"}</em></nav>
    <div className="view-heading page-information-heading"><div><span className="admin-kicker">CONTENT / SECTION INFORMATION</span><h1>{block.label}</h1><p>Gérez le contenu, la visibilité, les traductions et la portée. Le canvas visuel reste accessible comme outil de second niveau.</p></div><div className="mini-actions"><button className="button secondary" onClick={() => void save()} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer"}</button><button className="button primary" onClick={() => setMode("visual")}><Icon name="builder"/> Ouvrir le Visual Editor</button></div></div>
    <section className="page-overview-grid page-editor-summary" aria-label="Résumé de la section"><article><span>Statut</span><strong className="summary-word">{block.visible === false ? "Masquée" : "Visible"}</strong><small>{dirty ? "Modifications en attente" : "Toutes les modifications sont enregistrées"}</small></article><article><span>Type</span><strong className="summary-word">{block.type || "Section"}</strong><small>{block.globalId ? "Composant global" : "Section locale"}</small></article><article><span>Langues</span><strong>03</strong><small>English · Français · العربية</small></article></section>
    <div className="information-toolbar"><div><span className="admin-kicker">CLASSIC EDITOR</span><b>Contenu et informations de la section</b></div><div><button className="history-button" onClick={undo} disabled={!history.length}>Undo</button><button className="history-button" onClick={redo} disabled={!future.length}>Redo</button></div></div>
    <div className="page-editor"><main className="editor-main">
      <section className="form-section information-section"><div className="section-title"><span>Contenu principal</span><small>Champs réellement utilisés par cette section</small></div><label className="field full"><span>Nom interne</span><input value={block.label} onChange={event => update({ ...block, label: event.target.value })}/></label>{Object.entries(content).map(([key, value]) => typeof value === "number" ? <label className="field" key={key}><span>{key}</span><input type="number" value={value} onChange={event => setContent(key, Number(event.target.value))}/></label> : typeof value === "boolean" ? <label className="switch-field" key={key}><input type="checkbox" checked={value} onChange={event => setContent(key, event.target.checked)}/><span/><b>{key}</b></label> : Array.isArray(value) ? <label className="field full" key={key}><span>{key}</span><textarea rows="5" value={value.join("\n")} onChange={event => setContent(key, event.target.value.split("\n").filter(Boolean))}/><small>Une valeur par ligne</small></label> : key === "body" ? <div className="field full" key={key}><RichTextEditor value={value || ""} onChange={next => setContent(key, next)} label="Contenu riche"/></div> : <label className={`field ${["title", "image", "ctaUrl"].includes(key) ? "full" : ""}`} key={key}><span>{key}</span><input value={value ?? ""} onChange={event => setContent(key, event.target.value)}/></label>)}</section>
      <section className="form-section information-section"><div className="section-title"><span>Traductions</span><small>English · Français · العربية</small></div><div className="section-translation-fields">{[["en", "English"], ["fr", "Français"], ["ar", "العربية"]].map(([language, label]) => <fieldset dir={language === "ar" ? "rtl" : "ltr"} key={language}><legend>{label}</legend><label>Titre<input value={translations[language]?.title || ""} onChange={event => setTranslation(language, "title", event.target.value)}/></label><label>Texte<textarea rows="5" value={translations[language]?.body || ""} onChange={event => setTranslation(language, "body", event.target.value)}/></label><label>CTA<input value={translations[language]?.ctaLabel || ""} onChange={event => setTranslation(language, "ctaLabel", event.target.value)}/></label></fieldset>)}</div></section>
    </main><aside className="editor-side"><div className="publish-card"><div className="publish-state"><span className={`state-dot ${block.visible === false ? "draft" : "published"}`}/><div><b>{block.visible === false ? "Section masquée" : "Section visible"}</b><small>{saveError ? "Échec de la sauvegarde" : saving ? "Sauvegarde…" : dirty ? "Modifications non enregistrées" : "Enregistré"}</small></div></div><label className="switch-field"><input type="checkbox" checked={block.visible !== false} onChange={event => update({ ...block, visible: event.target.checked })}/><span/><b>Visible sur le site</b><small>Masquez sans supprimer la section</small></label><div className="information-meta"><span>Portée</span><b>{block.globalId ? "Globale" : "Locale"}</b><span>Utilisée dans</span><b>{block.sourcePageKey || "home"}</b><span>Dernière modification</span><b>{page.updatedAt ? new Date(page.updatedAt).toLocaleString("fr-FR") : "—"}</b></div><a className="button secondary" href={`/#${block.sourcePageKey === "home" ? block.id : block.sourcePageKey || block.id}`} target="_blank" rel="noreferrer"><Icon name="external"/> Prévisualiser</a><button className="button primary wide-action" onClick={() => setMode("visual")}><Icon name="builder"/> Ouvrir le Visual Editor</button></div><div className="publish-card revision-card"><b>Historique des modifications</b><div className="information-history-actions"><button onClick={undo} disabled={!history.length}>Undo</button><button onClick={redo} disabled={!future.length}>Redo</button></div><small>{history.length} modification(s) disponible(s) · {future.length} rétablissement(s)</small></div></aside></div>
  </div>;
}
