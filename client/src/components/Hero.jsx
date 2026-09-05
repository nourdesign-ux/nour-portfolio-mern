export default function Hero() {
  return (
    <section className="hero" id="top">
      <HeaderOverlay />
      <div className="hero-copy">
        <div className="eyebrow">BRANDING / ART DIRECTION / DIGITAL</div>
        <h1><span>Hello.</span><strong>I’m Nourrr</strong><span>Mastouri.</span></h1>
        <p className="role">SENIOR GRAPHIC DESIGNER / ART DIRECTOR</p>
        <p className="intro">I build visual identities, campaigns and digital experiences that make brands clearer, bolder and more memorable.</p>
        <div className="hero-actions">
          <a href="#work" className="primary">VIEW SELECTED WORK ↗</a>
          <a href="#contact">START A PROJECT</a>
        </div>
        <div className="stats">
          <div><b>08</b><span>YEARS EXPERIENCE</span></div>
          <div><b>25+</b><span>SELECTED PROJECTS</span></div>
          <div><b>100+</b><span>VISUAL DELIVERABLES</span></div>
        </div>
      </div>

      <div className="portrait-wrap">
        <img src="/assets/nour-hero-transparent.png" alt="Nour Mastouri" />
      </div>

      <div className="experience-badge"><b>+08</b><span>YEARS<br/>DESIGN</span></div>
      <div className="hero-circle" aria-hidden="true" />
    </section>
  );
}

function HeaderOverlay() {
  return (
    <div className="hero-header-space" aria-hidden="true" />
  );
}
