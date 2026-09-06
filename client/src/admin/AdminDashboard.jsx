import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, mediaUrl } from "../api/client.js";
import { EmptyState, Icon, SkeletonRows, StatusBadge } from "./AdminUI.jsx";
import MediaView from "./MediaView.jsx";
import PagesView from "./PagesView.jsx";
import ProjectsView from "./ProjectsView.jsx";
import AdminSettingsView from "./AdminSettingsView.jsx";
import AdminHeaderView from "./AdminHeaderView.jsx";
import SavedBlocksView from "./SavedBlocksView.jsx";
import AdminFooterView from "./AdminFooterView.jsx";
import AdminProfileView from "./AdminProfileView.jsx";
import AdminMenuView from "./AdminMenuView.jsx";
import AdminToolsView from "./AdminToolsView.jsx";
import SectionsView from "./SectionsView.jsx";
import AdminSeoView from "./AdminSeoView.jsx";
import FormsView from "./FormsView.jsx";
import WidgetsView from "./WidgetsView.jsx";
import SiteHealthView from "./SiteHealthView.jsx";
import AdminCookiesView from "./AdminCookiesView.jsx";
import SiteModeView, { SiteStatusView } from "./SiteModeView.jsx";
import { formatDate } from "./adminUtils.js";
import "./admin-pro.css";

