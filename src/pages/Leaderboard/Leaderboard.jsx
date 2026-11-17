import { useEffect, useRef, useState } from "react";
import { FiAward, FiChevronDown, FiRefreshCw, FiUser } from "react-icons/fi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import { CHALLENGES } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { getLeaderboard, getPlayerAttempts } from "../../services/gameService";

function formatTime(seconds) {
  const minutes = Math.floor(Number(seconds) / 60).toString().padStart(2, "0");
  const remainder = (Number(seconds) % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function PuzzleSelect({ label, value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];
  const listId = "leaderboard-puzzle-options";

  function focusOption(index) {
    const nextIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  }

  function showOptions(index = selectedIndex) {
    const safeIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(safeIndex);
    setOpen(true);
    requestAnimationFrame(() => optionRefs.current[safeIndex]?.focus());
  }

  function chooseOption(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      showOptions(selectedIndex + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showOptions();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <label
      className="leaderboard-puzzle-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span>{label}</span>
      <span className="leaderboard-select">
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="leaderboard-select__trigger"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : showOptions())}
          onKeyDown={handleTriggerKeyDown}
          ref={triggerRef}
          type="button"
        >
          {selectedOption?.label}
          <FiChevronDown aria-hidden="true" />
        </button>
        {open && (
          <span aria-label={label} className="leaderboard-select__menu" id={listId} role="listbox">
            {options.map((option, index) => (
              <button
                aria-selected={option.value === value}
                className="leaderboard-select__option"
                key={option.value}
                onClick={() => chooseOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onMouseEnter={() => setActiveIndex(index)}
                ref={(element) => { optionRefs.current[index] = element; }}
                role="option"
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </span>
    </label>
  );
}

export default function Leaderboard() {
  const { language, t } = useLanguage();
  const {
    player,
    challengeId: selectedChallengeId,
    result,
  } = usePlayer();
  const [scope, setScope] = useState(() => ({
    challengeId: result?.challengeId ?? selectedChallengeId ?? CHALLENGES[0].id,
  }));
  const [scopeReady, setScopeReady] = useState(false);
  const [sortBy, setSortBy] = useState("time");
  const [retryKey, setRetryKey] = useState(0);
  const [data, setData] = useState({
    status: "loading",
    configured: false,
    entries: [],
  });
  const challenge = CHALLENGES.find((item) => item.id === scope.challengeId);

  useEffect(() => {
    let active = true;
    getPlayerAttempts(player.id)
      .then((attempts) => {
        if (!active) return;
        if (result) {
          setScope({ challengeId: result.challengeId });
          return;
        }

        const latestAttempt = attempts[0];
        if (latestAttempt) {
          setScope({ challengeId: latestAttempt.challengeId });
        }
      })
      .catch(() => {
        // Keep the currently selected puzzle if saved attempts cannot be loaded.
      })
      .finally(() => {
        if (active) setScopeReady(true);
      });

    return () => {
      active = false;
    };
  }, [player.id, result]);

  useEffect(() => {
    if (!scopeReady || !challenge) return undefined;
    let active = true;
    getLeaderboard({
      challengeId: scope.challengeId,
      difficulty: challenge.levelId,
      sortBy,
    })
      .then((response) => {
        if (active) {
          setData({
            status: "loaded",
            configured: response.configured,
            entries: response.entries,
          });
        }
      })
      .catch((error) => {
        if (active) {
          setData({
            status: "error",
            configured: true,
            entries: [],
            message: error.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [scopeReady, scope, retryKey, sortBy, challenge]);

  function changeScope(key, value) {
    setData((current) => ({ ...current, status: "loading" }));
    setScope((current) => ({ ...current, [key]: value }));
  }

  function changeSort(nextSort) {
    if (sortBy === nextSort) return;
    setData((current) => ({ ...current, status: "loading" }));
    setSortBy(nextSort);
  }

  function retry() {
    setData((current) => ({ ...current, status: "loading" }));
    setRetryKey((current) => current + 1);
  }

  return (
    <div className="leaderboard-page">
      <section className="leaderboard-intro">
        <span className="eyebrow"><FiAward aria-hidden="true" />{t("rankings")}</span>
        <h1>{t("leaderboardTitle")}</h1>
        <p>{t("leaderboardDescription")}</p>
        <div className="leaderboard-filters">
          <PuzzleSelect
            disabled={!scopeReady}
            label={t("challenge")}
            onChange={(value) => changeScope("challengeId", value)}
            options={CHALLENGES.map((item) => ({ value: item.id, label: t(item.titleKey) }))}
            value={scope.challengeId}
          />
        </div>
        <span className="leaderboard-scope">
          {t(challenge?.titleKey ?? "puzzle")}
        </span>
      </section>

      <Card className="leaderboard-card">
        <div className="leaderboard-card__heading">
          <div>
            <span className="section-kicker">{t("playerRecords")}</span>
            <h2>{t("rankBy")}</h2>
          </div>
          <div aria-label={t("rankBy")} className="leaderboard-sort" role="group">
            <button
              aria-pressed={sortBy === "time"}
              className={sortBy === "time" ? "is-active" : ""}
              onClick={() => changeSort("time")}
              type="button"
            >
              {t("bestTime")}
            </button>
            <button
              aria-pressed={sortBy === "moves"}
              className={sortBy === "moves" ? "is-active" : ""}
              onClick={() => changeSort("moves")}
              type="button"
            >
              {t("fewestMoves")}
            </button>
          </div>
        </div>

        {data.status === "loading" ? (
          <div className="leaderboard-message" role="status">
            <Loader ariaLabel={t("loadingResults")} type="challenge" />
            <span>{t("loadingResults")}</span>
          </div>
        ) : data.status === "error" ? (
          <div className="leaderboard-message leaderboard-message--error" role="alert">
            <p>{t("leaderboardLoadError")}</p>
            <small>{data.message}</small>
            <Button onClick={retry} variant="secondary">
              <FiRefreshCw aria-hidden="true" />{t("tryAgain")}
            </Button>
          </div>
        ) : data.entries.length === 0 ? (
          <div className="empty-state leaderboard-empty">
            <span className="empty-state__mark"><FiAward aria-hidden="true" /></span>
            <h2>{t("noResults")}</h2>
            <p>{t("noResultsDescription")}</p>

          </div>
        ) : (
          <>
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th scope="col">{t("rank")}</th>
                    <th scope="col">{t("player")}</th>
                    <th scope="col">{t("cycleNumber")}</th>
                    <th scope="col">{t("bestTime")}</th>
                    <th scope="col">{t("moves")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry, index) => (
                    <tr
                      className={
                        index < 3
                          ? `leaderboard-row leaderboard-row--top-${index + 1}`
                          : "leaderboard-row"
                      }
                      key={entry.player_id}
                    >
                      <td><span className="rank-number">{String(index + 1).padStart(2, "0")}</span></td>
                      <td>
                        <div className="player-cell">
                          <span className={`player-avatar player-avatar--${index % 3}`}>
                            {entry.player_name.trim().slice(0, 2).toLocaleUpperCase(language)}
                          </span>
                          <strong>{entry.player_name}</strong>
                        </div>
                      </td>
                      <td>{entry.cycle_number}</td>
                      <td className="time-cell">{formatTime(entry.completion_time_seconds)}</td>
                      <td>{entry.moves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="leaderboard-card__footer">
              <span>{t("personalBestPerPlayer")}</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const { language, t } = useLanguage();
  const { player } = usePlayer();
  const [retryKey, setRetryKey] = useState(0);
  const [data, setData] = useState({ status: "loading", entries: [] });

  useEffect(() => {
    let active = true;
    getPlayerAttempts(player.id)
      .then((entries) => {
        if (active) setData({ status: "loaded", entries });
      })
      .catch((error) => {
        if (active) setData({ status: "error", entries: [], message: error.message });
      });

    return () => {
      active = false;
    };
  }, [player.id, retryKey]);

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div className="leaderboard-page profile-page">
      <section className="leaderboard-intro">
        <span className="eyebrow"><FiUser aria-hidden="true" />{t("myProfile")}</span>
        <h1>{t("myProfileTitle")}</h1>
        <p>{t("profileDescription")}</p>
      </section>

      <Card className="leaderboard-card profile-card">
        <div className="leaderboard-card__heading profile-card__heading">
          <div className="profile-player">
            <span className="player-avatar"><FiUser aria-hidden="true" /></span>
            <div>
              <h2>{player.name}</h2>
              <span>{t("cycle")}: {player.cycleNumber}</span>
            </div>
          </div>
        </div>

        <div className="profile-attempts-heading">
          <h2>{t("profileAttempts")}</h2>
          {data.status === "loaded" ? <span>{data.entries.length}</span> : null}
        </div>

        {data.status === "loading" ? (
          <div className="leaderboard-message" role="status">
            <Loader ariaLabel={t("loadingResults")} type="challenge" />
            <span>{t("loadingResults")}</span>
          </div>
        ) : data.status === "error" ? (
          <div className="leaderboard-message leaderboard-message--error" role="alert">
            <p>{t("profileLoadError")}</p>
            <small>{data.message}</small>
            <Button
              onClick={() => {
                setData((current) => ({ ...current, status: "loading" }));
                setRetryKey((current) => current + 1);
              }}
              variant="secondary"
            >
              <FiRefreshCw aria-hidden="true" />{t("tryAgain")}
            </Button>
          </div>
        ) : data.entries.length === 0 ? (
          <div className="empty-state leaderboard-empty">
            <span className="empty-state__mark"><FiUser aria-hidden="true" /></span>
            <h2>{t("profileNoAttempts")}</h2>
            <p>{t("profileNoAttemptsDescription")}</p>
          </div>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">{t("challenge")}</th>
                  <th scope="col">{t("level")}</th>
                  <th scope="col">{t("time")}</th>
                  <th scope="col">{t("moves")}</th>
                  <th scope="col">{t("completedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => {
                  const challenge = CHALLENGES.find((item) => item.id === entry.challengeId);
                  const level = LEVELS.find((item) => item.id === entry.difficulty);
                  return (
                    <tr className="leaderboard-row" key={entry.id}>
                      <td>{t(challenge?.titleKey ?? "challenge")}</td>
                      <td>{t(level?.titleKey ?? "level")}</td>
                      <td className="time-cell">{formatTime(entry.completionTimeSeconds)}</td>
                      <td>{entry.moves}</td>
                      <td>{formatDate(entry.completedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
