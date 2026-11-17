import { FiGlobe } from "react-icons/fi";
import useLanguage from "../../hooks/useLanguage";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      aria-label={t("switchLanguage")}
      className="language-toggle"
      onClick={toggleLanguage}
      type="button"
    >
      <FiGlobe aria-hidden="true" />
      <span>{language === "en" ? "عربي" : "EN"}</span>
    </button>
  );
}
