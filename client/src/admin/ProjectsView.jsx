import { useEffect, useMemo, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import { ConfirmModal, EmptyState, Icon, Modal, SkeletonRows, StatusBadge } from "./AdminUI.jsx";
import { emptyProject, formatDate, slugify } from "./adminUtils.js";

function normalizeProject(project = emptyProject) {
  return {
    ...emptyProject,
    ...project,
    services: project.services || [],
    images: project.images || []
  };
}

export default function ProjectsView({ search, notify, onCountsChange }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState(null);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api(status === "trash" ? "/projects?trash=1" : "/projects?all=1");
      setProjects(data);
      setSelected([]);
      onCountsChange?.({ projects: data.length });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  const filtered = useMemo(() => projects.filter(project => {
    const matchesSearch = `${project.title} ${project.slug} ${project.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || status === "trash" || project.status === status;
    return matchesSearch && matchesStatus;
  }), [projects, search, status]);

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(item => item._id));
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  async function runBulk(action) {
    if (!selected.length) return;
    setBusy(true);
    try {
      if (action === "delete") await Promise.all(selected.map(id => api(`/projects/${id}`, { method: "DELETE" })));
      else await Promise.all(selected.map(id => api(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: action })
      })));
      notify(action === "delete" ? "Projets déplacés dans la corbeille" : `Statut mis à jour : ${action === "published" ? "publié" : "brouillon"}`);
      setConfirm(null);
      await load();
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(project) {
    setBusy(true);
    try {
      await api(`/projects/${project._id}`, { method: "DELETE" });
      notify(`“${project.title}” déplacé dans la corbeille`);
      setConfirm(null);
      await load();
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function restore(project) {
    try {
      await api(`/projects/${project._id}/restore`, { method: "POST" });
      notify(`“${project.title}” restauré`);
      await load();
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  }

  return <>
    <div className="view-heading">
      <div><span className="admin-kicker">CONTENT / PROJECTS</span><h1>Projects</h1><p>Gérez les projets qui alimentent directement Selected Work.</p></div>
      {status !== "trash" && <button className="button primary" onClick={() => setEditor(normalizeProject())}><Icon name="plus"/> Nouveau projet</button>}
    </div>

    <div className="toolbar cms-card">
      <div className="filter-tabs" aria-label="Filtrer les projets">
        {[{id:"all",label:"Tous"},{id:"published",label:"Publiés"},{id:"draft",label:"Brouillons"},{id:"trash",label:"Corbeille"}].map(item =>
          <button key={item.id} className={status === item.id ? "active" : ""} onClick={() => setStatus(item.id)}>{item.label}</button>
        )}
      </div>
      {selected.length > 0 && status !== "trash" && <div className="bulk-actions">
        <b>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</b>
        <button onClick={() => void runBulk("published")}>Publier</button>
        <button onClick={() => void runBulk("draft")}>Brouillon</button>
        <button className="danger-link" onClick={() => setConfirm({ bulk: true })}>Supprimer</button>
      </div>}
      <span className="result-count">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
    </div>

    <section className="cms-card data-panel">
      {loading ? <SkeletonRows/> : error ? <EmptyState icon="warning" title="Impossible de charger les projets" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : filtered.length === 0 ?
        <EmptyState title={search ? "Aucun résultat" : status === "trash" ? "Corbeille vide" : "Aucun projet"} text={search ? "Essayez une autre recherche." : "Les projets existants apparaîtront ici."}/>
        : <div className="data-table project-table">
          <div className="data-row data-head">
            <label className="table-check"><input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll}/><span/></label>
            <span>Projet</span><span>Statut</span><span>Ordre</span><span>Modifié</span><span aria-label="Actions"/>
          </div>
          {filtered.map(project => <div className="data-row" key={project._id}>
            <label className="table-check"><input type="checkbox" checked={selected.includes(project._id)} onChange={() => toggle(project._id)}/><span/></label>
            <button className="project-cell" onClick={() => status !== "trash" && setEditor(normalizeProject(project))}>
              <div className="project-thumb">{project.cover ? <img src={mediaUrl(project.cover)} alt=""/> : project.title.slice(0, 2).toUpperCase()}</div>
              <span><b>{project.title}</b><small>/{project.slug} · {project.category || "Sans catégorie"} · {project.year}</small></span>
            </button>
            <StatusBadge status={project.status}/>
            <span className="mono">{project.sortOrder}</span>
            <span>{formatDate(project.updatedAt)}</span>
            <div className="row-actions">
              {status === "trash" ? <button className="icon-button" title="Restaurer" onClick={() => void restore(project)}><Icon name="restore"/></button> : <>
                <button className="icon-button" title="Modifier" onClick={() => setEditor(normalizeProject(project))}><Icon name="edit"/></button>
                <button className="icon-button danger-icon" title="Supprimer" onClick={() => setConfirm({ project })}><Icon name="trash"/></button>
              </>}
            </div>
          </div>)}
        </div>}
    </section>

    {editor && <ProjectEditor project={editor} notify={notify} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await load(); }}/>}
    {confirm?.project && <ConfirmModal title="Supprimer le projet ?" message={`“${confirm.project.title}” sera déplacé dans la corbeille et retiré du site public.`} confirmLabel="Déplacer dans la corbeille" busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void remove(confirm.project)}/>}
    {confirm?.bulk && <ConfirmModal title="Supprimer la sélection ?" message={`${selected.length} projet${selected.length > 1 ? "s seront déplacés" : " sera déplacé"} dans la corbeille.`} confirmLabel="Supprimer" busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void runBulk("delete")}/>}
  </>;
}

function ProjectEditor({ project, notify, onClose, onSaved }) {
  const isNew = !project._id;
  const [form, setForm] = useState(project);
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(isNew);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  useEffect(() => {
    const loadMedia = async () => {
      try { setMedia(await api("/media")); } catch { setMedia([]); }
    };
    void loadMedia();
  }, []);

  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setDirty(true);
  };

  const updateTitle = value => {
    setForm(current => ({ ...current, title: value, slug: slugTouched ? current.slug : slugify(value) }));
    setDirty(true);
  };

  async function save(event, forcedStatus) {
    event?.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, status: forcedStatus || form.status };
      const saved = await api(isNew ? "/projects" : `/projects/${project._id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(payload)
      });
      setDirty(false);
      notify(forcedStatus === "published" ? "Projet publié" : isNew ? "Brouillon créé" : "Modifications enregistrées");
      await onSaved(saved);
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function requestClose() {
    if (!dirty || window.confirm("Fermer sans enregistrer les modifications ?")) onClose();
  }

  return <Modal title={isNew ? "Nouveau projet" : form.title} eyebrow={dirty ? "MODIFICATIONS NON ENREGISTRÉES" : "PROJECT EDITOR"} onClose={requestClose} wide>
    <form className="editor-form" onSubmit={event => void save(event)}>
      <div className="editor-main">
        <section className="form-section">
          <div className="field wide-field"><label htmlFor="project-title">Titre</label><input id="project-title" value={form.title} onChange={event => updateTitle(event.target.value)} required autoFocus/></div>
          <div className="field"><label htmlFor="project-slug">Slug</label><input id="project-slug" value={form.slug} onChange={event => { setSlugTouched(true); update("slug", slugify(event.target.value)); }} required/><small>URL unique du projet</small></div>
          <div className="field"><label htmlFor="project-category">Catégorie</label><input id="project-category" value={form.category} onChange={event => update("category", event.target.value)}/></div>
          <div className="field full"><label htmlFor="project-description">Description</label><textarea id="project-description" rows="6" value={form.description} onChange={event => update("description", event.target.value)}/></div>
          <div className="field full"><label htmlFor="project-services">Services</label><textarea id="project-services" rows="4" value={form.services.join("\n")} onChange={event => update("services", event.target.value.split("\n").map(item => item.trim()).filter(Boolean))}/><small>Un service par ligne</small></div>
        </section>

        <section className="form-section">
          <div className="section-title"><span>Media</span><small>Fichiers de la médiathèque ou URL existantes</small></div>
          <div className="field full"><label htmlFor="project-cover">Cover</label><input id="project-cover" list="media-options" value={form.cover} onChange={event => update("cover", event.target.value)} placeholder="/uploads/image.webp"/></div>
          <div className="field full"><label htmlFor="project-images">Images</label><textarea id="project-images" rows="5" value={form.images.join("\n")} onChange={event => update("images", event.target.value.split("\n").map(item => item.trim()).filter(Boolean))}/><small>Une URL par ligne</small></div>
          <datalist id="media-options">{media.map(item => <option key={item._id} value={item.url}>{item.originalName}</option>)}</datalist>
        </section>

        <section className="form-section">
          <div className="section-title"><span>SEO existant</span><small>Champs du modèle Project</small></div>
          <div className="field full"><label htmlFor="project-seo-title">Titre SEO</label><input id="project-seo-title" value={form.seoTitle} onChange={event => update("seoTitle", event.target.value)}/><small>{form.seoTitle.length}/60 caractères</small></div>
          <div className="field full"><label htmlFor="project-seo-description">Description SEO</label><textarea id="project-seo-description" rows="4" value={form.seoDescription} onChange={event => update("seoDescription", event.target.value)}/><small>{form.seoDescription.length}/160 caractères</small></div>
        </section>
      </div>

      <aside className="editor-side">
        <section className="publish-card">
          <div className="publish-state"><span className={`state-dot ${form.status}`}/><div><b>{form.status === "published" ? "Publié" : "Brouillon"}</b><small>{dirty ? "Modifications non enregistrées" : "Toutes les modifications sont enregistrées"}</small></div></div>
          <div className="field"><label htmlFor="project-status">Statut</label><select id="project-status" value={form.status} onChange={event => update("status", event.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option></select></div>
          <div className="field"><label htmlFor="project-year">Année</label><input id="project-year" type="number" value={form.year} onChange={event => update("year", Number(event.target.value))}/></div>
          <div className="field"><label htmlFor="project-order">Ordre</label><input id="project-order" type="number" value={form.sortOrder} onChange={event => update("sortOrder", Number(event.target.value))}/></div>
          <label className="switch-field"><input type="checkbox" checked={form.featured} onChange={event => update("featured", event.target.checked)}/><span/><div><b>Featured</b><small>Mettre le projet en avant</small></div></label>
          <div className="publish-actions">
            <button type="submit" className="button secondary" disabled={saving || !dirty}>{saving ? "Enregistrement…" : form.status === "draft" ? "Enregistrer le brouillon" : "Enregistrer"}</button>
            {form.status === "draft" && <button type="button" className="button primary" disabled={saving} onClick={() => void save(null, "published")}>Publier</button>}
          </div>
        </section>
        {!isNew && form.status === "published" && <a className="preview-link" href="/#work" target="_blank" rel="noreferrer"><Icon name="external"/> Voir dans Selected Work</a>}
      </aside>
    </form>
  </Modal>;
}
