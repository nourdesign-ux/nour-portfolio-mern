import { useEffect, useMemo, useRef, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import { EmptyState, Icon } from "./AdminUI.jsx";
import { confirmAction } from "./confirmAction.js";

const ELEMENTS = ["heading", "text", "image", "button", "link", "icon", "video", "divider", "spacer", "container", "form"];
const DEVICES = {
  desktop: { label: "Desktop", width: 1440, height: 900 },
  tablet: { label: "Tablette", width: 768, height: 1024 },
  mobile: { label: "Mobile", width: 390, height: 844 }
};
const newId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const cloneBlock = block => ({ ...structuredClone(block), id: newId(block.type || "block"), globalId: "", label: `${block.label || "Bloc"} (copie)` });
const BLOCK_SELECTORS = {
  header: ".site-header", hero: "#top", ticker: ".ticker", about: "#about", manifesto: ".manifesto",
  projects: "#work", expertise: "#expertise", experience: ".experience-statement", quote: ".quote",
  contact: "#contact", footer: ".footer"
};

function reorderByEdge(items, fromId, targetId, edge = "before") {
  if (!fromId || !targetId || fromId === targetId) return items;
  const next = [...items];
  const fromIndex = next.findIndex(item => item.id === fromId);
  if (fromIndex < 0 || next[fromIndex].locked) return items;
  const [moved] = next.splice(fromIndex, 1);
  const targetIndex = next.findIndex(item => item.id === targetId);
  if (targetIndex < 0) return items;
  next.splice(targetIndex + (edge === "after" ? 1 : 0), 0, moved);
  return next;
}

function useLiveSortable({ items, containerRef, onCommit, onPreview, onCancel, setExternalDragging, select, overlayScale = 1 }) {
  const ids = items.map(item => item.id);
  const idsKey = ids.join("|");
  const [previewIds, setPreviewIds] = useState(ids);
  const [activeId, setActiveId] = useState("");
  const dragRef = useRef(null);
  const orderRef = useRef(ids);
  const callbacksRef = useRef({ onCommit, onPreview, onCancel, setExternalDragging, select });
  callbacksRef.current = { onCommit, onPreview, onCancel, setExternalDragging, select };

  useEffect(() => {
    if (!dragRef.current?.started) { setPreviewIds(ids); orderRef.current = ids; }
  }, [idsKey]);
  useEffect(() => () => {
    const drag = dragRef.current;
    if (!drag) return;
    document.removeEventListener("pointermove", drag.move); document.removeEventListener("pointerup", drag.up); document.removeEventListener("pointercancel", drag.cancel); document.removeEventListener("keydown", drag.key); removeOverlay(drag);
  }, []);

  const captureRects = () => {
    const rects = new Map();
    containerRef.current?.querySelectorAll("[data-sort-id]").forEach(node => rects.set(node.dataset.sortId, node.getBoundingClientRect()));
    return rects;
  };
  const animateLayout = previous => requestAnimationFrame(() => {
    containerRef.current?.querySelectorAll("[data-sort-id]").forEach(node => {
      const before = previous.get(node.dataset.sortId); const after = node.getBoundingClientRect();
      if (!before) return;
      const dx = (before.left - after.left) / overlayScale; const dy = (before.top - after.top) / overlayScale;
      if (Math.abs(dx) > .5 || Math.abs(dy) > .5) node.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "translate(0,0)" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  });
  const removeOverlay = drag => { drag?.overlay?.remove(); };

  const finish = (cancelled = false) => {
    const drag = dragRef.current;
    if (!drag) return;
    document.removeEventListener("pointermove", drag.move);
    document.removeEventListener("pointerup", drag.up);
    document.removeEventListener("pointercancel", drag.cancel);
    document.removeEventListener("keydown", drag.key);
    removeOverlay(drag);
    if (drag.started) {
      if (cancelled) {
        orderRef.current = drag.originalIds;
        setPreviewIds(drag.originalIds);
        callbacksRef.current.onCancel?.(drag.originalIds);
      } else if (orderRef.current.join("|") !== drag.originalIds.join("|")) callbacksRef.current.onCommit?.(orderRef.current);
      else callbacksRef.current.onCancel?.(drag.originalIds);
    }
    setActiveId("");
    callbacksRef.current.setExternalDragging?.("");
    dragRef.current = null;
  };

  const start = (event, item) => {
    if (event.button !== 0 || item.locked) return;
    event.preventDefault(); event.stopPropagation();
    const node = event.currentTarget.closest("[data-sort-id]");
    if (!node) return;
    const originalIds = items.map(entry => entry.id);
    orderRef.current = originalIds;
    setPreviewIds(originalIds);
    const drag = { id: item.id, node, originalIds, originX: event.clientX, originY: event.clientY, offsetX: 0, offsetY: 0, started: false, overlay: null };
    drag.move = pointer => {
      if (!drag.started && Math.hypot(pointer.clientX - drag.originX, pointer.clientY - drag.originY) < 5) return;
      if (!drag.started) {
        drag.started = true;
        const rect = node.getBoundingClientRect();
        drag.offsetX = drag.originX - rect.left; drag.offsetY = drag.originY - rect.top;
        const overlay = node.cloneNode(true);
        overlay.removeAttribute("data-sort-id"); overlay.classList.add("canvas-sort-overlay");
        Object.assign(overlay.style, { position: "fixed", zIndex: "9999", left: "0", top: "0", width: `${rect.width / overlayScale}px`, height: `${rect.height / overlayScale}px`, margin: "0", boxSizing: "border-box", pointerEvents: "none", transformOrigin: "0 0" });
        document.body.appendChild(overlay); drag.overlay = overlay;
        setActiveId(item.id); callbacksRef.current.setExternalDragging?.(item.id); callbacksRef.current.select?.(item.id);
      }
      drag.overlay.style.transform = `translate3d(${pointer.clientX - drag.offsetX}px,${pointer.clientY - drag.offsetY}px,0) scale(${overlayScale})`;
      const edge = 72; const speed = pointer.clientY < edge ? -14 : pointer.clientY > window.innerHeight - edge ? 14 : 0;
      if (speed) window.scrollBy({ top: speed, behavior: "auto" });
      const nodes = [...(containerRef.current?.querySelectorAll("[data-sort-id]") || [])].filter(entry => entry.dataset.sortId !== drag.id);
      if (!nodes.length) return;
      const layout = getComputedStyle(containerRef.current); const horizontal = layout.display.includes("flex") && layout.flexDirection.startsWith("row"); const grid = layout.display.includes("grid") && nodes.some((entry, index) => index && Math.abs(entry.getBoundingClientRect().top - nodes[0].getBoundingClientRect().top) < 8);
      let insertIndex = nodes.length;
      if (grid) {
        let nearest = 0; let distance = Infinity;
        nodes.forEach((entry, index) => { const rect = entry.getBoundingClientRect(); const value = Math.hypot(pointer.clientX - (rect.left + rect.width / 2), pointer.clientY - (rect.top + rect.height / 2)); if (value < distance) { distance = value; nearest = index; } });
        const rect = nodes[nearest].getBoundingClientRect(); const sameRow = Math.abs(pointer.clientY - (rect.top + rect.height / 2)) < rect.height * .4;
        insertIndex = nearest + (sameRow ? pointer.clientX > rect.left + rect.width / 2 : pointer.clientY > rect.top + rect.height / 2 ? 1 : 0);
      } else {
        const coordinate = horizontal ? pointer.clientX : pointer.clientY;
        for (let index = 0; index < nodes.length; index += 1) {
          const rect = nodes[index].getBoundingClientRect(); const midpoint = horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
          if (Math.abs(coordinate - midpoint) < 6) return;
          if (coordinate < midpoint) { insertIndex = index; break; }
        }
      }
      const rest = orderRef.current.filter(id => id !== drag.id); const next = [...rest]; next.splice(insertIndex, 0, drag.id);
      if (next.join("|") === orderRef.current.join("|")) return;
      const previous = captureRects(); orderRef.current = next; setPreviewIds(next); callbacksRef.current.onPreview?.(next); animateLayout(previous);
    };
    drag.up = () => finish(false); drag.cancel = () => finish(true); drag.key = keyEvent => { if (keyEvent.key === "Escape") finish(true); };
    dragRef.current = drag;
    document.addEventListener("pointermove", drag.move, { passive: false });
    document.addEventListener("pointerup", drag.up, { once: true });
    document.addEventListener("pointercancel", drag.cancel, { once: true });
    document.addEventListener("keydown", drag.key);
  };

  const itemMap = new Map(items.map(item => [item.id, item]));
  return { orderedItems: previewIds.map(id => itemMap.get(id)).filter(Boolean), activeId, start };
}

export default function UniversalVisualEditor({ page, pages = [], onChange, onSwitch = () => {}, notify, context = "page", focusBlockId = "", elementTypes = ELEMENTS, saveState = "saved", lastModified = "", onBack }) {
  const initialSelection = focusBlockId || page.blocks?.[0]?.id || "page";
  const [selectedId, setSelectedId] = useState(initialSelection);
  const [selectedElement, setSelectedElement] = useState("");
  const [selectedDom, setSelectedDom] = useState(null);
  const [inspectorTab, setInspectorTab] = useState("content");
  const [expanded, setExpanded] = useState({ page: true });
  const [dragging, setDragging] = useState("");
  const [savedBlocks, setSavedBlocks] = useState([]);
  const [forms, setForms] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [media, setMedia] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [scale, setScale] = useState(.55);
  const [library, setLibrary] = useState("elements");
  const [librarySearch, setLibrarySearch] = useState("");
  const [device, setDevice] = useState("desktop");
  const [engineHistory, setEngineHistory] = useState([]);
  const [engineFuture, setEngineFuture] = useState([]);
  const [reusableDialog, setReusableDialog] = useState(null);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const allBlocks = useMemo(() => [...(page.blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder), [page.blocks]);
  const blocks = useMemo(() => context === "page" ? allBlocks : allBlocks.filter(block => block.id === focusBlockId), [allBlocks, context, focusBlockId]);
  const selected = blocks.find(block => block.id === selectedId);
  const availableTypes = useMemo(() => [...new Set(pages.flatMap(item => (item.blocks || []).map(block => block.type)))], [pages]);

  useEffect(() => { Promise.all([api("/saved-blocks"), api("/forms"), api("/widgets"), api("/media")]).then(([saved, formItems, widgetItems, mediaItems]) => { setSavedBlocks(saved); setForms(formItems); setWidgets(widgetItems); setMedia(mediaItems); }).catch(error => notify(error.message, "error")); }, []);
  const uploadMedia = async file => { if (!file) return null; const body = new FormData(); body.append("file", file); try { const item = await api("/media", { method: "POST", body }); setMedia(current => [item, ...current]); notify("Image importée"); return item; } catch (error) { notify(error.message, "error"); return null; } };
  useEffect(() => {
    const resize = () => {
      const width = DEVICES[device].width;
      setScale(Math.min(1, Math.max(.25, (stageRef.current?.clientWidth || 800) / width)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [device]);
  useEffect(() => { setSelectedId(focusBlockId || page.blocks?.[0]?.id || "page"); setSelectedElement(""); setSelectedDom(null); setEngineHistory([]); setEngineFuture([]); }, [page._id, focusBlockId, context]);

  const commit = next => {
    setEngineHistory(items => [...items.slice(-39), structuredClone(page)]);
    setEngineFuture([]);
    onChange(next);
  };
  const undoEngine = () => setEngineHistory(items => {
    if (!items.length) return items;
    const previous = items.at(-1);
    setEngineFuture(next => [structuredClone(page), ...next].slice(0, 40));
    onChange(previous);
    notify("Modification annulée");
    return items.slice(0, -1);
  });
  const redoEngine = () => setEngineFuture(items => {
    if (!items.length) return items;
    const next = items[0];
    setEngineHistory(previous => [...previous.slice(-39), structuredClone(page)]);
    onChange(next);
    notify("Modification rétablie");
    return items.slice(1);
  });
  const writeBlocks = next => {
    if (context === "page") return commit({ ...page, blocks: next.map((block, index) => ({ ...block, sortOrder: index })) });
    const replacements = new Map(next.map(block => [block.id, block]));
    commit({ ...page, blocks: allBlocks.map(block => replacements.get(block.id) || block) });
  };
  const updateBlock = patch => selected && writeBlocks(blocks.map(block => block.id === selected.id ? { ...block, ...patch } : block));
  const updateContent = (key, value) => updateBlock({ content: { ...(selected.content || {}), [key]: value } });
  const updateChild = (id, patch) => updateBlock({ children: (selected.children || []).map(child => child.id === id ? { ...child, ...patch } : child) });
  const moveChild = (id, direction) => { const children = [...(selected?.children || [])]; const index = children.findIndex(child => child.id === id); const target = index + direction; if (index < 0 || target < 0 || target >= children.length) return; [children[index], children[target]] = [children[target], children[index]]; updateBlock({ children }); };
  const reorderChild = (fromId, toId, edge = "before") => {
    const children = selected?.children || [];
    const next = reorderByEdge(children, fromId, toId, edge);
    if (next === children) return;
    updateBlock({ children: next });
    setDragging("");
    notify("Ordre des éléments mis à jour");
  };
  const removeBlock = async block => {
    if (block.locked || ["header", "footer"].includes(block.type)) return notify("Ce composant global est protégé.", "error");
    if (!await confirmAction({ title: "Supprimer ce bloc ?", message: `« ${block.label} » sera retiré de la page lors de la sauvegarde.`, confirmLabel: "Supprimer" })) return;
    const next = blocks.filter(item => item.id !== block.id);
    writeBlocks(next); setSelectedId(next[0]?.id || "page");
  };
  const move = (fromId, toId, edge = "before") => {
    const next = reorderByEdge(blocks, fromId, toId, edge);
    if (next === blocks) return;
    writeBlocks(next);
  };
  const commitBlockOrder = orderedIds => {
    const map = new Map(blocks.map(block => [block.id, block]));
    const next = orderedIds.map(id => map.get(id)).filter(Boolean);
    if (next.length === blocks.length && next.some((block, index) => block.id !== blocks[index].id)) writeBlocks(next);
  };
  const commitChildOrder = orderedIds => {
    const children = selected?.children || []; const map = new Map(children.map(child => [child.id, child])); const visible = new Set(orderedIds); let cursor = 0;
    const next = children.map(child => visible.has(child.id) ? map.get(orderedIds[cursor++]) : child);
    if (next.some((child, index) => child.id !== children[index].id)) updateBlock({ children: next });
  };
  const previewFrameOrder = orderedIds => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || context !== "page") return;
    const map = new Map(blocks.map(block => [block.id, block]));
    orderedIds.forEach(id => {
      const block = map.get(id); if (!block) return;
      const selector = block.sourcePageKey && block.sourcePageKey !== "home" ? `#${CSS.escape(block.sourcePageKey)}` : BLOCK_SELECTORS[block.type];
      const node = selector ? doc.querySelector(selector) : null;
      if (node?.parentElement) node.parentElement.appendChild(node);
    });
  };
  const insert = (source, index = blocks.length) => {
    const block = cloneBlock(source);
    const next = [...blocks]; next.splice(index, 0, block); writeBlocks(next); setSelectedId(block.id);
  };
  const createType = (type, index = blocks.length) => insert({ type, label: type === "blank" ? "Section vide" : type, visible: true, content: type === "projects" ? { title: "Selected Work", limit: 6 } : { title: "Nouveau titre", body: "Nouveau contenu" }, settings: {}, children: [] }, index);
  const addElement = type => {
    if (!selected) return notify("Sélectionnez d’abord un bloc.", "error");
    const child = { id: newId(type), type, label: type, visible: true, locked: false, content: type === "image" ? { src: "", alt: "" } : { text: type === "button" ? "Button" : "New content" }, settings: {} };
    updateBlock({ children: [...(selected.children || []), child] }); setSelectedElement(child.id);
  };
  function saveReusable(scope = "saved") {
    if (!selected) return;
    setReusableDialog({ scope, name: selected.label || "Bloc" });
  }
  async function commitReusable() {
    if (!selected || !reusableDialog?.name.trim()) return;
    const { scope } = reusableDialog;
    const name = reusableDialog.name.trim();
    try {
      const saved = await api("/saved-blocks", { method: "POST", body: JSON.stringify({ name, scope, block: selected }) });
      setSavedBlocks(items => [saved, ...items]);
      if (scope === "global") updateBlock({ globalId: saved._id });
      setReusableDialog(null);
      notify(scope === "global" ? "Bloc global créé" : "Bloc enregistré");
    } catch (error) { notify(error.message, "error"); }
  }
  async function deleteSaved(item) {
    if (!await confirmAction({ title: "Supprimer le bloc réutilisable ?", message: `« ${item.name} » sera supprimé de la bibliothèque. Les blocs globaux encore utilisés restent protégés.`, confirmLabel: "Supprimer" })) return;
    try { await api(`/saved-blocks/${item._id}`, { method: "DELETE" }); setSavedBlocks(items => items.filter(entry => entry._id !== item._id)); notify("Bloc supprimé"); }
    catch (error) { notify(error.message, "error"); }
  }
  async function copyToPage(targetKey) {
    if (!selected || !targetKey) return;
    try {
      const target = pages.find(item => item.key === targetKey);
      const saved = await api(`/pages/${targetKey}`, { method: "PUT", body: JSON.stringify({ ...target, blocks: [...(target.blocks || []), cloneBlock(selected)] }) });
      notify(`Bloc copié vers ${saved.title || saved.key}`);
    } catch (error) { notify(error.message, "error"); }
  }
  const updateDomElement = (key, value) => {
    if (!selectedDom?.node) return;
    if (key === "src") {
      selectedDom.node.setAttribute("src", mediaUrl(value));
      updateContent("image", value);
      notify("Image remplacée");
    } else if (key === "alt") {
      selectedDom.node.setAttribute("alt", value);
      updateContent("imageAlt", value);
    } else if (key === "href") {
      selectedDom.node.setAttribute("href", value);
      updateContent("ctaUrl", value);
    } else if (key === "objectFit") {
      selectedDom.node.style.objectFit = value;
      updateBlock({ settings: { ...(selected.settings || {}), imageFit: value } });
    } else {
      selectedDom.node.textContent = value;
      updateContent(selectedDom.kind === "heading" ? "title" : selectedDom.kind === "button" ? "ctaLabel" : "body", value);
    }
    setSelectedDom(current => ({ ...current, [key]: value, text: key === "text" ? value : current.text }));
  };
  const removeElement = async () => {
    const child = (selected?.children || []).find(item => item.id === selectedElement);
    if (!child || !await confirmAction({ title: "Supprimer cet élément ?", message: `« ${child.label} » sera retiré du bloc.`, confirmLabel: "Supprimer" })) return;
    updateBlock({ children: (selected.children || []).filter(item => item.id !== selectedElement) });
    setSelectedElement("");
    notify("Élément supprimé");
  };
  const autoScroll = event => { const rect = event.currentTarget.getBoundingClientRect(); const edge = 70; if (event.clientY < rect.top + edge) event.currentTarget.scrollBy({ top: -18, behavior: "smooth" }); else if (event.clientY > rect.bottom - edge) event.currentTarget.scrollBy({ top: 18, behavior: "smooth" }); };

  const scopeCanvas = (doc, target) => {
    if (context === "page" || !doc) return target;
    if (!target) {
      const blank = doc.createElement("section");
      blank.className = "cms-blank-section";
      blank.style.cssText = "min-height:900px;padding:120px 8vw;background:#f4f1ea;color:#171715";
      const kicker = doc.createElement("small"); kicker.textContent = "BLANK SECTION";
      const title = doc.createElement("h2"); title.style.cssText = "font-size:72px;margin:18px 0"; title.textContent = selected?.content?.title || selected?.label || "New section";
      const body = doc.createElement("p"); body.style.cssText = "font-size:22px;max-width:720px"; body.textContent = selected?.content?.body || "Add elements from the shared library.";
      blank.append(kicker, title, body);
      doc.body.replaceChildren(blank);
      doc.body.style.margin = "0";
      doc.body.style.minWidth = "0";
      doc.body.style.width = "100%";
      return blank;
    }
    // Keep the real node inside its original ancestor tree. Moving or cloning it
    // changes descendant selectors, container widths, sticky positioning and media queries.
    let branch = target;
    while (branch?.parentElement && branch !== doc.body) {
      const parent = branch.parentElement;
      [...parent.children].forEach(sibling => {
        if (sibling !== branch) {
          sibling.dataset.cmsScopeHidden = "true";
          sibling.style.setProperty("display", "none", "important");
        }
      });
      branch = parent;
    }
    target.dataset.cmsScopeActive = "true";
    doc.body.style.minWidth = "0";
    doc.body.style.width = "100%";
    doc.documentElement.scrollTop = 0;
    doc.body.scrollTop = 0;
    return target;
  };

  const selectCanvasNode = node => {
    const doc = frameRef.current?.contentDocument;
    if (!node || !doc) return;
    doc.querySelectorAll("[data-cms-element-selected]").forEach(item => {
      item.style.outline = "";
      item.style.outlineOffset = "";
      item.removeAttribute("data-cms-element-selected");
    });
    node.dataset.cmsElementSelected = "true";
    const overlaySize = Math.max(3, Math.round(3 / scale));
    node.style.outline = `${overlaySize}px solid #d9ff43`;
    node.style.outlineOffset = `${overlaySize}px`;
    const tag = node.tagName.toLowerCase();
    const kind = tag === "img" ? "image" : /^h[1-6]$/.test(tag) ? "heading" : tag === "p" ? "text" : tag === "a" || tag === "button" ? "button" : tag === "input" || tag === "textarea" || tag === "select" ? "field" : tag === "form" ? "form" : "container";
    setSelectedElement(`dom:${kind}`);
    setSelectedDom({ kind, tag, text: node.textContent?.trim() || "", src: node.getAttribute("src") || "", alt: node.getAttribute("alt") || "", node });
  };

  const targetSelector = page.key === "home" ? "#top" : `#${CSS.escape(page.key)}`;
  const selectedChild = selectedElement && !selectedElement.startsWith("dom:") ? (selected?.children || []).find(child => child.id === selectedElement) : null;
  const onFrameLoad = () => {
    const doc = frameRef.current?.contentDocument;
    const selectedSelector = ["form", "widget"].includes(context) ? "" : selected?.sourcePageKey && selected.sourcePageKey !== "home" ? `#${CSS.escape(selected.sourcePageKey)}` : (BLOCK_SELECTORS[selected?.type] || targetSelector);
    let target = selectedSelector ? doc?.querySelector(selectedSelector) : null;
    target?.scrollIntoView({ block: "start" });
    target = scopeCanvas(doc, target) || target;
    if (target) { target.style.outline = "4px solid #d9ff43"; target.style.outlineOffset = "-4px"; }
    const click = event => {
      const action = event.target.closest("a,button,form,input,textarea,select");
      if (action) { event.preventDefault(); event.stopPropagation(); }
      if (context !== "page") {
        const editable = event.target.closest("img,h1,h2,h3,h4,h5,h6,p,a,button,input,textarea,select,form,[data-cms-editable]");
        selectCanvasNode(editable || event.target.closest("div,section,article"));
        return;
      }
      const node = event.target.closest(Object.values(BLOCK_SELECTORS).join(","));
      if (!node) return;
      event.preventDefault(); event.stopPropagation();
      const type = Object.entries(BLOCK_SELECTORS).find(([, selector]) => node.matches(selector))?.[0];
      const sectionKey = node.id && node.id !== "top" ? node.id : "home";
      const owner = pages.find(item => (item.blocks || []).some(block => block.sourcePageKey === sectionKey || block.type === type));
      const block = owner?.blocks?.find(item => item.sourcePageKey === sectionKey) || owner?.blocks?.find(item => item.type === type);
      if (owner && owner.key !== page.key) onSwitch(owner.key, block?.id);
      else if (block) {
        setSelectedId(block.id);
        const editable = event.target.closest("img,h1,h2,h3,h4,h5,h6,p,a,button,input,textarea,select,form,[data-cms-editable]");
        if (editable) selectCanvasNode(editable);
        else { setSelectedElement(""); setSelectedDom(null); }
      }
    };
    doc?.addEventListener("click", click, true);
    doc?.addEventListener("submit", event => { event.preventDefault(); event.stopPropagation(); }, true);
  };
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const main = doc.querySelector("main");
    if (context === "page" && main) blocks.forEach(block => { const node = doc.querySelector(BLOCK_SELECTORS[block.type]); if (node?.parentElement === main) main.appendChild(node); });
    doc.querySelectorAll("[data-cms-admin-highlight]").forEach(node => { node.style.outline = ""; node.removeAttribute("data-cms-admin-highlight"); });
    const selectedSelector = ["form", "widget"].includes(context) ? ".cms-blank-section" : selected?.sourcePageKey && selected.sourcePageKey !== "home" ? `#${CSS.escape(selected.sourcePageKey)}` : (BLOCK_SELECTORS[selected?.type] || targetSelector);
    const target = doc.querySelector(selectedSelector);
    if (target) {
      target.dataset.cmsAdminHighlight = "true"; target.style.outline = "4px solid #d9ff43"; target.style.outlineOffset = "-4px";
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const content = selected?.content || {};
      const heading = target.querySelector("h1,h2,h3"); const body = target.querySelector("p:not(.micro)"); const eyebrow = target.querySelector(".micro,.hero-ref__role"); const link = target.querySelector("a"); const image = target.querySelector("img");
      if (heading && content.title) heading.textContent = content.title;
      if (body && content.body) body.textContent = content.body;
      if (eyebrow && content.eyebrow) eyebrow.textContent = content.eyebrow;
      if (link && content.ctaLabel) link.textContent = `${content.ctaLabel} ↗`;
      if (image && content.image) image.src = mediaUrl(content.image);
      if (image && content.imageAlt) image.alt = content.imageAlt;
      if (image && selected?.settings?.imageFit) image.style.objectFit = selected.settings.imageFit;
      if (heading) { heading.contentEditable = "true"; heading.onblur = event => updateContent("title", event.currentTarget.textContent.trim()); }
      if (body) { body.contentEditable = "true"; body.onblur = event => updateContent("body", event.currentTarget.textContent.trim()); }
      if (eyebrow) { eyebrow.contentEditable = "true"; eyebrow.onblur = event => updateContent("eyebrow", event.currentTarget.textContent.trim()); }
      if (link) { link.contentEditable = "true"; link.onclick = event => event.preventDefault(); link.onblur = event => updateContent("ctaLabel", event.currentTarget.textContent.replace(/↗/g, "").trim()); }
      target.style.display = selected?.visible === false ? "none" : "";
    }
  }, [page.key, selectedId, selected?.content, selected?.visible, blocks]);

  return <div className="universal-builder">
    <aside className="universal-sidebar">
      <div className="universal-library-head"><input type="search" value={librarySearch} onChange={event => setLibrarySearch(event.target.value)} placeholder="Rechercher un élément…" aria-label="Rechercher dans la bibliothèque"/><div className="universal-tabs">{[["elements", "Éléments"], ["structure", "Structure"], ["reusable", "Réutilisable"]].map(([tab, label]) => <button className={library === tab ? "active" : ""} onClick={() => setLibrary(tab)} key={tab}>{label}</button>)}</div></div>
      {library === "elements" && <details className="library-group" open><summary>Éléments</summary><div className="universal-library">{elementTypes.filter(type => type.includes(librarySearch.toLowerCase())).map(type => <button onClick={() => addElement(type)} key={type}><Icon name="plus"/><span>{type}</span></button>)}</div></details>}
      {library === "structure" && <details className="library-group" open><summary>Sections et conteneurs</summary><div className="universal-library">{context === "page" ? <>{availableTypes.filter(type => type.includes(librarySearch.toLowerCase())).map(type => <button draggable onDragStart={event => event.dataTransfer.setData("application/x-cms-type", type)} onClick={() => createType(type)} key={type}><Icon name="plus"/><span>{type}</span></button>)}<button onClick={() => createType("blank")}><Icon name="plus"/><span>Section vide</span></button></> : <><button onClick={() => addElement("container")}><Icon name="plus"/><span>Container</span></button><small>Le contexte reste limité à l’entité sélectionnée.</small></>}</div></details>}
      {library === "reusable" && <><details className="library-group" open><summary>Blocs enregistrés</summary><div className="universal-library">{savedBlocks.filter(item => item.name.toLowerCase().includes(librarySearch.toLowerCase())).map(item => <div className="saved-library-row" key={item._id}><button onClick={() => insert({ ...item.block, globalId: item.scope === "global" ? item._id : "" })}><Icon name={item.scope === "global" ? "external" : "plus"}/><span>{item.name}<small>{item.scope}</small></span></button><button className="icon-button" onClick={() => void deleteSaved(item)}><Icon name="trash"/></button></div>)}</div></details><details className="library-group"><summary>Formulaires et widgets</summary><div className="universal-library">{forms.filter(item => item.status === "published" && item.name.toLowerCase().includes(librarySearch.toLowerCase())).map(item => <button key={item._id} onClick={() => insert({ type: "form", label: item.name, visible: true, content: { formId: item._id, slug: item.slug, title: item.name }, settings: {}, children: [] })}><Icon name="plus"/><span>{item.name}<small>Formulaire</small></span></button>)}{widgets.filter(item => item.status === "published" && item.name.toLowerCase().includes(librarySearch.toLowerCase())).map(item => <button key={item._id} onClick={() => insert({ type: "widget", label: item.name, visible: true, content: { widgetId: item._id, title: item.name }, settings: {}, children: [] })}><Icon name="plus"/><span>{item.name}<small>{item.type}</small></span></button>)}</div></details></>}
      <div className="navigator-title"><b>Navigator</b><small>Page → Bloc → Élément</small></div>
      <div className="universal-tree"><button className={selectedId === "page" ? "active" : ""} onClick={() => setSelectedId("page")}><span onClick={event => { event.stopPropagation(); setExpanded(value => ({ ...value, page: !value.page })); }}>{expanded.page ? "▾" : "▸"}</span><b>{page.title || page.key}</b><small>{context.toUpperCase()}</small></button>{expanded.page && blocks.map(block => <div key={block.id}><button className={selectedId === block.id && !selectedElement ? "active" : ""} draggable={context === "page" && !block.locked} onDragStart={event => { setDragging(block.id); event.dataTransfer.setData("text/plain", block.id); }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (context === "page") move(event.dataTransfer.getData("text/plain"), block.id); setDragging(""); }} onClick={() => { setSelectedId(block.id); setSelectedElement(""); setSelectedDom(null); }}><span onClick={event => { event.stopPropagation(); setExpanded(value => ({ ...value, [block.id]: !value[block.id] })); }}>{expanded[block.id] ? "▾" : "▸"}</span><b>{block.label}</b><small>{block.globalId ? "GLOBAL" : block.visible === false ? "MASQUÉ" : block.type}</small></button>{expanded[block.id] && (block.children || []).map(child => <button className={`tree-child ${selectedElement === child.id ? "active" : ""}`} draggable={!child.locked} onDragStart={event => { event.stopPropagation(); setDragging(child.id); event.dataTransfer.setData("application/x-cms-element", child.id); }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); reorderChild(event.dataTransfer.getData("application/x-cms-element"), child.id); }} onClick={() => { setSelectedId(block.id); setSelectedElement(child.id); setSelectedDom(null); }} key={child.id}><span>⠿</span><b>{child.label}</b><small>{child.type}</small></button>)}</div>)}</div>
    </aside>
    <section className={`universal-stage ${dragging ? "drag-active" : ""}`} ref={stageRef} onDragOver={event => { event.preventDefault(); autoScroll(event); }} onDrop={event => { const type = event.dataTransfer.getData("application/x-cms-type"); if (type) createType(type); }}>
      <div className="universal-stage-toolbar">{context === "page" ? <label>Page <select value={page.key} onChange={event => onSwitch(event.target.value)}>{pages.map(item => <option value={item.key} key={item._id}>{item.title || item.key}</option>)}</select></label> : <b>{context.toUpperCase()} · {selected?.label}</b>}<div className="device-switch" role="group" aria-label="Format du canvas">{Object.entries(DEVICES).map(([key, item]) => <button className={device === key ? "active" : ""} onClick={() => setDevice(key)} key={key}>{item.label}</button>)}</div><span>{DEVICES[device].width} × {DEVICES[device].height} · {Math.round(scale * 100)}%</span></div>
      <div className={`universal-frame-clip device-${device}`} style={{ height: DEVICES[device].height * scale, width: DEVICES[device].width * scale, maxWidth: "100%", marginInline: "auto" }}><iframe ref={frameRef} title={`Aperçu ${page.title} — ${DEVICES[device].label}`} src={`/?cms-preview=${encodeURIComponent(page.key)}`} onLoad={onFrameLoad} style={{ width: DEVICES[device].width, height: DEVICES[device].height, transform: `scale(${scale})` }}/>{selected && !!selected.children?.length && <CanvasElementsLayer block={selected} viewport={DEVICES[device]} scale={scale} selectedId={selectedElement} select={id => { setSelectedElement(id); setSelectedDom(null); }} updateChild={updateChild} commitOrder={commitChildOrder} setDragging={setDragging} notify={notify}/>}</div>
      {context === "page" && <CanvasBlockStrip blocks={blocks} selectedId={selectedId} setDragging={setDragging} select={setSelectedId} commitOrder={commitBlockOrder} previewOrder={previewFrameOrder} createType={createType} notify={notify}/>} 
    </section>
    <aside className="universal-inspector">
      <div className="inspector-tabs" role="tablist">{["content", "style", "advanced"].map(tab => <button role="tab" aria-selected={inspectorTab === tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)} key={tab}>{tab}</button>)}</div>
      {inspectorTab === "content" && (selectedElement.startsWith("dom:") && selectedDom && selected ?
        <DomElementInspector element={selectedDom} block={selected} media={media} uploadMedia={uploadMedia} update={updateDomElement}/> :
        selectedElement && selected ? <ElementInspector element={(selected.children || []).find(child => child.id === selectedElement)} media={media} uploadMedia={uploadMedia} update={patch => updateChild(selectedElement, patch)} duplicate={() => { const child=(selected.children||[]).find(item=>item.id===selectedElement); if(child)updateBlock({children:[...(selected.children||[]),{...structuredClone(child),id:newId(child.type),label:`${child.label} (copie)`}]}); }} moveUp={() => moveChild(selectedElement,-1)} moveDown={() => moveChild(selectedElement,1)} remove={() => void removeElement()}/> :
        selected ? <><div className="navigator-title"><b>{selected.label}</b><small>{selected.globalId ? "Global Component" : "SECTION / BLOCK"}</small></div>{selected.globalId && <div className="global-warning">Ce bloc peut être utilisé sur plusieurs pages. Modifiez-le globalement ou dissociez cette instance.</div>}<label className="field"><span>Nom interne</span><input value={selected.label} onChange={event => updateBlock({ label: event.target.value })}/></label>{Object.entries(selected.content || {}).map(([key, value]) => <label className="field" key={key}><span>{key}</span>{typeof value === "number" ? <input type="number" value={value} onChange={event => updateContent(key, Number(event.target.value))}/> : <textarea rows={key === "body" ? 5 : 2} value={value ?? ""} onChange={event => updateContent(key, event.target.value)}/>}</label>)}<div className="inspector-action-grid"><button onClick={() => insert(selected)}>Dupliquer</button><button onClick={() => { setClipboard(structuredClone(selected)); notify("Bloc copié"); }}>Copier</button><button disabled={!clipboard} onClick={() => insert(clipboard)}>Coller</button><button onClick={() => void saveReusable("saved")}>Enregistrer</button><button onClick={() => void saveReusable("global")}>Rendre global</button>{selected.globalId && <button onClick={() => updateBlock({ globalId: "" })}>Dissocier</button>}<button className="danger-link" onClick={() => void removeBlock(selected)}>Supprimer</button></div>{context === "page" && <label className="field"><span>Copier vers une page</span><select value="" onChange={event => void copyToPage(event.target.value)}><option value="">Choisir…</option>{pages.filter(item => item.key !== page.key).map(item => <option key={item.key} value={item.key}>{item.title || item.key}</option>)}</select></label>}</> : <EmptyState icon="pages" title="Page sélectionnée" text="Choisissez un bloc dans le Navigator ou le bandeau du canvas."/>)}
      {inspectorTab === "style" && <InspectorStylePanel element={selectedChild} block={selected} updateElement={patch => selectedChild && updateChild(selectedChild.id, patch)} updateBlock={updateBlock}/>} 
      {inspectorTab === "advanced" && <InspectorAdvancedPanel element={selectedChild} block={selected} context={context} updateElement={patch => selectedChild && updateChild(selectedChild.id, patch)} updateBlock={updateBlock}/>} 
      <section className="editor-context-status"><div><span className={`save-dot ${saveState}`}/><b>{saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Unsaved changes"}</b></div><small>{context === "header" ? "Global Header · les changements peuvent affecter tout le site" : `${context.toUpperCase()} · ${page.status || "published"}`}</small>{lastModified && <small>Dernière sauvegarde : {new Date(lastModified).toLocaleString("fr-FR")}</small>}<details><summary>Historique</summary><div className="information-history-actions"><button onClick={undoEngine} disabled={!engineHistory.length}>Undo</button><button onClick={redoEngine} disabled={!engineFuture.length}>Redo</button></div><small>{engineHistory.length} modification(s) récente(s)</small></details></section>
    </aside>
    {reusableDialog && <div className="editor-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setReusableDialog(null); }}><section className="editor-name-dialog" role="dialog" aria-modal="true" aria-labelledby="reusable-dialog-title"><span className="admin-kicker">BIBLIOTHÈQUE</span><h2 id="reusable-dialog-title">{reusableDialog.scope === "global" ? "Créer un bloc global" : "Enregistrer le bloc"}</h2><label className="field"><span>Nom du bloc</span><input autoFocus value={reusableDialog.name} onChange={event => setReusableDialog(current => ({ ...current, name: event.target.value }))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void commitReusable(); } }}/></label><footer><button className="button secondary" onClick={() => setReusableDialog(null)}>Annuler</button><button className="button primary" disabled={!reusableDialog.name.trim()} onClick={() => void commitReusable()}>Enregistrer</button></footer></section></div>}
  </div>;
}

function CanvasBlockStrip({ blocks, selectedId, setDragging, select, commitOrder, previewOrder, createType, notify }) {
  const containerRef = useRef(null);
  const sortable = useLiveSortable({ items: blocks, containerRef, onCommit: ids => { commitOrder(ids); notify("Ordre des sections mis à jour"); }, onPreview: previewOrder, onCancel: previewOrder, setExternalDragging: setDragging, select });
  return <div className={`canvas-block-strip ${sortable.activeId ? "sorting" : ""}`} ref={containerRef}>
    {sortable.orderedItems.map((block, index) => <div data-sort-id={block.id} className={`${selectedId === block.id ? "selected" : ""} ${sortable.activeId === block.id ? "sort-placeholder" : ""}`} key={block.id} onClick={() => select(block.id)}>
      <button className="strip-add" title="Ajouter une section ici" onClick={event => { event.stopPropagation(); createType("blank", index); notify("Section ajoutée"); }}>+</button>
      <button className="canvas-drag-grip" aria-label={`Déplacer ${block.label}`} disabled={block.locked} onPointerDown={event => sortable.start(event, block)}>⠿</button>
      <b>{block.label}</b><small>{block.visible === false ? "Masqué" : block.type}</small>
    </div>)}
  </div>;
}

function InspectorStylePanel({ element, block, updateElement, updateBlock }) {
  const target = element || block;
  if (!target) return <EmptyState icon="edit" title="Aucune sélection" text="Sélectionnez un élément dans le canvas."/>;
  const settings = target.settings || {};
  const change = patch => element ? updateElement({ settings: { ...settings, ...patch } }) : updateBlock({ settings: { ...settings, ...patch } });
  return <div className="inspector-tab-panel"><div className="navigator-title"><b>Style</b><small>{element?.type || block?.type}</small></div><details open><summary>Dimensions et alignement</summary><label className="field"><span>Largeur</span><input value={settings.width || "auto"} onChange={event => change({ width: event.target.value })}/></label><label className="field"><span>Alignement</span><select value={settings.align || "left"} onChange={event => change({ align: event.target.value })}><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select></label></details><details><summary>Espacement</summary><label className="field"><span>Marge</span><input value={settings.margin || ""} onChange={event => change({ margin: event.target.value })} placeholder="0"/></label><label className="field"><span>Padding</span><input value={settings.padding || ""} onChange={event => change({ padding: event.target.value })} placeholder="0"/></label></details></div>;
}

function InspectorAdvancedPanel({ element, block, context, updateElement, updateBlock }) {
  const target = element || block;
  if (!target) return <EmptyState icon="edit" title="Aucune sélection" text="Sélectionnez un élément dans le canvas."/>;
  const change = patch => element ? updateElement(patch) : updateBlock(patch);
  return <div className="inspector-tab-panel"><div className="navigator-title"><b>Advanced</b><small>{context.toUpperCase()}</small></div><label className="visibility-toggle"><input type="checkbox" checked={target.visible !== false} onChange={event => change({ visible: event.target.checked })}/> Visible</label><label className="visibility-toggle"><input type="checkbox" checked={!!target.locked} onChange={event => change({ locked: event.target.checked })}/> Verrouillé</label><details><summary>Identité technique</summary><label className="field"><span>ID</span><input value={target.id || ""} disabled/></label><label className="field"><span>Type</span><input value={target.type || ""} disabled/></label></details></div>;
}

function CanvasElementsLayer({ block, viewport, scale, selectedId, select, updateChild, commitOrder, setDragging, notify }) {
  const containerRef = useRef(null);
  const visibleChildren = (block.children || []).filter(child => child.visible !== false);
  const sortable = useLiveSortable({ items: visibleChildren, containerRef, onCommit: ids => { commitOrder(ids); notify("Ordre des éléments mis à jour"); }, setExternalDragging: setDragging, select, overlayScale: scale });
  const beginPointerAction = (event, child, action) => {
    if (child.locked || child.settings?.position !== "free") return;
    event.preventDefault(); event.stopPropagation(); select(child.id);
    const node = event.currentTarget.closest("[data-canvas-child]");
    const start = { x: event.clientX, y: event.clientY, left: Number(child.settings?.x) || 0, top: Number(child.settings?.y) || 0, width: Number(child.settings?.widthPx) || node.offsetWidth, height: Number(child.settings?.heightPx) || node.offsetHeight };
    const move = pointer => {
      const dx = (pointer.clientX - start.x) / scale; const dy = (pointer.clientY - start.y) / scale;
      if (action === "move") node.style.transform = `translate(${start.left + dx}px,${start.top + dy}px)`;
      else { const width = Math.max(40, start.width + dx); const height = child.type === "image" ? width / Math.max(.1, start.width / start.height) : Math.max(24, start.height + dy); node.style.width = `${width}px`; node.style.height = `${height}px`; }
    };
    const finish = pointer => {
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", finish);
      const dx = (pointer.clientX - start.x) / scale; const dy = (pointer.clientY - start.y) / scale;
      const width = Math.max(40, start.width + dx); const height = child.type === "image" ? width / Math.max(.1, start.width / start.height) : Math.max(24, start.height + dy);
      updateChild(child.id, { settings: { ...child.settings, ...(action === "move" ? { x: Math.round(start.left + dx), y: Math.round(start.top + dy) } : { widthPx: Math.round(width), heightPx: Math.round(height) }) } });
      notify(action === "move" ? "Position mise à jour" : "Dimensions mises à jour");
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", finish, { once: true });
  };
  return <div className={`canvas-elements-layer ${sortable.activeId ? "sorting" : ""}`} ref={containerRef} style={{ width: viewport.width, height: viewport.height, transform: `scale(${scale})` }}>
    {sortable.orderedItems.map(child => {
      const settings = child.settings || {}; const free = settings.position === "free";
      const style = free ? { transform: `translate(${Number(settings.x) || 0}px,${Number(settings.y) || 0}px)`, width: settings.widthPx || "auto", height: settings.heightPx || "auto" } : {};
      return <div data-sort-id={free ? undefined : child.id} data-canvas-child={child.id} className={`canvas-child-element ${free ? "free" : "flow"} ${selectedId === child.id ? "selected" : ""} ${sortable.activeId === child.id ? "sort-placeholder" : ""}`} style={style} key={child.id} onClick={event => { event.stopPropagation(); select(child.id); }}>
          <button draggable={false} className="canvas-child-handle" style={{ fontSize: `${Math.max(10, 8 / scale)}px` }} onPointerDown={event => free ? beginPointerAction(event, child, "move") : sortable.start(event, child)}>⠿ {child.label}</button>
          <CanvasChildContent child={child} update={patch => updateChild(child.id, patch)}/>
          {free && <button className="canvas-resize-handle" aria-label="Redimensionner" onPointerDown={event => beginPointerAction(event, child, "resize")}/>} 
        </div>;
    })}
  </div>;
}

function CanvasChildContent({ child, update }) {
  const content = child.content || {};
  if (["text", "email", "phone", "textarea", "select", "checkbox", "radio", "number", "date"].includes(child.type) && content.field === true) return <label className="canvas-field-preview"><span>{content.label || child.label}{content.required && " *"}</span>{child.type === "textarea" ? <textarea readOnly tabIndex={-1} placeholder={content.placeholder || ""}/> : child.type === "select" ? <select tabIndex={-1} onMouseDown={event => event.preventDefault()}><option>{content.placeholder || "Choisir…"}</option></select> : <input readOnly tabIndex={-1} type={["email", "number", "date"].includes(child.type) ? child.type : "text"} placeholder={content.placeholder || ""}/>}</label>;
  if (child.type === "submit") return <button type="button">{content.label || child.label || "Envoyer"}</button>;
  const inline = { contentEditable: true, suppressContentEditableWarning: true, onDoubleClick: event => event.currentTarget.focus(), onBlur: event => update({ content: { ...content, text: event.currentTarget.textContent.trim() } }) };
  if (child.type === "heading") return <h2 {...inline}>{content.text || "Heading"}</h2>;
  if (child.type === "text") return <p {...inline}>{content.text || "Text"}</p>;
  if (child.type === "image") return content.src ? <img src={mediaUrl(content.src)} alt={content.alt || ""}/> : <span>Choisir une image</span>;
  if (["button", "link"].includes(child.type)) return <button type="button" {...inline}>{content.text || child.type}</button>;
  if (child.type === "video") return <div className="canvas-video-placeholder">Video · {content.src || "URL"}</div>;
  if (child.type === "divider") return <hr/>;
  if (child.type === "spacer") return <div style={{ height: child.settings?.heightPx || 40 }}/>;
  if (child.type === "form") return <div className="canvas-form-placeholder">Formulaire</div>;
  return <div>{content.text || child.label}</div>;
}

function TranslationsWorkspace({ block, update }) {
  const translations = block.translations || {};
  const set = (language, key, value) => update({ ...translations, [language]: { ...(translations[language] || {}), [key]: value } });
  return <section className="translations-workspace"><div><span>LOCALIZATION</span><b>Contenu du bloc en 3 langues</b><small>Chaque traduction reste liée uniquement à ce bloc.</small></div>{[["en","English"],["fr","Français"],["ar","العربية"]].map(([language,label]) => <fieldset dir={language === "ar" ? "rtl" : "ltr"} key={language}><legend>{label}</legend><label>Titre<input value={translations[language]?.title || ""} onChange={event => set(language,"title",event.target.value)} placeholder={block.content?.title || "Titre"}/></label><label>Texte<textarea rows="3" value={translations[language]?.body || ""} onChange={event => set(language,"body",event.target.value)} placeholder={block.content?.body || "Contenu"}/></label><label>Bouton<input value={translations[language]?.ctaLabel || ""} onChange={event => set(language,"ctaLabel",event.target.value)} placeholder={block.content?.ctaLabel || "CTA"}/></label></fieldset>)}</section>;
}

function SeoWorkspace({ page, block, updatePage, updateBlock }) {
  const seo = block?.seo || {};
  const title = block ? (seo.title || "") : (page.metaTitle || "");
  const description = block ? (seo.description || "") : (page.metaDescription || "");
  const score = [title.length >= 30 && title.length <= 60, description.length >= 80 && description.length <= 160, block ? !!seo.keywords : !!page.canonicalUrl, block ? !!seo.image : !!page.socialImage].filter(Boolean).length * 25;
  const set = (key, value) => block ? updateBlock({ seo: { ...seo, [key]: value } }) : updatePage(key === "title" ? "metaTitle" : key === "description" ? "metaDescription" : key === "image" ? "socialImage" : key, value);
  return <section className="seo-workspace"><div><span className="seo-score">SEO {score}%</span><b>{block ? `SEO du bloc · ${block.label}` : `SEO de la page · ${page.title}`}</b><small>Titre, description, mots-clés, image sociale et indexation.</small></div><label><span>Titre SEO</span><input value={title} onChange={event => set("title", event.target.value)}/><small>{title.length}/60</small></label><label><span>Description</span><textarea rows="2" value={description} onChange={event => set("description", event.target.value)}/><small>{description.length}/160</small></label><label><span>Mots-clés</span><input value={block ? (seo.keywords || "") : (page.keywords || "")} onChange={event => set("keywords", event.target.value)}/></label><label><span>Image sociale</span><input value={block ? (seo.image || "") : (page.socialImage || "")} onChange={event => set("image", event.target.value)}/></label>{!block && <label><span>Robots</span><select value={page.robots || "index,follow"} onChange={event => set("robots", event.target.value)}><option value="index,follow">Index, follow</option><option value="noindex,follow">Noindex, follow</option><option value="noindex,nofollow">Noindex, nofollow</option></select></label>}</section>;
}

function DomElementInspector({ element, block, media, uploadMedia, update }) {
  const [showMedia, setShowMedia] = useState(false);
  const currentImage = block.content?.image || element.src || "";
  return <><div className="navigator-title"><b>{element.kind}</b><small>ÉLÉMENT DU SITE · {element.tag}</small></div>
    {element.kind === "image" ? <>
      <div className="selected-image-preview">{currentImage && <img src={mediaUrl(currentImage)} alt={block.content?.imageAlt || element.alt}/>}</div>
      <div className="inspector-action-grid"><button className="primary" onClick={() => setShowMedia(value => !value)}>Changer l’image</button><label className="canvas-upload-button">Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={async event => { const item = await uploadMedia(event.target.files?.[0]); if (item) update("src", item.url); }}/></label></div>
      {showMedia && <div className="canvas-media-library">{media.map(item => <button key={item._id} onClick={() => { update("src", item.url); setShowMedia(false); }}><img src={mediaUrl(item.url)} alt={item.alt || item.title || ""}/><span>{item.title || item.originalName}</span></button>)}</div>}
      <label className="field"><span>Texte alternatif</span><input value={block.content?.imageAlt || element.alt} onChange={event => update("alt", event.target.value)}/></label>
      <label className="field"><span>Object fit</span><select value={block.settings?.imageFit || "cover"} onChange={event => update("objectFit", event.target.value)}><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option><option value="none">Original</option></select></label>
    </> : <>
      <label className="field"><span>Contenu</span><textarea rows="5" value={element.text} onChange={event => update("text", event.target.value)}/></label>
      {element.kind === "button" && <label className="field"><span>Lien</span><input value={block.content?.ctaUrl || ""} onChange={event => update("href", event.target.value)}/></label>}
    </>}
    <p className="inspector-note">Sélection directe dans le composant frontend réel. Les actions publiques restent désactivées dans le canvas.</p>
  </>;
}

function ElementInspector({ element, media, uploadMedia, update, duplicate, moveUp, moveDown, remove }) {
  if (!element) return null;
  return <><div className="navigator-title"><b>{element.label}</b><small>ELEMENT · {element.type}</small></div><label className="field"><span>Nom</span><input value={element.label} onChange={event => update({ label: event.target.value })}/></label>{Object.entries(element.content || {}).map(([key, value]) => <label className="field" key={key}><span>{key}</span>{typeof value === "boolean" ? <input type="checkbox" checked={value} onChange={event => update({ content: { ...element.content, [key]: event.target.checked } })}/> : Array.isArray(value) ? <textarea rows="3" value={value.join("\n")} onChange={event => update({ content: { ...element.content, [key]: event.target.value.split("\n").filter(Boolean) } })}/> : <textarea rows="3" value={value ?? ""} onChange={event => update({ content: { ...element.content, [key]: event.target.value } })}/>}</label>)}{element.type === "image" && <><div className="canvas-media-library compact">{media.slice(0, 8).map(item => <button key={item._id} onClick={() => update({ content: { ...element.content, src: item.url } })}><img src={mediaUrl(item.url)} alt=""/></button>)}</div><label className="canvas-upload-button inspector-upload">Importer<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={async event => { const item = await uploadMedia(event.target.files?.[0]); if (item) update({ content: { ...element.content, src: item.url } }); }}/></label></>}<label className="field"><span>Positionnement</span><select value={element.settings?.position || "flow"} onChange={event => update({ settings: { ...element.settings, position: event.target.value, x: element.settings?.x || 0, y: element.settings?.y || 0 } })}><option value="flow">Flux du conteneur</option><option value="free">Position libre</option></select></label><label className="field"><span>Largeur desktop</span><input value={element.settings?.width || "auto"} onChange={event => update({ settings: { ...element.settings, width: event.target.value } })}/></label><label className="field"><span>Alignement</span><select value={element.settings?.align || "left"} onChange={event => update({ settings: { ...element.settings, align: event.target.value } })}><option>left</option><option>center</option><option>right</option></select></label><label className="visibility-toggle"><input type="checkbox" checked={element.visible !== false} onChange={event => update({ visible: event.target.checked })}/> Visible</label><div className="inspector-action-grid"><button onClick={moveUp}>Monter</button><button onClick={moveDown}>Descendre</button><button onClick={duplicate}>Dupliquer</button><button onClick={() => update({ locked: !element.locked })}>{element.locked ? "Déverrouiller" : "Verrouiller"}</button><button className="danger-link" onClick={remove}>Supprimer</button></div></>;
}
