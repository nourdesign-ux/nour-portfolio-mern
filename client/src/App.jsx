import { Routes, Route, Navigate } from "react-router-dom";
import Portfolio from "./pages/Portfolio.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

function Protected({ children }) {
  return localStorage.getItem("nour_admin_token") ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LanguageProvider><Portfolio /></LanguageProvider>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<Protected><AdminDashboard /></Protected>} />
    </Routes>
  );
}
