import { usePage } from "../api/usePage.js";

export default function About() {
  const page = usePage("about", { title: "DESIGN WITH\nDIRECTION.", eyebrow: "02 — ABOUT", body: "I combine strategy, visual systems and execution to create work that stays coherent across print, packaging, social and digital experiences." });
  return (
    <section className="about section" id="about">
      <div className="section-label">{page.eyebrow || "02 — ABOUT"}</div>
      <div className="about-grid">
        <h2>{page.title || "DESIGN WITH\nDIRECTION."}</h2>
        <div>
          <p className="lead">Senior Graphic Designer & Art Director focused on branding, visual identity and premium communication.</p>
          <p>{page.body}</p>
        </div>
      </div>
    </section>
  );
}
