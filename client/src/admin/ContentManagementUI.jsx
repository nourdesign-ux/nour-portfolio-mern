import { useEffect, useRef, useState } from "react";
import { Icon } from "./AdminUI.jsx";

export function ContentPageHeader({ eyebrow, title, description, action, secondary }) {
  return <div className="view-heading content-page-heading">
    <div><span className="admin-kicker">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {(action || secondary) && <div className="mini-actions">{secondary}{action}</div>}
  </div>;
}

export function ContentFilterBar({ value, onChange, filters, search, onSearch, placeholder = "Rechercher…", children, count }) {
  return <div className="content-filter-bar" role="search">
    {onSearch && <label className="content-search"><Icon name="search" size={16}/><input value={search} onChange={event => onSearch(event.target.value)} placeholder={placeholder}/></label>}
    <div className="filter-tabs" role="tablist" aria-label="Filtrer le contenu">
      {filters.map(filter => <button role="tab" aria-selected={value === filter.value} className={value === filter.value ? "active" : ""} key={filter.value} onClick={() => onChange(filter.value)}>{filter.label}{filter.count !== undefined && <span>{filter.count}</span>}</button>)}
    </div>
    {children && <div className="content-filter-options">{children}</div>}
    {count !== undefined && <span className="panel-count">{count} résultat{count > 1 ? "s" : ""}</span>}
  </div>;
}

export function ContentTable({ columns, className = "", children }) {
  return <div className={`data-table content-table ${className}`}>
    <div className="data-row data-head" style={{ "--content-columns": columns.map(column => column.width || "1fr").join(" ") }}>
      {columns.map(column => <span key={column.label || column.key}>{column.label}</span>)}
    </div>
    {children}
  </div>;
}

export function ContentRow({ columns, children, className = "" }) {
  return <div className={`data-row content-row ${className}`} style={{ "--content-columns": columns.map(column => column.width || "1fr").join(" ") }}>{children}</div>;
}

export function ContentIdentity({ initials, title, meta, onClick, icon = "pages" }) {
  return <button className="page-cell content-identity" onClick={onClick}>
    <span className="page-key">{initials || <Icon name={icon} size={17}/>}</span>
    <span><b>{title}</b><small>{meta}</small></span>
  </button>;
}

export function ActionMenu({ label = "Actions", children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const key = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  return <div className="content-action-menu" ref={root}>
    <button className="icon-button" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen(value => !value)}><Icon name="more"/></button>
    {open && <div className="content-action-popover" role="menu" onClick={() => setOpen(false)}>{children}</div>}
  </div>;
}

export function ActionMenuButton({ icon, children, danger = false, ...props }) {
  return <button role="menuitem" className={danger ? "danger-link" : ""} {...props}>{icon && <Icon name={icon} size={15}/>}<span>{children}</span></button>;
}

export function ActionMenuLink({ icon, children, ...props }) {
  return <a role="menuitem" {...props}>{icon && <Icon name={icon} size={15}/>}<span>{children}</span></a>;
}

export function useContentPagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  return { page, pageCount, setPage, paginated: items.slice((page - 1) * pageSize, page * pageSize) };
}

export function ContentPagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return <nav className="content-pagination" aria-label="Pagination">
    <button disabled={page === 1} onClick={() => onChange(page - 1)}>Précédent</button>
    <span>Page <b>{page}</b> sur {pageCount}</span>
    <button disabled={page === pageCount} onClick={() => onChange(page + 1)}>Suivant</button>
  </nav>;
}
