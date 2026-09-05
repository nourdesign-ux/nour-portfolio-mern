import { useEffect, useState } from "react";
import { api } from "./client.js";

export function usePage(key, fallback) {
  const [page, setPage] = useState(fallback);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api(`/pages/${key}`);
        if (active) setPage(current => ({ ...current, ...data }));
      } catch {
        // Public sections keep their current content when the API is unavailable.
      }
    };
    void load();
    return () => { active = false; };
  }, [key]);
  return page;
}
