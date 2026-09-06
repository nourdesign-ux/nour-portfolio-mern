import { Routes, Route, Navigate } from "react-router-dom";
import Portfolio from "./pages/Portfolio.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { CookieBanner, StatusExperience, usePublicSettings } from "./components/PublicExperience.jsx";
import "./public-status.css";

function Protected({ children }) {
  return localStorage.getItem("nour_admin_token") ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const publicSettings = usePublicSettings();
  const params = new URLSearchParams(window.location.search);
  const adminPreview = !!localStorage.getItem("nour_admin_token") && params.has("preview-mode");
  const previewMode = adminPreview ? params.get("preview-mode") : null;
  const mode = previewMode || publicSettings?.siteStatus || "online";
  const publicPage = mode === "coming-soon" ? <StatusExperience mode={mode} data={publicSettings?.comingSoon}/> : mode === "maintenance" ? <StatusExperience mode={mode} data={publicSettings?.maintenance}/> : <LanguageProvider><Portfolio /></LanguageProvider>;
  return (
    <Routes>
      <Route path="/" element={<>{publicPage}<CookieBanner config={publicSettings?.cookies}/></>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<Protected><AdminDashboard /></Protected>} />
    </Routes>
  );
}
