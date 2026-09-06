import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import Work from "../components/Work.jsx";
import About from "../components/About.jsx";
import Expertise from "../components/Expertise.jsx";
import Contact from "../components/Contact.jsx";

export default function Portfolio() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateBackToTop = () => setShowBackToTop(window.scrollY > 140);
    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    return () => window.removeEventListener("scroll", updateBackToTop);
  }, []);

  return <>
    <Header />
    <main id="main">
      <Hero />
      <section className="ticker"><div className="ticker__track"><span>BRAND IDENTITY ↗ ART DIRECTION ↗ PACKAGING ↗ CAMPAIGNS ↗ DIGITAL DESIGN ↗</span><span>BRAND IDENTITY ↗ ART DIRECTION ↗ PACKAGING ↗ CAMPAIGNS ↗ DIGITAL DESIGN ↗</span></div></section>
      <About />
      <section className="manifesto section-pad"><p className="manifesto__kicker micro">02 / APPROACH</p><h2 className="manifesto__line">CLARITY FIRST.<br /><em>CHARACTER ALWAYS.</em></h2><div className="manifesto__foot"><span className="micro">THINK / SHAPE / REFINE</span><p>Every choice has a reason. Every detail earns its place.</p></div></section>
      <Work />
      <Expertise />
      <section className="experience-statement"><div className="experience-statement__number">8+</div><div className="experience-statement__words"><span>YEARS</span><span>SHAPING</span><span>DISTINCTIVE</span><span>BRANDS</span></div><p className="micro">TUNISIA — WORKING WORLDWIDE</p></section>
      <section className="quote section-pad"><p className="micro">05 / POINT OF VIEW</p><blockquote>DESIGN SHOULD FEEL INEVITABLE.<br /><em>NEVER DECORATED.</em></blockquote></section>
      <Contact />
    </main>
    <button className={`floating-back-to-top${showBackToTop ? " is-visible" : ""}`} type="button" aria-label="Back to top" title="Back to top" onClick={() => scrollTo({top:0,behavior:"smooth"})}><span aria-hidden="true">↑</span></button>
    <footer className="footer"><div className="footer__brand">NOUR MASTOURI</div><div className="footer__role micro"><span>SENIOR GRAPHIC DESIGNER<br />& ART DIRECTOR</span><span>TUNISIA — WORLDWIDE</span></div><div className="footer__bottom micro"><span>© 2026 NOUR MASTOURI</span><button className="back-to-top" type="button" aria-label="Back to top" title="Back to top" onClick={() => scrollTo({top:0,behavior:"smooth"})}><span aria-hidden="true">↑</span></button></div></footer>
  </>;
}
