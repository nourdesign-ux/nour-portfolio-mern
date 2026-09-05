import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { EmptyState, Icon, SkeletonRows, StatusBadge } from "./AdminUI.jsx";
import MediaView from "./MediaView.jsx";
import PagesView from "./PagesView.jsx";
import ProjectsView from "./ProjectsView.jsx";
import { formatDate } from "./adminUtils.js";

const navigation = [
  { to: "/admin", end: true, icon: "dashboard", label: "Overview" },
  { to: "/admin/projects", icon: "projects", label: "Projects" },
  { to: "/admin/pages", icon: "pages", label: "Pages" },
  { to: "/admin/media", icon: "media", label: "Media" }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [counts, setCounts] = useState({ projects: 0, pages: 0, media: 0 });

  const current = useMemo(() => navigation.find(item => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)) || navigation[0], [location.pathname]);
  const notify = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(items => [...items, { id, message, type }]);
    window.setTimeout(() => setToasts(items => items.filter(item => item.id !== id)), 3800);
  }, []);
  const updateCounts = useCallback(value => setCounts(currentCounts => ({ ...currentCounts, ...value })), []);

  useEffect(() => {
    setSearch("");
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onUnauthorized = () => navigate("/admin/login", { replace: true });
    window.addEventListener("nour:unauthorized", onUnauthorized);
    return () => window.removeEventListener("nour:unauthorized", onUnauthorized);
  }, [navigate]);

  useEffect(() => {
    const onKey = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".cms-search input")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    localStorage.removeItem("nour_admin_token");
    navigate("/admin/login", { replace: true });
  }

  return <div className="admin-shell cms-shell">
    <aside className={`cms-sidebar ${menuOpen ? "open" : ""}`}>
      <div className="cms-brand"><b>NOUR.</b><span>CONTENT STUDIO</span></div>
      <nav aria-label="CMS navigation">{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => isActive ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span>{item.label !== "Overview" && <small>{counts[item.label.toLowerCase()] || ""}</small>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><a href="/" target="_blank" rel="noreferrer"><Icon name="external"/><span>Voir le portfolio</span></a><button onClick={logout}><Icon name="logout"/><span>Déconnexion</span></button></div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}/>}
    <div className="cms-workspace">
      <header className="cms-topbar">
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Icon name="menu"/></button>
        <div className="breadcrumbs"><span>CMS</span><i>/</i><b>{current.label}</b></div>
        {current.label === "Overview" ? <span/> : <label className="cms-search"><Icon name="search"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Rechercher dans ${current.label.toLowerCase()}…`} aria-label="Rechercher"/><kbd>⌘ K</kbd></label>}
        <div className="admin-avatar">NM</div>
      </header>
      <main className="cms-main">
        <Routes>
          <Route index element={<Overview onCountsChange={updateCounts}/>} />
          <Route path="projects" element={<ProjectsView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="pages" element={<PagesView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="media" element={<MediaView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="*" element={<EmptyState icon="warning" title="Vue introuvable" text="Cette vue n’existe pas dans le CMS." action={<button className="button secondary" onClick={() => navigate("/admin")}>Retour à l’overview</button>}/>} />
        </Routes>
      </main>
    </div>
    <div className="toast-stack" aria-live="polite">{toasts.map(toast => <div className={`toast ${toast.type}`} key={toast.id}><Icon name={toast.type === "error" ? "warning" : "check"}/><span>{toast.message}</span><button onClick={() => setToasts(items => items.filter(item => item.id !== toast.id))} aria-label="Fermer"><Icon name="close" size={15}/></button></div>)}</div>
  </div>;
}

function Overview({ onCountsChange }) {
  const [data, setData] = useState({ projects: [], pages: [], media: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [projects, pages, media] = await Promise.all([api("/projects?all=1"), api("/pages"), api("/media")]);
      setData({ projects, pages, media });
      onCountsChange({ projects: projects.length, pages: pages.length, media: media.length });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const published = data.projects.filter(item => item.status === "published").length;
  const drafts = data.projects.filter(item => item.status === "draft").length;
  const recent = [...data.projects].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  return <>
    <div className="view-heading overview-heading"><div><span className="admin-kicker">NOUR CONTENT STUDIO</span><h1>Overview</h1><p>Une vue claire du contenu réel de votre portfolio.</p></div><a className="button secondary" href="/" target="_blank" rel="noreferrer"><Icon name="external"/> Voir le site</a></div>
    {error ? <EmptyState icon="warning" title="Le CMS ne peut pas joindre l’API" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : <>
      <section className="stats-grid">
        <StatCard label="Projects" value={loading ? "—" : data.projects.length} detail={`${published} publiés`} icon="projects" to="/admin/projects"/>
        <StatCard label="Brouillons" value={loading ? "—" : drafts} detail="À finaliser" icon="edit" to="/admin/projects"/>
        <StatCard label="Pages" value={loading ? "—" : data.pages.length} detail="Sections existantes" icon="pages" to="/admin/pages"/>
        <StatCard label="Media" value={loading ? "—" : data.media.length} detail="Fichiers disponibles" icon="media" to="/admin/media"/>
      </section>
      <section className="overview-grid">
        <div className="cms-card data-panel recent-panel"><div className="panel-heading"><div><b>Dernières modifications</b><span>Projects</span></div><NavLink to="/admin/projects">Tout voir →</NavLink></div>{loading ? <SkeletonRows count={4}/> : recent.length ? <div className="recent-list">{recent.map(project => <NavLink to="/admin/projects" key={project._id}><span className="recent-index">{String(project.sortOrder).padStart(2,"0")}</span><span><b>{project.title}</b><small>{project.category || "Sans catégorie"}</small></span><StatusBadge status={project.status}/><time>{formatDate(project.updatedAt)}</time></NavLink>)}</div> : <EmptyState title="Aucun projet" text="Les projets existants apparaîtront ici."/>}</div>
        <div className="cms-card workflow-card"><span className="admin-kicker">PUBLISHING WORKFLOW</span><h2>Du brouillon au portfolio.</h2><p>Créez ou modifiez un projet, contrôlez chaque champ existant, prévisualisez puis publiez-le. Aucun changement visuel n’est appliqué au site public.</p><div className="workflow-steps"><span><b>01</b>Éditer</span><i/><span><b>02</b>Vérifier</span><i/><span><b>03</b>Publier</span></div><NavLink className="button primary" to="/admin/projects">Gérer les projets</NavLink></div>
      </section>
    </>}
  </>;
}

function StatCard({ label, value, detail, icon, to }) {
  return <NavLink className="stat-card cms-card" to={to}><span className="stat-icon"><Icon name={icon}/></span><strong>{value}</strong><div><b>{label}</b><small>{detail}</small></div><span className="stat-arrow">↗</span></NavLink>;
}
