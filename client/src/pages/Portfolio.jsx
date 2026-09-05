import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import Work from "../components/Work.jsx";
import About from "../components/About.jsx";
import Expertise from "../components/Expertise.jsx";
import Contact from "../components/Contact.jsx";

export default function Portfolio() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Work />
        <div className="ticker">BRANDING ✦ ART DIRECTION ✦ PACKAGING ✦ DIGITAL ✦ VISUAL SYSTEMS ✦</div>
        <About />
        <Expertise />
        <Contact />
      </main>
      <footer><b>NOUR MASTOURI</b><span>SENIOR GRAPHIC DESIGNER & ART DIRECTOR</span><span>TUNISIA — WORLDWIDE</span><span>© 2026</span></footer>
    </>
  );
}
