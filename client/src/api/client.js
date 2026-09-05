export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("nour_admin_token");
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("nour_admin_token");
      window.dispatchEvent(new Event("nour:unauthorized"));
    }
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export function mediaUrl(url = "") {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${API_URL.replace(/\/api\/?$/, "")}${url}`;
}
