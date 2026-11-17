import { FiMoon, FiSun } from "react-icons/fi";
import useTheme from "../../hooks/useTheme";
import useLanguage from "../../hooks/useLanguage";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const label = theme === "light" ? t("themeDark") : t("themeLight");

  return (
    <button
      aria-label={label}
      className="icon-button"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {theme === "light" ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
    </button>
  );
}
