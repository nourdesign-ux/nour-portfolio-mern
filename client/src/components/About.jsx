export default function About() {
  return <section className="about about-modern section-pad" id="about">
    <div className="about-modern__top">
      <span className="micro">01 / PROFILE</span>
      <span className="micro">TUNISIA → WORLDWIDE</span>
    </div>

    <div className="about-modern__grid">
      <div className="about-modern__headline">
        <p className="micro">DESIGNER / ART DIRECTOR</p>
        <h2>Ideas,<br /><em>shaped</em><br />with intent.</h2>
      </div>

      <figure className="about-modern__portrait">
        <img src="/assets/nour-mastouri.webp" alt="Nour Mastouri portrait" />
        <figcaption className="micro">NOUR MASTOURI — 2026</figcaption>
      </figure>

      <div className="about-modern__note">
        <div className="about-modern__years"><strong>08+</strong><span>YEARS OF<br />EXPERIENCE</span></div>
        <p>Clear thinking.<br />Distinctive design.<br />No noise.</p>
        <span className="about-modern__status"><i /> AVAILABLE FOR SELECTED PROJECTS</span>
      </div>
    </div>
  </section>;
}
