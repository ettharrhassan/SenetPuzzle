import { FiArrowUpRight, FiCheck, FiClock, FiGrid, FiMove } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { CHALLENGES } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function Challenges() {
  const { t } = useLanguage();
  const { player, challengeId, selectChallenge, selectDifficulty } = usePlayer();
  const navigate = useNavigate();

  function chooseChallenge(id) {
    const challenge = CHALLENGES.find((item) => item.id === id);
    selectChallenge(id);
    selectDifficulty(challenge.levelId);
    navigate("/puzzle");
  }

  return (
    <div className="selection-page">
      <div className="selection-heading">
        <span className="section-kicker">{t("stepOne")}</span>
        <h1>{t("chooseChallenge")}</h1>
        <p>{t("chooseChallengeDescription", { name: player.name })}</p>
      </div>
      <div className="challenge-grid">
        {CHALLENGES.map((challenge) => (
          <button
            aria-pressed={challengeId === challenge.id}
            className={`challenge-option${challengeId === challenge.id ? " is-selected" : ""}`}
            key={challenge.id}
            onClick={() => chooseChallenge(challenge.id)}
            type="button"
          >
            <Card className="challenge-option__card">
              <span className={`challenge-art challenge-art--${challenge.art}`} aria-hidden="true">
                <img alt="" src={challenge.image} />
              </span>
              <span className="challenge-option__details">
                <span>
                  <strong>{t(challenge.nameKey ?? challenge.titleKey)}</strong>
                  <small>
                    {t(challenge.difficultyKey)} · {t("levelPieceCount", {
                      count: LEVELS.find((level) => level.id === challenge.levelId)?.pieces ?? 50,
                    })}
                  </small>
                </span>
                <span aria-hidden="true" className="challenge-option__action">
                  {challengeId === challenge.id ? <FiCheck /> : <FiArrowUpRight />}
                </span>
              </span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InProgress() {
  const { t } = useLanguage();
  const { player, progresses, selectChallenge, selectDifficulty } = usePlayer();
  const unfinished = progresses
    .filter((progress) => progress.playerId === player?.id && progress.placedPieces.length > 0)
    .map((progress) => ({
      progress,
      challenge: CHALLENGES.find((item) => item.id === progress.challengeId),
      level: LEVELS.find((item) => item.id === progress.difficulty),
    }))
    .filter((item) => item.challenge && item.level);

  return (
    <div className="selection-page in-progress-page">
      <div className="selection-heading">
        <span className="section-kicker">{t("inProgressNav")}</span>
        <h1>{t("inProgressTitle")}</h1>
        <p>{t("inProgressDescription")}</p>
      </div>

      {unfinished.length > 0 ? (
        <div className="in-progress-list">
          {unfinished.map(({ progress, challenge, level }) => (
            <Card className="in-progress-card" key={`${challenge.id}-${level.id}`}>
              <span className={`challenge-art challenge-art--${challenge.art} in-progress-card__art`} aria-hidden="true">
                <img alt="" src={challenge.image} />
              </span>
              <div className="in-progress-card__details">
                <span className="section-kicker">{t("inProgressNav")}</span>
                <h2>{t(challenge.titleKey)}</h2>
                <p className="in-progress-card__level">
                  {t(level.titleKey)} · {t("placedCount", {
                    placed: progress.placedPieces.length,
                    total: level.pieces,
                  })}
                </p>
                <div className="in-progress-card__stats">
                  <span><FiClock aria-hidden="true" />{t("time")}: {formatTime(progress.seconds)}</span>
                  <span><FiMove aria-hidden="true" />{t("moves")}: {progress.moves}</span>
                  <span><FiGrid aria-hidden="true" />{t("piecesRemaining", { count: level.pieces - progress.placedPieces.length })}</span>
                </div>
                <Button
                  onClick={() => {
                    selectChallenge(challenge.id);
                    selectDifficulty(level.id);
                  }}
                  to="/puzzle"
                >
                  {t("resumePuzzle")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="empty-state in-progress-empty">
          <span className="empty-state__mark"><FiGrid aria-hidden="true" /></span>
          <h2>{t("noInProgress")}</h2>
          <p>{t("noInProgressDescription")}</p>
          <Button to="/challenges" variant="secondary">{t("chooseChallenge")}</Button>
        </Card>
      )}
    </div>
  );
}
