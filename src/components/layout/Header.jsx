import { NavLink } from "react-router-dom";
import { APP_NAME } from "../../constants/app";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import LanguageToggle from "../common/LanguageToggle";
import ThemeToggle from "../common/ThemeToggle";

export default function Header() {
  const { t } = useLanguage();
  const { player } = usePlayer();
  const startPath = player ? "/challenges" : "/";
  const links = [
    { to: player ? "/profile" : "/", label: t(player ? "myProfile" : "registerNav"), unlocked: true },
    { to: "/challenges", label: t("challengesNav"), unlocked: Boolean(player) },
    { to: "/in-progress", label: t("inProgressNav"), unlocked: Boolean(player) },
    { to: "/leaderboard", label: t("leaderboard"), unlocked: Boolean(player) },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink aria-label={APP_NAME} className="brand" to={startPath}>
          <span className="brand__mark"><img alt="" src="/favicon.svg" /></span>
          <span className="brand__copy">
            <span className="brand__name">{APP_NAME}</span>
            <span className="brand__tagline">{t("brandTagline")}</span>
          </span>
        </NavLink>
        {player ? (
          <nav aria-label={t("mainNavigation")} className="main-nav">
            {links.map((link) =>
              link.unlocked ? (
                <NavLink
                  className={({ isActive }) => "nav-link" + (isActive ? " is-active" : "")}
                  key={link.to}
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ) : (
                <span aria-disabled="true" className="nav-link nav-link--locked" key={link.to}>
                  {link.label}
                </span>
              ),
            )}
          </nav>
        ) : null}
        <div className="site-header__actions">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
