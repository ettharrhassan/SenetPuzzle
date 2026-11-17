import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { LEVELS } from "../../constants/levels";
import { CHALLENGES } from "../../constants/challenges";

export default function Levels() {
  const { language, t } = useLanguage();
  const { challengeId, difficulty, selectDifficulty } = usePlayer();
  const selectedChallenge = CHALLENGES.find((challenge) => challenge.id === challengeId);
  const availableLevels = selectedChallenge?.levelId
    ? LEVELS.filter((level) => level.id === selectedChallenge.levelId)
    : LEVELS;
  const navigate = useNavigate();
  const BackIcon = language === "ar" ? FiArrowRight : FiArrowLeft;

  function chooseLevel(level) {
    selectDifficulty(level);
    navigate("/puzzle");
  }

  return (
    <div className="selection-page">
      <Link className="back-link" to="/challenges">
        <BackIcon aria-hidden="true" />{t("changeChallenge")}
      </Link>
      <div className="selection-heading">
        <span className="section-kicker">{t("stepTwo")}</span>
        <h1>{t("chooseLevel")}</h1>
        <p>{t("chooseLevelDescription")}</p>
      </div>
      <div className="level-grid">
        {availableLevels.map((level) => (
          <Card className={`level-card${difficulty === level.id ? " is-selected" : ""}`} key={level.id}>
            <span
              className="level-card__board"
              aria-hidden="true"
              style={{
                gridTemplateColumns: `repeat(${level.columns}, 1fr)`,
                gridTemplateRows: `repeat(${level.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: level.pieces }, (_, index) => (
                <span key={index} />
              ))}
            </span>
            <span className="section-kicker">{t(level.detailKey)}</span>
            <h2>{t(level.titleKey)}</h2>
            <p>{t("levelPieceCount", { count: level.pieces })}</p>
            <Button
              aria-pressed={difficulty === level.id}
              onClick={() => chooseLevel(level.id)}
            >
              {t("chooseLevelButton")}<FiArrowUpRight aria-hidden="true" />
            </Button>
          </Card>
        ))}
      </div>
      {!challengeId ? <span className="sr-only">{t("chooseChallengeFirst")}</span> : null}
    </div>
  );
}
