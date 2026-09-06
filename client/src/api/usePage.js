import { useEffect, useState } from "react";
import { api } from "./client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export function usePage(key, fallback) {
  const { language } = useLanguage();
  const [page, setPage] = useState(fallback);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api(`/pages/${key}`);
        if (active) {
          const localized = Object.fromEntries(Object.entries(data.translations?.[language] || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined));
          const legacy = language === "en" ? data : {};
          setPage(current => ({ ...current, ...legacy, ...localized, key: data.key }));
        }
      } catch {
        // Public sections keep their current content when the API is unavailable.
      }
    };
    void load();
    return () => { active = false; };
  }, [key, language]);
  return page;
}
