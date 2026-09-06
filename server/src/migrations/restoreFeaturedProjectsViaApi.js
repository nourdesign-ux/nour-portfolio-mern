import "dotenv/config";

const base = `http://localhost:${process.env.PORT || 5000}/api`;
const featured = [
  { title:"LEADERS DIGITAL",slug:"leaders-digital",category:"BRAND IDENTITY · DIGITAL AGENCY",year:2025,description:"A complete rebrand for a digital agency ready to move forward. The new identity replaces an outdated image with a bold, flexible system shaped around creativity, communication and digital progress.",services:["Brand Strategy","Logo Design","Visual Identity","Art Direction"],cover:"/assets/projects/digital-agency/01.jpg",images:["02","03","04","05","06","07","08","09","10","11"].map(name=>`/assets/projects/digital-agency/${name}.jpg`),status:"published",featured:true,sortOrder:0 },
  { title:"KURUBIS WINE",slug:"wine-social-media",category:"SOCIAL MEDIA · ART DIRECTION",year:2024,description:"A vibrant social media campaign for Kurubis wine, designed to turn each bottle into an expressive lifestyle moment. The system connects product storytelling, vineyard imagery and editorial typography across red and white wine collections.",services:["Art Direction","Social Media Design","Advertising","Photo Compositing"],cover:"/assets/projects/wine-social/01.jpg",images:["02","03","04","05"].map(name=>`/assets/projects/wine-social/${name}.jpg`),status:"published",featured:true,sortOrder:1 },
  { title:"UNITED ACADEMY",slug:"sports-academy-social-media",category:"SPORTS DESIGN · SOCIAL MEDIA",year:2024,description:"A high-energy communication system for United Academy, connecting football and padel programmes through a consistent social media language. The campaign covers registrations, private lessons, events and brand moments across digital and outdoor formats.",services:["Art Direction","Sports Design","Social Media","Advertising"],cover:"/assets/projects/sports-academy/01.jpg",images:["02","03","04","05"].map(name=>`/assets/projects/sports-academy/${name}.jpg`),status:"published",featured:true,sortOrder:2 }
];

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

const login = await request("/auth/login", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ email:process.env.ADMIN_EMAIL, password:process.env.ADMIN_PASSWORD }) });
const headers = { "Content-Type":"application/json", Authorization:`Bearer ${login.token}` };
const [active, trash] = await Promise.all([request("/projects?all=1", { headers }), request("/projects?trash=1", { headers })]);
const knownSlugs = new Set([...active, ...trash].map(item => item.slug));
if (!featured.some(project => knownSlugs.has(project.slug))) {
  for (const item of active) {
    await request(`/projects/${item._id}`, { method:"PUT", headers, body:JSON.stringify({ sortOrder:(item.sortOrder || 0) + 3 }) });
  }
}
for (const project of featured) {
  let record = active.find(item => item.slug === project.slug);
  if (!record) {
    const removed = trash.find(item => item.slug === project.slug);
    if (removed) record = await request(`/projects/${removed._id}/restore`, { method:"POST", headers });
  }
  if (record) await request(`/projects/${record._id}`, { method:"PUT", headers, body:JSON.stringify(project) });
  else await request("/projects", { method:"POST", headers, body:JSON.stringify(project) });
}
console.log(`Restored ${featured.length} featured projects through the local API`);
