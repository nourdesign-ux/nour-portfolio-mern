import { usePage } from "../api/usePage.js";

const items = ["BRAND STRATEGY","VISUAL IDENTITY","ART DIRECTION","PACKAGING","SOCIAL MEDIA","PRINT & OOH","DIGITAL / UI","CAMPAIGN SYSTEMS"];
export default function Expertise() {
  const page = usePage("expertise", { title: "EXPERTISE", eyebrow: "", body: "" });
  const managedItems = page.body ? page.body.split(/[·\n]/).map(item => item.trim()).filter(Boolean) : items;
  return (
    <section className="expertise section" id="expertise">
      <div className="section-label">{page.eyebrow || `03 — ${page.title || "EXPERTISE"}`}</div>
      <div className="expert-list">{managedItems.map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b><em>↗</em></div>)}</div>
    </section>
  );
}
