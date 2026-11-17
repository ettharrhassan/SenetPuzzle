import { lazy, Suspense, useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import "./App.css";
import { APP_NAME, APP_TITLE } from "./constants/app";
import Loader from "./components/common/Loader";
import Header from "./components/layout/Header";
import LanguageProvider from "./context/LanguageProvider";
import ThemeProvider from "./context/ThemeProvider";
import useLanguage from "./hooks/useLanguage";
import PlayerProvider from "./context/PlayerProvider";
import usePlayer from "./hooks/usePlayer";

const Home = lazy(() => import("./pages/Home/Home"));
const Puzzle = lazy(() => import("./pages/Puzzle/Puzzle"));
const Leaderboard = lazy(() => import("./pages/Leaderboard/Leaderboard"));
const ProfilePage = lazy(() =>
  import("./pages/Leaderboard/Leaderboard").then((module) => ({ default: module.ProfilePage })),
);
const NotFound = lazy(() => import("./pages/NotFound"));
const Challenges = lazy(() => import("./pages/Challenges/Challenges"));
const InProgress = lazy(() =>
  import("./pages/Challenges/Challenges").then((module) => ({ default: module.InProgress })),
);
const Results = lazy(() => import("./pages/Results/Results"));

function AppLayout() {
  const { t } = useLanguage();
  const { player } = usePlayer();
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  return (
    <>
      <Header />
      <main className="page-shell">
        <Suspense fallback={<Loader fullScreen type="main" />}>
          <Routes>
            <Route path="/" element={player ? <Navigate replace to="/profile" /> : <Home />} />
            <Route path="/register" element={<Home />} />
            <Route element={<StageRoute stage={1} />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/challenges" element={
                <Suspense fallback={<Loader className="loader--panel" type="challenge" />}>
                  <Challenges />
                </Suspense>
              } />
              <Route path="/in-progress" element={
                <Suspense fallback={<Loader className="loader--panel" type="challenge" />}>
                  <InProgress />
                </Suspense>
              } />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/results" element={<ResultsRoute />} />
            </Route>
            <Route element={<StageRoute stage={2} />}>
              <Route path="/puzzle" element={
                <Suspense fallback={<Loader className="loader--panel" type="challenge" />}>
                  <Puzzle />
                </Suspense>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {APP_NAME}</span>
        <span>{t("footerTagline")}</span>
      </footer>
    </>
  );
}

function ResultsRoute() {
  const { result } = usePlayer();
  return result ? <Results /> : <Navigate replace to="/profile" />;
}

function StageRoute({ stage }) {
  const { player, challengeId, difficulty, result } = usePlayer();

  if (!player) return <Navigate replace to="/" />;
  if (stage >= 2 && (!challengeId || !difficulty)) return <Navigate replace to="/challenges" />;
  if (stage >= 3 && !result) return <Navigate replace to="/puzzle" />;

  return <Outlet />;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PlayerProvider>
          <AppLayout />
        </PlayerProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

