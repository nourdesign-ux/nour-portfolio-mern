import { useEffect, useRef } from "react";

export function Icon({ name, size = 18 }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    builder: <><path d="M4 5h16M4 12h10M4 19h16"/><circle cx="18" cy="12" r="2"/><path d="M8 3v4M14 10v4M10 17v4"/></>,
    "menu-lines": <><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 4v4M15 10v4M11 16v4"/></>,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    header: <><path d="M4 5h16M4 9h16"/><path d="M7 5v4M17 5v4"/><path d="M6 14h12M6 18h8"/></>,
    footer: <><path d="M4 5h16M4 19h16"/><path d="M7 9h10M7 13h6"/></>,
    projects: <><path d="M4 7h16M7 4v6M17 4v6"/><rect x="3" y="6" width="18" height="15" rx="2"/></>,
    pages: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    media: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    "arrow-left": <path d="M19 12H5M12 19l-7-7 7-7"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
    download: <><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    edit: <><path d="m14 4 6 6L8 22H2v-6z"/><path d="m12 6 6 6"/></>,
    trash: <><path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></>,
    restore: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    warning: <><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/></>
    ,chevron: <path d="m7 10 5 5 5-5"/>
  };
  return <svg className="admin-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Modal({ title, eyebrow, children, onClose, wide = false }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = event => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        const focusable = [...(dialog?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("admin-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("admin-modal-open");
      previous?.focus?.();
    };
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`admin-modal ${wide ? "admin-modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header>
        <div><span>{eyebrow}</span><h2 id="modal-title">{title}</h2></div>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button>
      </header>
      {children}
    </section>
  </div>;
}

export function ConfirmModal({ title, message, confirmLabel = "Confirmer", tone = "danger", onConfirm, onClose, busy }) {
  return <Modal title={title} eyebrow="CONFIRMATION" onClose={onClose}>
    <div className="confirm-body"><Icon name="warning" size={26}/><p>{message}</p></div>
    <footer className="modal-actions">
      <button className="button secondary" onClick={onClose} disabled={busy}>Annuler</button>
      <button className={`button ${tone}`} onClick={onConfirm} disabled={busy}>{busy ? "Traitement…" : confirmLabel}</button>
    </footer>
  </Modal>;
}

export function SkeletonRows({ count = 5 }) {
  return <div className="skeleton-list" aria-label="Chargement">{Array.from({ length: count }, (_, index) => <div className="skeleton-row" key={index}><i/><span/><b/></div>)}</div>;
}

export function EmptyState({ icon = "projects", title, text, action }) {
  return <div className="empty-state"><Icon name={icon} size={30}/><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function StatusBadge({ status }) {
  const labels = { published: "Publié", draft: "Brouillon", active: "Actif", inactive: "Inactif", archived: "Archivé", global: "Global", local: "Local", scheduled: "Planifié" };
  const normalized = status || "draft";
  return <span className={`status-badge ${normalized}`}>{labels[normalized] || normalized}</span>;
}
