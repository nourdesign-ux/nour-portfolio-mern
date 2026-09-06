import { usePage } from "../api/usePage.js";

const defaults = [["BRAND IDENTITY","Strategy · Systems · Guidelines"],["ART DIRECTION","Concept · Campaign · Content"],["SOCIAL MEDIA","Creative systems · Launches"],["PACKAGING","Product · Label · Range"],["PRINT DESIGN","Editorial · OOH · Production"],["DIGITAL / UI","Web · Interfaces · Motion"]];
const defaultBody = defaults.map(item => item.join("|")).join("\n");

export default function Expertise() {
  const page = usePage("expertise", { title: "One vision. Every touchpoint.", eyebrow: "04 / EXPERTISE", body: defaultBody });
  const block = page.blocks?.find(item => item.type === "expertise") || page.blocks?.[0];
  const content = { title: page.title, eyebrow: page.eyebrow, body: page.body, ...(block?.content || {}) };
  const items = String(content.body || defaultBody).split("\n").filter(Boolean).map((line,index)=>{const [name,detail]=line.split("|");return [name,detail||defaults[index]?.[1]||""];});
  return <section className="expertise section-pad" id="expertise"><div className="section-head section-head--dark"><p className="micro">{content.eyebrow}</p><h2>{content.title}</h2></div><ol className="expertise__list">{items.map(([name,detail],index)=><li key={`${name}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><strong>{name}</strong><em>{detail}</em><i>↗</i></li>)}</ol></section>;
}
