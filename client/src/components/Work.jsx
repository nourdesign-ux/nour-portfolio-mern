import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const fallback = [
  {title:"ESPIM", category:"ART DIRECTION · CAMPAIGN", year:2026},
  {title:"FREMIGEL", category:"PACKAGING SYSTEM", year:2026},
  {title:"LEADERS TV", category:"BRAND IDENTITY · MOTION", year:2025},
  {title:"HEISENBERG", category:"BRAND CAMPAIGN · PRINT", year:2026},
  {title:"NOLYSS", category:"BRAND IDENTITY", year:2025},
  {title:"AZALEA", category:"BRAND · DIGITAL", year:2025},
  {title:"EVENTCELLO", category:"DIGITAL EXPERIENCE", year:2025},
  {title:"CLARENIA", category:"PACKAGING · SOCIAL", year:2026}
];

export default function Work() {
  const [projects, setProjects] = useState(fallback);
  useEffect(() => { api("/projects").then(setProjects).catch(()=>{}); }, []);

  return (
    <section className="work section" id="work">
      <div className="section-head"><span>01</span><h2>SELECTED<br/>WORK.</h2><p>Branding, campaigns, packaging and digital systems.</p></div>
      <div className="project-grid">
        {projects.map((p,i)=>(
          <article className={`project p${i+1}`} key={p._id || p.title}>
            <div className="project-visual"><span>{String(i+1).padStart(2,"0")}</span></div>
            <div className="project-meta">
              <div><h3>{p.title}</h3><p>{p.category}</p></div>
              <b>{p.year}</b>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
