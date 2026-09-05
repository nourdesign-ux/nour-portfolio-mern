const items = ["BRAND STRATEGY","VISUAL IDENTITY","ART DIRECTION","PACKAGING","SOCIAL MEDIA","PRINT & OOH","DIGITAL / UI","CAMPAIGN SYSTEMS"];
export default function Expertise() {
  return (
    <section className="expertise section" id="expertise">
      <div className="section-label">03 — EXPERTISE</div>
      <div className="expert-list">{items.map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b><em>↗</em></div>)}</div>
    </section>
  );
}
