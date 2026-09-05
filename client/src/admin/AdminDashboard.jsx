import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const blank = {title:"",slug:"",category:"",year:2026,status:"published",featured:false,sortOrder:0};

export default function AdminDashboard(){
  const [projects,setProjects]=useState([]);
  const [form,setForm]=useState(blank);
  const [editing,setEditing]=useState(null);
  const [message,setMessage]=useState("");

  const load=()=>api("/projects?all=1").then(setProjects).catch(e=>setMessage(e.message));
  useEffect(load,[]);

  async function save(e){
    e.preventDefault();
    try{
      if(editing) await api(`/projects/${editing}`,{method:"PUT",body:JSON.stringify(form)});
      else await api("/projects",{method:"POST",body:JSON.stringify(form)});
      setForm(blank); setEditing(null); setMessage("Saved ✓"); load();
    }catch(e){setMessage(e.message)}
  }

  function edit(p){
    setEditing(p._id);
    setForm({title:p.title,slug:p.slug,category:p.category||"",year:p.year||2026,status:p.status||"published",featured:!!p.featured,sortOrder:p.sortOrder||0});
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function remove(id){
    if(!confirm("Delete this project?")) return;
    await api(`/projects/${id}`,{method:"DELETE"}); load();
  }

  function logout(){localStorage.removeItem("nour_admin_token");location.href="/admin/login"}

  return <div className="admin-shell">
    <aside className="admin-side">
      <div><b>NOUR.</b><span>CMS / MERN</span></div>
      <nav><a className="active">Projects</a><a>Pages</a><a>Media</a><a>SEO</a><a>Settings</a></nav>
      <button onClick={logout}>Logout</button>
    </aside>
    <main className="admin-main">
      <header><div><small>CONTENT MANAGER</small><h1>Projects</h1></div><span>{projects.length} projects</span></header>
      {message && <div className="notice">{message}</div>}
      <form className="project-form" onSubmit={save}>
        <input placeholder="Project title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
        <input placeholder="slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required />
        <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <input type="number" value={form.year} onChange={e=>setForm({...form,year:+e.target.value})} />
        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>published</option><option>draft</option></select>
        <input type="number" placeholder="Order" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:+e.target.value})}/>
        <label className="check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Featured</label>
        <button>{editing?"UPDATE PROJECT":"ADD PROJECT"}</button>
      </form>
      <div className="admin-list">
        {projects.map((p,i)=><div className="admin-row" key={p._id}>
          <span>{String(i+1).padStart(2,"0")}</span>
          <div><b>{p.title}</b><small>{p.category} · {p.year}</small></div>
          <em>{p.status}</em>
          <button onClick={()=>edit(p)}>Edit</button>
          <button onClick={()=>remove(p._id)}>Delete</button>
        </div>)}
      </div>
    </main>
  </div>
}
