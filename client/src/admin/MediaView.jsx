import { useEffect, useMemo, useRef, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import { ConfirmModal, EmptyState, Icon, Modal } from "./AdminUI.jsx";
import { formatBytes, formatDate } from "./adminUtils.js";

export default function MediaView({ search, notify, onCountsChange }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/media");
      setMedia(data);
      onCountsChange?.({ media: data.length });
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => media.filter(item =>
    `${item.originalName} ${item.alt} ${item.mimeType}`.toLowerCase().includes(search.toLowerCase())
  ), [media, search]);

  async function upload(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    setUploading(true);
    let completed = 0;
    try {
      for (const file of list) {
        const body = new FormData();
        body.append("file", file);
        await api("/media", { method: "POST", body });
        completed += 1;
      }
      notify(`${completed} fichier${completed > 1 ? "s importés" : " importé"}`);
      await load();
    } catch (requestError) {
      notify(completed ? `${completed} importé(s). ${requestError.message}` : requestError.message, "error");
    } finally { setUploading(false); setDragging(false); }
  }

  async function remove() {
    try {
      await api(`/media/${confirm._id}`, { method: "DELETE" });
      notify(`“${confirm.originalName}” supprimé`);
      setConfirm(null);
      setSelected(null);
      await load();
    } catch (requestError) { notify(requestError.message, "error"); }
  }

  return <>
    <div className="view-heading"><div><span className="admin-kicker">ASSETS / MEDIA</span><h1>Media</h1><p>Médiathèque réelle basée sur le stockage local existant.</p></div><div className="builder-actions"><button className="button secondary" onClick={async () => { try { const result = await api("/media/sync-public", { method: "POST" }); notify(`${result.imported} image${result.imported > 1 ? "s" : ""} du site ajoutée${result.imported > 1 ? "s" : ""}`); await load(); } catch (requestError) { notify(requestError.message, "error"); } }}><Icon name="media"/> Scanner le site</button><button className="button primary" onClick={() => fileRef.current?.click()} disabled={uploading}><Icon name="upload"/> {uploading ? "Import…" : "Importer"}</button></div></div>
    <input ref={fileRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={event => void upload(event.target.files)}/>
    <button className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files); }} disabled={uploading}>
      <Icon name="upload" size={24}/><span><b>Déposez vos images ici</b><small>JPG, PNG, WEBP ou GIF · 10 Mo maximum</small></span>
    </button>
    {loading ? <div className="media-grid">{Array.from({length:8},(_,i)=><div className="media-skeleton" key={i}/>)}</div> : error ? <EmptyState icon="warning" title="Impossible de charger les médias" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : filtered.length === 0 ? <EmptyState icon="media" title={search ? "Aucun résultat" : "Médiathèque vide"} text={search ? "Essayez une autre recherche." : "Importez une image pour commencer."}/> :
      <div className="media-grid">{filtered.map(item => <button className="media-card" key={item._id} onClick={() => setSelected(item)}><span className="media-preview"><img src={mediaUrl(item.url)} alt={item.alt || ""} loading="lazy"/></span><span className="media-meta"><b>{item.originalName}</b><small>{formatBytes(item.size)} · {formatDate(item.createdAt)}</small></span></button>)}</div>}
    {selected && <MediaEditor item={selected} notify={notify} onClose={() => setSelected(null)} onDelete={() => { setConfirm(selected); setSelected(null); }} onSaved={saved => { setMedia(current => current.map(item => item._id === saved._id ? saved : item)); setSelected(saved); }}/>}
    {confirm && <ConfirmModal title="Supprimer ce média ?" message={`“${confirm.originalName}” et son fichier seront supprimés définitivement. Les projets qui utilisent son URL devront être mis à jour.`} confirmLabel="Supprimer définitivement" onClose={() => setConfirm(null)} onConfirm={() => void remove()}/>}
  </>;
}

function MediaEditor({ item, notify, onClose, onDelete, onSaved }) {
  const [title, setTitle] = useState(item.title || item.originalName);
  const [alt, setAlt] = useState(item.alt || "");
  const [caption, setCaption] = useState(item.caption || "");
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const replaceRef = useRef(null);
  async function save(event) {
    event.preventDefault(); setSaving(true);
    try {
      const saved = await api(`/media/${item._id}`, { method: "PUT", body: JSON.stringify({ title, alt, caption }) });
      onSaved(saved); notify("Texte alternatif enregistré");
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { setSaving(false); }
  }
  async function replaceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setReplacing(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const saved = await api(`/media/${item._id}/replace`, { method: "POST", body });
      onSaved(saved); notify("Média remplacé");
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { setReplacing(false); event.target.value = ""; }
  }
  return <Modal title={item.originalName} eyebrow="MEDIA DETAILS" onClose={onClose} wide>
    <form className="media-editor" onSubmit={event => void save(event)}>
      <div className="media-editor-preview"><img src={mediaUrl(item.url)} alt={alt}/></div>
      <div className="media-editor-fields">
        <div className="field"><label>Nom du fichier</label><input value={item.originalName} disabled/></div>
        <div className="field"><label htmlFor="media-title">Titre</label><input id="media-title" value={title} onChange={event => setTitle(event.target.value)}/></div>
        <div className="field"><label>URL</label><div className="copy-field"><input value={item.url} readOnly/><button type="button" onClick={() => { void navigator.clipboard.writeText(item.url); notify("URL copiée"); }}>Copier</button></div></div>
        <input ref={replaceRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={event => void replaceFile(event)}/>
        <button type="button" className="button secondary" onClick={() => replaceRef.current?.click()} disabled={replacing}><Icon name="upload"/> {replacing ? "Remplacement…" : "Remplacer le fichier"}</button>
        <div className="field"><label htmlFor="media-alt">Texte alternatif</label><textarea id="media-alt" rows="5" value={alt} onChange={event => setAlt(event.target.value)} autoFocus/><small>Décrivez l’image pour l’accessibilité.</small></div>
        <div className="field"><label htmlFor="media-caption">Légende</label><textarea id="media-caption" rows="3" value={caption} onChange={event => setCaption(event.target.value)}/></div>
        <dl className="media-details"><div><dt>Type</dt><dd>{item.mimeType}</dd></div><div><dt>Taille</dt><dd>{formatBytes(item.size)}</dd></div><div><dt>Ajout</dt><dd>{formatDate(item.createdAt)}</dd></div></dl>
        <div className="modal-actions"><button type="button" className="button danger-ghost" onClick={onDelete}><Icon name="trash"/> Supprimer</button><button className="button primary" disabled={saving || alt === item.alt}>{saving ? "Enregistrement…" : "Enregistrer"}</button></div>
      </div>
    </form>
  </Modal>;
}
