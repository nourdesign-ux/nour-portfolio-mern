import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const copy = {
  en: { home: "Home", about: "About", work: "Works", services: "Services", contact: "Contact", base: "BASED IN TUNISIA" },
  fr: { home: "Accueil", about: "À propos", work: "Projets", services: "Services", contact: "Contact", base: "BASÉE EN TUNISIE" },
  ar: { home: "الرئيسية", about: "نبذة", work: "الأعمال", services: "الخدمات", contact: "تواصل", base: "مقيمة في تونس" },
};

export default function Header({ editorMode = false, selectedElement = "", onElementSelect }) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState("light");
  const close = () => setOpen(false);
  const labels = copy[language];
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
    <header className={`site-header site-header--reference${open ? " menu-is-open" : ""}`} {...editorProps("header")}>
      <a className="brand brand--reference" {...editorProps("logo")} href="#top" onClick={close}><strong>NOUR MASTOURI</strong><span>CREATIVE PORTFOLIO</span></a>
      <nav className={`desktop-nav desktop-nav--reference${language === "ar" ? " is-arabic" : ""}`} {...editorProps("menu")}><a href="#top">{labels.home}</a><a href="#about">{labels.about}</a><a href="#work">{labels.work}</a><a href="#expertise">{labels.services}</a><a href="#contact">{labels.contact}</a></nav>
      <div className="header-tools">
        <div className="language-orbit" aria-label="Language">
          {["en", "fr", "ar"].map(code => <button className={language === code ? "is-active" : ""} type="button" aria-pressed={language === code} onClick={() => setLanguage(code)} key={code}>{code}</button>)}
        </div>
        <button className={`theme-orbit${theme === "dark" ? " is-dark" : ""}`} type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><span aria-hidden="true">{theme === "dark" ? "☾" : "☼"}</span></button>
      </div>
      <button className="menu-toggle menu-toggle--reference" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}><span className="sr-only">{open ? "Close menu" : "Open menu"}</span><span /><span /></button>
    </header>
    <div className={`mobile-menu portfolio-mobile-menu${open ? " is-open" : ""}`} id="mobile-menu" aria-hidden={!open}>
      <nav className={language === "ar" ? "is-arabic" : ""}><a href="#work" onClick={close}><span>01</span>{labels.work}</a><a href="#about" onClick={close}><span>02</span>{labels.about}</a><a href="#expertise" onClick={close}><span>03</span>{labels.services}</a><a href="#contact" onClick={close}><span>04</span>{labels.contact}</a></nav>
      <div className="mobile-menu__foot micro"><span>{labels.base}</span><span>© 2026</span></div>
    </div>
  </>;
}
