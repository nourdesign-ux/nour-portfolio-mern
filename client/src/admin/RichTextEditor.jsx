import { useEffect, useRef, useState } from "react";
import { Icon } from "./AdminUI.jsx";

const actions = [
  ["undo", "↶", "Annuler"], ["redo", "↷", "Rétablir"], ["bold", "B", "Gras"], ["italic", "I", "Italique"],
  ["underline", "U", "Souligné"], ["insertUnorderedList", "• Liste", "Liste"], ["insertOrderedList", "1. Liste", "Liste numérotée"],
  ["justifyLeft", "←", "Aligner à gauche"], ["justifyCenter", "↔", "Centrer"], ["justifyRight", "→", "Aligner à droite"]
];

export default function RichTextEditor({ value = "", onChange, media = [], onPickMedia, label = "Contenu" }) {
  const ref = useRef(null);
  const selectionRange = useRef(null);
  const [source, setSource] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  useEffect(() => { if (!source && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, [value, source]);
  const command = (name, argument) => { ref.current?.focus(); document.execCommand(name, false, argument); onChange(ref.current?.innerHTML || ""); };
  const openLink = () => { const selection = window.getSelection(); selectionRange.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; setLinkOpen(true); };
  const addLink = () => { if (!linkUrl.trim()) return; const selection = window.getSelection(); if (selectionRange.current && selection) { selection.removeAllRanges(); selection.addRange(selectionRange.current); } command("createLink", linkUrl.trim()); setLinkOpen(false); };
  const addTable = () => command("insertHTML", "<table><tbody><tr><th>Titre</th><th>Titre</th></tr><tr><td>Contenu</td><td>Contenu</td></tr></tbody></table><p><br></p>");
  return <div className="rich-editor"><div className="rich-editor-heading"><b>{label}</b><button type="button" onClick={() => setSource(current => !current)}>{source ? "Éditeur visuel" : "HTML"}</button></div>{source ? <textarea className="rich-source" rows="14" value={value} onChange={event => onChange(event.target.value)}/> : <><div className="rich-toolbar" role="toolbar" aria-label={`Outils — ${label}`}><select aria-label="Format" defaultValue="p" onChange={event => command("formatBlock", event.target.value)}><option value="p">Paragraphe</option><option value="h2">Titre H2</option><option value="h3">Titre H3</option><option value="h4">Titre H4</option><option value="blockquote">Citation</option></select>{actions.map(([name,text,title])=><button type="button" key={name} title={title} aria-label={title} onMouseDown={event=>{event.preventDefault();command(name);}}>{text}</button>)}<button type="button" title="Ajouter un lien" onMouseDown={event=>{event.preventDefault();openLink();}}>Lien</button><button type="button" title="Insérer un bouton" onMouseDown={event=>{event.preventDefault();command("insertHTML",'<a class="button" href="#">Bouton</a>');}}>Bouton</button><button type="button" title="Insérer un tableau" onMouseDown={event=>{event.preventDefault();addTable();}}>Tableau</button>{media.length>0&&<select aria-label="Insérer un média" value="" onChange={event=>{if(event.target.value){command("insertImage",event.target.value);onPickMedia?.(event.target.value);}}}><option value="">Média…</option>{media.map(item=><option key={item._id} value={item.url}>{item.title||item.originalName}</option>)}</select>}<button type="button" title="Nettoyer le format" aria-label="Nettoyer le format" onMouseDown={event=>{event.preventDefault();command("removeFormat");}}><Icon name="restore" size={14}/></button></div>{linkOpen && <div className="rich-link-popover"><label><span>URL du lien</span><input autoFocus value={linkUrl} onChange={event => setLinkUrl(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }}/></label><button type="button" onClick={() => setLinkOpen(false)}>Annuler</button><button type="button" className="primary" onClick={addLink}>Insérer</button></div>}<div ref={ref} className="rich-content" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} onInput={event=>onChange(event.currentTarget.innerHTML)} onPaste={event=>{event.preventDefault();document.execCommand("insertText",false,event.clipboardData.getData("text/plain"));}}/></>}</div>;
}