const navigation = [
  { to: "/admin", end: true, icon: "dashboard", label: "Dashboard", group: "Workspace" },
  { to: "/admin/pages", icon: "pages", label: "Pages", group: "Content" },
  { to: "/admin/sections", icon: "builder", label: "Sections", group: "Content" },
  { to: "/admin/forms", icon: "pages", label: "Forms", group: "Content" },
  { to: "/admin/widgets", icon: "builder", label: "Widgets", group: "Content" },
  { to: "/admin/projects", icon: "projects", label: "Projects", group: "Content" },
  { to: "/admin/media", icon: "media", label: "Media Library", group: "Content" },
  { to: "/admin/appearance", icon: "builder", label: "Appearance", group: "Design" },
  { to: "/admin/header", icon: "header", label: "Header", group: "Design" },
  { to: "/admin/navigation", icon: "menu-lines", label: "Menus", group: "Design" },
  { to: "/admin/footer", icon: "footer", label: "Footer", group: "Design" },
  { to: "/admin/seo", icon: "search", label: "SEO", group: "Design" },
  { to: "/admin/cookies", icon: "archive", label: "Cookies", group: "Design" },
  { to: "/admin/tools", icon: "archive", label: "Tools & Backup", group: "System" },
  { to: "/admin/health", icon: "warning", label: "Site Health", group: "System" },
  { to: "/admin/site-status", icon: "warning", label: "Site Status", group: "System" },
  { to: "/admin/coming-soon", icon: "pages", label: "Coming Soon", group: "System" },
  { to: "/admin/maintenance", icon: "warning", label: "Maintenance", group: "System" },
  { to: "/admin/profile", icon: "profile", label: "Profile", group: "System" }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [counts, setCounts] = useState({ projects: 0, pages: 0, sections: 0, forms: 0, widgets: 0, media: 0 });
  const [siteStatus, setSiteStatus] = useState("online");

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
    window.requestAnimationFrame(() => document.querySelector(".cms-sidebar a.active")?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }, [location.pathname]);

  useEffect(() => { const refresh = () => api("/settings").then(data => setSiteStatus(data.siteStatus || "online")).catch(() => {}); void refresh(); const timer = window.setInterval(refresh, 3000); const update = event => setSiteStatus(event.detail); window.addEventListener("nour:site-status", update); return () => { window.clearInterval(timer); window.removeEventListener("nour:site-status", update); }; }, []);

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
    <header className="wp-adminbar">
      <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Icon name="menu"/></button>
      <a className="wp-adminbar-brand" href="/admin"><b>NOUR.</b><span>CMS</span></a>
      <div className={`wp-adminbar-center site-${siteStatus}`}><span className="wp-status-dot"/> {siteStatus === "online" ? "Site Online" : siteStatus === "coming-soon" ? "Coming Soon Active" : "Maintenance Mode Active"}</div>
      <div className="wp-adminbar-actions"><a href="/" target="_blank" rel="noreferrer"><Icon name="external"/> View site</a><button title="Notifications"><span className="wp-notification-dot"/> Updates</button><button className="wp-user-menu" onClick={logout}><span className="admin-avatar">NM</span><span>Nour Mastouri</span><Icon name="chevron"/></button></div>
    </header>
    <aside className={`cms-sidebar ${menuOpen ? "open" : ""}`}>
      <div className="sidebar-workspace"><span>Workspace</span><b>Nour Portfolio</b><small>Production environment</small></div>
      <nav aria-label="CMS navigation">{["Workspace", "Content", "Design", "System"].map(group => <div className="sidebar-nav-group" key={group}><span className="sidebar-nav-label">{group}</span>{navigation.filter(item => item.group === group).map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => isActive ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span>{["Pages", "Sections", "Projects", "Forms", "Widgets", "Media Library"].includes(item.label) && <small>{counts[item.label === "Media Library" ? "media" : item.label.toLowerCase()] || ""}</small>}</NavLink>)}</div>)}</nav>
      <div className="sidebar-bottom"><a href="/" target="_blank" rel="noreferrer"><Icon name="external"/><span>View live site</span></a><button onClick={logout}><Icon name="logout"/><span>Sign out</span></button></div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}/>}
    <div className="cms-workspace">
      <header className="cms-topbar">
        <div className="breadcrumbs"><span>CMS</span><i>/</i><b>{current.label}</b></div>
        {current.label === "Dashboard" ? <span/> : <label className="cms-search"><Icon name="search"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Rechercher dans ${current.label.toLowerCase()}…`} aria-label="Rechercher"/><kbd>⌘ K</kbd></label>}
        <div className="topbar-actions"><a className="topbar-view-site" href="/" target="_blank" rel="noreferrer"><Icon name="external"/> View site</a><div className="admin-avatar">NM</div></div>
      </header>
      <main className="cms-main">
        <Routes>
          <Route index element={<Overview onCountsChange={updateCounts}/>} />
          <Route path="projects" element={<ProjectsView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="pages" element={<PagesView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="sections" element={<SectionsView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="forms" element={<FormsView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="widgets" element={<WidgetsView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="media" element={<MediaView search={search} notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="saved-blocks" element={<SavedBlocksView search={search} notify={notify}/>} />
          <Route path="appearance" element={<AdminSettingsView section="appearance" notify={notify}/>} />
          <Route path="header" element={<AdminHeaderView notify={notify}/>} />
          <Route path="navigation" element={<AdminMenuView notify={notify}/>} />
          <Route path="footer" element={<AdminFooterView notify={notify}/>} />
          <Route path="seo" element={<AdminSeoView notify={notify}/>} />
          <Route path="cookies" element={<AdminCookiesView notify={notify}/>} />
          <Route path="tools" element={<AdminToolsView notify={notify}/>} />
          <Route path="health" element={<SiteHealthView notify={notify} onCountsChange={updateCounts}/>} />
          <Route path="site-status" element={<SiteStatusView notify={notify}/>} />
          <Route path="coming-soon" element={<SiteModeView type="comingSoon" notify={notify}/>} />
          <Route path="maintenance" element={<SiteModeView type="maintenance" notify={notify}/>} />
          <Route path="profile" element={<AdminProfileView notify={notify}/>} />
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
  const [featureImage, setFeatureImage] = useState("");
  const [blockImages, setBlockImages] = useState({ projects: "", pages: "", media: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [projects, onePage, media] = await Promise.all([api("/projects?all=1"), api("/pages/one-page"), api("/media")]);
      const pages = [onePage];
      setData({ projects, pages, media });
      onCountsChange({ projects: projects.length, pages: 1, media: media.length });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const firstProject = data.projects[0];
    setFeatureImage(firstProject?.cover ? mediaUrl(firstProject.cover) : "");
    setBlockImages({
      projects: firstProject?.cover ? mediaUrl(firstProject.cover) : "",
      pages: data.pages[0]?.image || "",
      media: data.media[0]?.url ? mediaUrl(data.media[0].url) : ""
    });
  }, [data.projects, data.pages, data.media]);

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (key === "feature") setFeatureImage(url);
    else setBlockImages(current => ({ ...current, [key]: url }));
    event.target.value = "";
  };

  const published = data.projects.filter(item => item.status === "published").length;
  const drafts = data.projects.filter(item => item.status === "draft").length;
  const recent = [...data.projects].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const lastUpdated = recent[0]?.updatedAt ? formatDate(recent[0].updatedAt) : "Jamais";

  const featuredProject = recent[0];

  return <>
    <div className="view-heading overview-heading"><div><span className="admin-kicker">NOUR CONTENT STUDIO</span><h1>Overview</h1><p>Une vue claire du contenu réel de votre portfolio.</p></div><a className="button secondary" href="/" target="_blank" rel="noreferrer"><Icon name="external"/> Voir le site</a></div>
    {error ? <EmptyState icon="warning" title="Le CMS ne peut pas joindre l’API" text={error} action={<button className="button secondary" onClick={() => void load()}>Réessayer</button>}/> : <>
      <section className="overview-quick-stats">
        <div className="quick-stat status">
          <span className="quick-tag">Site status</span>
          <b>{published > 0 ? "Portfolio actif" : "En attente"}</b>
          <small>{published} projet{published > 1 ? "s" : ""} publié{published > 1 ? "s" : ""}</small>
        </div>
        <div className="quick-stat">
          <span className="quick-tag">Drafts</span>
          <b>{drafts}</b>
          <small>À finaliser</small>
        </div>
        <div className="quick-stat">
          <span className="quick-tag">Dernière modif.</span>
          <b>{lastUpdated}</b>
          <small>{featuredProject ? featuredProject.title : "Aucune mise à jour"}</small>
        </div>
      </section>

      <section className="overview-hero cms-card">
        <div className="overview-hero-copy">
          <span className="admin-kicker">DASHBOARD / CONTROL CENTER</span>
          <h2>Votre portfolio, prêt à être édité bloc par bloc.</h2>
          <p>Créez, remplacez et publiez vos contenus comme dans un vrai CMS visuel, sans perdre la vitesse du site.</p>
          <div className="mini-actions">
            <NavLink className="button primary" to="/admin/projects">Gérer les projets</NavLink>
            <NavLink className="button secondary" to="/admin/media">Médiathèque</NavLink>
          </div>
        </div>
        <div className="hero-glance">
          <div className="glance-card">
            <span>Projet principal</span>
            <b>{featuredProject ? featuredProject.title : "Aucun projet"}</b>
            <small>{featuredProject ? `${featuredProject.category || "Sans catégorie"} · ${formatDate(featuredProject.updatedAt)}` : "Ajoutez un projet pour le mettre en avant."}</small>
          </div>
          <div className="glance-image">
            {featureImage ? <img src={featureImage} alt={featuredProject?.title || "Projet principal"}/> : <div className="glance-placeholder"><Icon name="media" size={28}/></div>}
            <label className="image-edit-button">
              <input type="file" accept="image/*" onChange={event => handleFileChange("feature", event)}/>
              <span>Changer image</span>
            </label>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Projects" value={loading ? "—" : data.projects.length} detail={`${published} publiés`} icon="projects" to="/admin/projects"/>
        <StatCard label="Brouillons" value={loading ? "—" : drafts} detail="À finaliser" icon="edit" to="/admin/projects"/>
        <StatCard label="Pages" value={loading ? "—" : data.pages.length} detail="Sections existantes" icon="pages" to="/admin/pages"/>
        <StatCard label="Media" value={loading ? "—" : data.media.length} detail="Fichiers disponibles" icon="media" to="/admin/media"/>
      </section>
      <section className="overview-shell">
        <div className="cms-card workflow-panel">
          <div className="panel-heading"><div><b>Workflow de publication</b><span>Editorial pipeline</span></div></div>
          <div className="workflow-steps">
            <div className="workflow-step active">
              <span className="step-number">01</span>
              <div>
                <b>Concept</b>
                <small>Briefs, visuels et stratégie de contenu.</small>
              </div>
            </div>
            <div className="workflow-step active">
              <span className="step-number">02</span>
              <div>
                <b>Production</b>
                <small>Rédaction, média et mise en scène du projet.</small>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-number">03</span>
              <div>
                <b>Validation</b>
                <small>Contrôle final avant publication publique.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="cms-card activity-panel">
          <div className="panel-heading"><div><b>Activité récente</b><span>Dernière semaine</span></div></div>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-dot success"/>
              <div>
                <b>{featuredProject ? featuredProject.title : "Aucun projet sélectionné"}</b>
                <small>{featuredProject ? `Modifié le ${formatDate(featuredProject.updatedAt)}` : "Ajoutez un projet pour le mettre en avant."}</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-dot neutral"/>
              <div>
                <b>{data.pages.length} pages</b>
                <small>Sections du site actives et prêtes à être enrichies.</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-dot accent"/>
              <div>
                <b>{data.media.length} éléments média</b>
                <small>Images, visuels et assets disponibles dans la médiathèque.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <div className="cms-card data-panel recent-panel"><div className="panel-heading"><div><b>Dernières modifications</b><span>Projects</span></div><NavLink to="/admin/projects">Tout voir →</NavLink></div>{loading ? <SkeletonRows count={4}/> : recent.length ? <div className="recent-list">{recent.map(project => <NavLink to="/admin/projects" key={project._id}><span className="recent-index">{String(project.sortOrder).padStart(2,"0")}</span><span><b>{project.title}</b><small>{project.category || "Sans catégorie"}</small></span><StatusBadge status={project.status}/><time>{formatDate(project.updatedAt)}</time></NavLink>)}</div> : <EmptyState title="Aucun projet" text="Les projets existants apparaîtront ici."/>}</div>

        <div className="cms-card block-panel">
          <div className="panel-heading"><div><b>Contenu</b><span>Blocs disponibles</span></div></div>
          <div className="block-grid">
            <NavLink className="block-card" to="/admin/projects">
              <div className="block-thumb">
                {blockImages.projects ? <img src={blockImages.projects} alt="Projets"/> : <span className="block-thumb-placeholder"><Icon name="projects"/></span>}
                <label className="mini-image-toggle" onClick={event => event.stopPropagation()}>
                  <input type="file" accept="image/*" onChange={event => handleFileChange("projects", event)}/>
                  <span>Changer</span>
                </label>
              </div>
              <div className="block-copy"><b>Projets</b><small>{loading ? "…" : `${data.projects.length} items`}</small></div>
            </NavLink>
            <NavLink className="block-card" to="/admin/pages">
              <div className="block-thumb">
                {blockImages.pages ? <img src={blockImages.pages} alt="Pages"/> : <span className="block-thumb-placeholder"><Icon name="pages"/></span>}
                <label className="mini-image-toggle" onClick={event => event.stopPropagation()}>
                  <input type="file" accept="image/*" onChange={event => handleFileChange("pages", event)}/>
                  <span>Changer</span>
                </label>
              </div>
              <div className="block-copy"><b>Pages</b><small>{loading ? "…" : `${data.pages.length} sections`}</small></div>
            </NavLink>
            <NavLink className="block-card" to="/admin/media">
              <div className="block-thumb">
                {blockImages.media ? <img src={blockImages.media} alt="Médias"/> : <span className="block-thumb-placeholder"><Icon name="media"/></span>}
                <label className="mini-image-toggle" onClick={event => event.stopPropagation()}>
                  <input type="file" accept="image/*" onChange={event => handleFileChange("media", event)}/>
                  <span>Changer</span>
                </label>
              </div>
              <div className="block-copy"><b>Médias</b><small>{loading ? "…" : `${data.media.length} images`}</small></div>
            </NavLink>
          </div>
        </div>
      </section>
    </>}
  </>;
}

function StatCard({ label, value, detail, icon, to }) {
  return <NavLink className="stat-card cms-card" to={to}><span className="stat-icon"><Icon name={icon}/></span><strong>{value}</strong><div><b>{label}</b><small>{detail}</small></div><span className="stat-arrow">↗</span></NavLink>;
}
