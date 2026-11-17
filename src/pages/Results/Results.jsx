import { useEffect, useState } from "react";
import {
  FiAward,
  FiArrowRight,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { CHALLENGES } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { submitAttempt } from "../../services/gameService";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function Results() {
  const { t } = useLanguage();
  const { player, result } = usePlayer();
  const [retryKey, setRetryKey] = useState(0);
  const [saveState, setSaveState] = useState({ status: "saving" });
  const challenge = CHALLENGES.find(
    (item) => item.id === result?.challengeId,
  );
  const level = LEVELS.find((item) => item.id === result?.difficulty);

  useEffect(() => {
    let active = true;
    submitAttempt(result)
      .then((response) => {
        if (!active) return;
        setSaveState({
          status: response.configured ? "saved" : "unconfigured",
        });
      })
      .catch((error) => {
        if (!active) return;
        setSaveState({ status: "error", message: error.message });
      });

    return () => {
      active = false;
    };
  }, [result, retryKey]);

  return (
    <div className="results-page">
      <Card className="results-card">
        <span className="results-card__icon"><FiAward aria-hidden="true" /></span>
        <span className="section-kicker">{t("stepThree")}</span>
        <h1>{t("challengeComplete")}</h1>
        <p className="results-card__description">
          {t("resultGreeting", { name: player.name })}
        </p>
        <div className="results-stats">
          <div className="results-stat">
            <span>{t("time")}</span>
            <strong>{formatTime(result.completionTimeSeconds)}</strong>
          </div>
          <div className="results-stat">
            <span>{t("moves")}</span>
            <strong>{result.moves}</strong>
          </div>
          <div className="results-stat">
            <span>{t("level")}</span>
            <strong>{t(level?.titleKey ?? "level50")}</strong>
          </div>
        </div>
        <p className="results-challenge">{t(challenge?.titleKey ?? "puzzle")}</p>
        <div aria-live="polite" className={`save-status save-status--${saveState.status}`}>
          {saveState.status === "saving" ? (
            t("savingAttempt")
          ) : saveState.status === "saved" ? (
            <><FiCheckCircle aria-hidden="true" />{t("attemptSaved")}</>
          ) : saveState.status === "unconfigured" ? (
            t("backendPending")
          ) : (
            <div className="save-status__error">
              <span>{t("attemptSaveError")} {saveState.message}</span>
              <Button
                onClick={() => {
                  setSaveState({ status: "saving" });
                  setRetryKey((current) => current + 1);
                }}
                variant="quiet"
              >
                <FiRefreshCw aria-hidden="true" />{t("tryAgain")}
              </Button>
            </div>
          )}
        </div>
        <div className="results-actions">
          <Button
            disabled={saveState.status === "saving"}
            loading={saveState.status === "saving"}
            to="/leaderboard"
            variant="secondary"
          >
            {t("viewLeaderboard")}<FiArrowRight aria-hidden="true" />
          </Button>
          <Button to="/challenges">
            {t("playAgain")}<FiArrowRight aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
