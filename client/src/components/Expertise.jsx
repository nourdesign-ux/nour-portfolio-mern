const items = [["BRAND IDENTITY","Strategy · Systems · Guidelines"],["ART DIRECTION","Concept · Campaign · Content"],["SOCIAL MEDIA","Creative systems · Launches"],["PACKAGING","Product · Label · Range"],["PRINT DESIGN","Editorial · OOH · Production"],["DIGITAL / UI","Web · Interfaces · Motion"]];
export default function Expertise() {
  return <section className="expertise section-pad" id="expertise">
    <div className="section-head section-head--dark"><p className="micro">04 / EXPERTISE</p><h2>One vision. Every touchpoint.</h2></div>
    <ol className="expertise__list">{items.map(([name, detail], i) => <li key={name}><span>{String(i + 1).padStart(2,"0")}</span><strong>{name}</strong><em>{detail}</em><i>↗</i></li>)}</ol>
  </section>;
}
