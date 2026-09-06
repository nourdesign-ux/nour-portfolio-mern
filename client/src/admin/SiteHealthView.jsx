import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { EmptyState, Icon, SkeletonRows } from "./AdminUI.jsx";

const label = value => ["healthy", "available", "configured", "online"].includes(value) ? "Healthy" : value === "warning" || value === "coming-soon" || value === "maintenance" ? "Warning" : value === "unavailable" ? "Unavailable" : "Error";
const tone = value => ["healthy", "available", "configured", "online"].includes(value) ? "healthy" : value === "warning" || value === "coming-soon" || value === "maintenance" ? "warning" : "unavailable";

export default function SiteHealthView({ notify, onCountsChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const result = await api("/site-health"); setData(result); if (result.counts) onCountsChange?.({ forms: result.counts.forms, widgets: result.counts.widgets }); } catch (requestError) { setError(requestError.message); notify(requestError.message, "error"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  if (loading) return <SkeletonRows count={7}/>;
  if (error) return <EmptyState icon="warning" title="Site Health indisponible" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/>;
  const rows = [
    ["Public mode", data.publicMode, "Mode manuel, indépendant de la santé technique"],
    ["Frontend", data.website.frontend, data.website.frontendLatencyMs == null ? "Test HTTP indisponible" : `${data.website.frontendLatencyMs} ms`],
    ["Admin", data.website.admin, "Même application, routes protégées"],
    ["API", data.server.status, `${data.server.node} · uptime ${data.server.uptimeSeconds}s`],
    ["Database", data.database.status, data.database.latencyMs == null ? "Latence indisponible" : `${data.database.latencyMs} ms`],
    ["Media storage", data.storage.status, data.storage.driver],
    ...Object.entries(data.apis).map(([key, value]) => [`${key} API`, value, value === "unavailable" ? "Configuration absente" : "Service accessible"])
  ];
  return <><div className="view-heading"><div><span className="admin-kicker">SYSTEM / LIVE STATUS</span><h1>Site Health</h1><p>Le mode public et les problèmes techniques restent clairement séparés.</p></div><button className="button primary" onClick={() => void load()}><Icon name="restore"/> Actualiser</button></div><div className="health-hero cms-card"><div><span className={`health-orb ${tone(data.website.status)}`}/><div><b>Système {label(data.website.status).toLowerCase()}</b><small>Dernier contrôle : {new Date(data.checkedAt).toLocaleString("fr-FR")}</small></div></div><span>Mode public : <b>{data.publicMode}</b> · {data.server.memoryMb} MB</span></div>{data.counts && <div className="health-count-grid">{Object.entries(data.counts).map(([key, value]) => <article key={key}><span>{key}</span><b>{value}</b></article>)}</div>}<section className="cms-card health-services"><div className="panel-heading"><div><b>Services et infrastructure</b><span>Valeurs mesurées maintenant</span></div></div>{rows.map(([name, status, detail]) => <article key={name}><span className={`health-dot ${tone(status)}`}/><div><b>{name}</b><small>{detail}</small></div><strong className={tone(status)}>{name === "Public mode" ? status : label(status)}</strong>{status === "unavailable" && <p>Ajoutez la configuration requise côté serveur puis actualisez.</p>}</article>)}</section></>;
}
