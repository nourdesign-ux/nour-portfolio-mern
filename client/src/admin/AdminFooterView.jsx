import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { Icon, SkeletonRows } from "./AdminUI.jsx";

const sizes = { desktop: [1440, 420], tablet: [768, 500], mobile: [390, 560] };

export default function AdminFooterView({ notify }) {
  const [settings, setSettings] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [saving, setSaving] = useState(false);
  const frameRef = useRef(null);
  useEffect(() => { api("/settings").then(setSettings).catch(error => notify(error.message, "error")); }, []);
  const updatePreview = () => {
    const footer = frameRef.current?.contentDocument?.querySelector(".footer");
    if (!footer || !settings) return;
    [...footer.ownerDocument.body.children].forEach(node => { if (node !== footer) node.style.display = "none"; });
    Object.assign(footer.ownerDocument.body.style, { margin: "0", minHeight: "0", overflow: "hidden", background: "#111" });
    Object.assign(footer.style, { display: "block", position: "relative", margin: "0", minHeight: "100%", outline: "4px solid #d9ff43", outlineOffset: "-4px" });
    footer.ownerDocument.onclick = event => { if (event.target.closest("a,button,form")) { event.preventDefault(); event.stopPropagation(); } };
    const brand = footer.querySelector(".footer__brand"); const role = footer.querySelector(".footer__role span"); const copyright = footer.querySelector(".footer__bottom span");
    if (brand) brand.textContent = settings.footerEditor?.brand || settings.logoText || "NOUR MASTOURI";
    if (role) role.textContent = settings.footerEditor?.role || settings.profile?.role || "SENIOR GRAPHIC DESIGNER & ART DIRECTOR";
    if (copyright) copyright.textContent = settings.footer || "© 2026 NOUR MASTOURI";
  };
  useEffect(updatePreview, [settings, device]);
  if (!settings) return <SkeletonRows/>;
  const data = settings.footerEditor || {};
  const update = (key, value) => setSettings(current => ({ ...current, footerEditor: { ...(current.footerEditor || {}), [key]: value } }));
  const save = async () => { setSaving(true); try { const saved = await api("/settings", { method: "PUT", body: JSON.stringify(settings) }); setSettings(saved); notify("Footer enregistré"); } catch (error) { notify(error.message, "error"); } finally { setSaving(false); } };
  const [width, height] = sizes[device]; const scale = Math.min(1, 820 / width);
  return <div className="footer-editor-screen"><div className="view-heading"><div><span className="admin-kicker">GLOBAL / FOOTER</span><h1>Footer Visual Editor</h1><p>Édition du Footer global avec aperçu réel isolé dans le dashboard.</p></div><button className="button primary" onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button></div><div className="footer-editor-toolbar">{Object.keys(sizes).map(key => <button className={device === key ? "active" : ""} onClick={() => setDevice(key)} key={key}>{key}</button>)}</div><div className="footer-editor-layout"><section className="cms-card settings-form-card"><label className="field"><span>Marque</span><input value={data.brand || ""} onChange={event => update("brand", event.target.value)}/></label><label className="field"><span>Rôle</span><textarea rows="3" value={data.role || ""} onChange={event => update("role", event.target.value)}/></label><label className="field"><span>Copyright / texte bas</span><input value={settings.footer || ""} onChange={event => setSettings(current => ({ ...current, footer: event.target.value }))}/></label><label className="field"><span>Localisation</span><input value={data.location || "TUNISIA — WORLDWIDE"} onChange={event => update("location", event.target.value)}/></label><label className="visibility-toggle"><input type="checkbox" checked={data.showBackToTop !== false} onChange={event => update("showBackToTop", event.target.checked)}/> Afficher Back to top</label></section><div className="footer-real-canvas" style={{ width: width * scale, height: height * scale }}><iframe ref={frameRef} title="Footer preview" src="/?footer-preview=1" onLoad={updatePreview} style={{ width, height, transform: `scale(${scale})` }}/></div></div></div>;
}
