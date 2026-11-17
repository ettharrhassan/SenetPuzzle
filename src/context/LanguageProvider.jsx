import { useEffect, useMemo, useState } from "react";
import { translations } from "../utils/translations";
import LanguageContext from "./LanguageContext";

const STORAGE_KEY = "puzzle-pop-language";

function getInitialLanguage() {
  return window.localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en";
}

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "ar" : "en")),
      t: (key, values = {}) => {
        const message = translations[language][key] ?? translations.en[key] ?? key;
        return Object.entries(values).reduce(
          (translated, [name, value]) =>
            translated.replaceAll(`{${name}}`, String(value)),
          message,
        );
      },
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
