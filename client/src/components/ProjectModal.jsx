import { useEffect } from "react";
import { createPortal } from "react-dom";
import { mediaUrl } from "../api/client.js";

export default function ProjectModal({ project, index, slug, onClose }) {
  useEffect(() => {
    document.body.classList.add("is-locked");
    const onKeyDown = event => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const services = project.services?.length ? project.services : (project.category || "ART DIRECTION").split("·").map(item => item.trim());
  const images = [project.cover, ...(project.images || [])].filter(Boolean);
  const description = project.description || "A focused creative system built to give the brand a clear voice, a distinctive presence and the flexibility to grow across every touchpoint.";

  return createPortal(<div className="case-modal" role="dialog" aria-modal="true" aria-labelledby="case-title">
    <header className="case-modal__header">
      <span className="micro">CASE STUDY / {String(index + 1).padStart(2, "0")}</span>
      <span className="case-modal__brand">NOUR MASTOURI</span>
      <button type="button" onClick={onClose}>CLOSE <i>×</i></button>
    </header>

    <div className="case-modal__body">
      <section className="case-hero">
        <div className="case-hero__heading"><span className="micro">{project.category}</span><h2 id="case-title">{project.title}</h2></div>
        <div className={`case-hero__visual art-${slug}`}>
          {images[0] ? <img src={mediaUrl(images[0])} alt={`${project.title} project cover`} /> : <strong>{project.title}</strong>}
          <span className="case-hero__index">{String(index + 1).padStart(2, "0")} / 18</span>
        </div>
      </section>

      <section className="case-overview">
        <div><span className="micro">OVERVIEW</span><p>{description}</p></div>
        <dl><div><dt>YEAR</dt><dd>{project.year}</dd></div><div><dt>ROLE</dt><dd>ART DIRECTION<br />DESIGN</dd></div><div><dt>SERVICES</dt><dd>{services.map(service => <span key={service}>{service}</span>)}</dd></div></dl>
      </section>

      <section className="case-gallery">
        {(images.length > 1 ? images.slice(1) : [null, null]).map((image, imageIndex) => <figure className={`case-gallery__item case-gallery__item--${imageIndex + 1}`} key={image || imageIndex}>
          {image ? <img src={mediaUrl(image)} alt={`${project.title} project view ${imageIndex + 1}`} loading="lazy" /> : <div className={`case-gallery__placeholder art-${slug}`}><strong>{imageIndex ? "DETAIL" : project.title}</strong></div>}
        </figure>)}
      </section>

      <section className="case-story">
        <span className="micro">THE WORK</span>
        <div><h3>{project.conceptTitle || <>A clear idea,<br /><em>made tangible.</em></>}</h3><p>{project.concept || "The direction balances clarity with character. A flexible visual language keeps the work recognisable while giving every application room to feel fresh."}</p></div>
      </section>

      <footer className="case-modal__footer"><span className="micro">END OF CASE STUDY</span><div>{project.behanceUrl && <a href={project.behanceUrl} target="_blank" rel="noreferrer">VIEW ON BEHANCE ↗</a>}<button type="button" onClick={onClose}>BACK TO PROJECTS ↑</button></div></footer>
    </div>
  </div>, document.body);
}
