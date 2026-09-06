import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicSettings } from "./PublicExperience.jsx";

const copy = {
  en: { home: "Home", about: "About", work: "Works", services: "Services", contact: "Contact", base: "BASED IN TUNISIA" },
  fr: { home: "Accueil", about: "À propos", work: "Projets", services: "Services", contact: "Contact", base: "BASÉE EN TUNISIE" },
  ar: { home: "الرئيسية", about: "نبذة", work: "الأعمال", services: "الخدمات", contact: "تواصل", base: "مقيمة في تونس" },
};

export default function Header({ editorMode = false, selectedElement = "", onElementSelect }) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const settings = usePublicSettings();
  const [theme, setTheme] = useState("light");
  const close = () => setOpen(false);
  const labels = copy[language];
  const fallbackMenu = [{ label: labels.home, url: "#top" }, { label: labels.about, url: "#about" }, { label: labels.work, url: "#work" }, { label: labels.services, url: "#expertise" }, { label: labels.contact, url: "#contact" }];
  const menu = settings?.menu?.length ? settings.menu.map(item => ({ ...item, label: item.translations?.[language] || (language === "en" ? item.label : fallbackMenu.find(entry => entry.url === item.url)?.label || item.label) })) : fallbackMenu;
  const menuStyle = settings?.menuStyle || {};
  const headerStyle = { ...(menuStyle.background ? { background: menuStyle.background } : {}), ...(menuStyle.text ? { color: menuStyle.text } : {}), ...(menuStyle.height ? { minHeight: `${menuStyle.height}px` } : {}), ...(menuStyle.blur !== undefined ? { backdropFilter: `blur(${menuStyle.blur}px)` } : {}), ...(menuStyle.border ? { borderBottomColor: menuStyle.border } : {}), ...(menuStyle.sticky === false ? { position: "relative" } : {}) };
  const editorProps = name => editorMode ? { "data-editor-element": name, "data-editor-selected": selectedElement === name ? "true" : undefined, onClick: event => { event.preventDefault(); event.stopPropagation(); onElementSelect?.(name); } } : {};

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", open);
    const closeOnEscape = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <>
    <header className={`site-header site-header--reference${open ? " menu-is-open" : ""}`} style={headerStyle} {...editorProps("header")}>
      <a className="brand brand--reference" {...editorProps("logo")} href="#top" onClick={close}><strong>{settings?.logoText || "NOUR MASTOURI"}</strong><span>{settings?.siteDescription || "CREATIVE PORTFOLIO"}</span></a>
      <nav className={`desktop-nav desktop-nav--reference${language === "ar" ? " is-arabic" : ""}`} {...editorProps("menu")}>{menu.map(item => <a href={item.url} key={`${item.url}-${item.label}`}>{item.label}</a>)}</nav>
      <div className="header-tools">
        <div className="language-orbit" aria-label="Language">
          {["en", "fr", "ar"].map(code => <button className={language === code ? "is-active" : ""} type="button" aria-pressed={language === code} onClick={() => setLanguage(code)} key={code}>{code}</button>)}
        </div>
        <button className={`theme-orbit${theme === "dark" ? " is-dark" : ""}`} type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><span aria-hidden="true">{theme === "dark" ? "☾" : "☼"}</span></button>
      </div>
      <button className="menu-toggle menu-toggle--reference" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}><span className="sr-only">{open ? "Close menu" : "Open menu"}</span><span /><span /></button>
    </header>
    <div className={`mobile-menu portfolio-mobile-menu${open ? " is-open" : ""}`} id="mobile-menu" aria-hidden={!open}>
      <nav className={language === "ar" ? "is-arabic" : ""}>{menu.filter(item => item.url !== "#top").map((item, index) => <a href={item.url} onClick={close} key={`${item.url}-${item.label}`}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</a>)}</nav>
      <div className="mobile-menu__foot micro"><span>{settings?.profile?.location || labels.base}</span><span>{settings?.footerEditor?.year || "© 2026"}</span></div>
    </div>
  </>;
}
