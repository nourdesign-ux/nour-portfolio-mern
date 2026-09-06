export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("nour_admin_token");
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    const signal = options.signal && AbortSignal.any ? AbortSignal.any([options.signal, controller.signal]) : (options.signal || controller.signal);
    res = await fetch(`${API_URL}${path}`, { ...options, headers, signal });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("La requête a expiré. Vérifiez la connexion au serveur.");
    throw new Error("API indisponible. Vérifiez que le serveur est démarré.");
  } finally {
    window.clearTimeout(timeout);
  }
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
  if (!url || /^https?:\/\//i.test(url) || url.startsWith("/assets/")) return url;
  return `${API_URL.replace(/\/api\/?$/, "")}${url}`;
}
