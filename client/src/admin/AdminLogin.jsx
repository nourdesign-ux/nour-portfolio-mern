import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email,setEmail] = useState("admin@nourmastouri.com");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", {method:"POST", body:JSON.stringify({email,password})});
      localStorage.setItem("nour_admin_token", data.token);
      nav("/admin");
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  }

  return <div className="admin-shell login">
    <form onSubmit={submit} className="admin-card">
      <div className="admin-kicker">NOUR CMS / MERN</div>
      <h1>Admin Login</h1>
      <label>Email<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={loading}>{loading ? "CONNEXION…" : "LOGIN ↗"}</button>
    </form>
  </div>
}
