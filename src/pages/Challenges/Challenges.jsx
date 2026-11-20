import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiCheck, FiClock, FiGrid, FiMove, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { CHALLENGES, UPLOADED_CHALLENGE_ID } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";
import { deleteCommunityImage, getCommunityImages, uploadCommunityImage } from "../../services/gameService";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function Challenges() {
  const { t } = useLanguage();
  const { player, challengeId, selectChallenge, selectDifficulty } = usePlayer();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [communityImages, setCommunityImages] = useState([]);
  const [galleryError, setGalleryError] = useState("");
  const [galleryLoading, setGalleryLoading] = useState(true);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError("");
    try {
      setCommunityImages(await getCommunityImages());
    } catch (error) {
      const message = error.message.toLowerCase();
      if (error.status === 404) setGalleryError(t("galleryEndpointMissing"));
      else if (message.includes("not configured")) setGalleryError(t("galleryDbNotConfigured"));
      else if (message.includes("temporarily unavailable")) setGalleryError(t("galleryDbUnavailable"));
      else setGalleryError(error.message === "Failed to fetch" ? t("galleryLoadError") : error.message);
    } finally {
      setGalleryLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadGallery(); }, [loadGallery]);

  function playCommunityImage(image) {
    selectChallenge(`${UPLOADED_CHALLENGE_ID}:${image.id}`);
    selectDifficulty("pieces-25");
    navigate("/puzzle");
  }

  async function removeCommunityImage(image) {
    const token = window.prompt(t("imageAdminTokenPrompt"));
    if (!token) return;
    try {
      await deleteCommunityImage(image.id, token);
      setCommunityImages((current) => current.filter((item) => item.id !== image.id));
      setGalleryError("");
    } catch (error) {
      setGalleryError(error.message);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setUploadError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError(t("uploadImageError"));
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      const uploadedImage = await uploadCommunityImage(file.name, dataUrl);
      setCommunityImages((current) => [uploadedImage, ...current]);
      playCommunityImage(uploadedImage);
    } catch (error) {
      setUploadError(error.message || t("uploadImageError"));
    }
  }

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
        <Card className="upload-challenge-card">
          <span className="challenge-art upload-challenge-card__art" aria-hidden="true"><FiUpload /></span>
          <strong>{t("uploadGroupImage")}</strong>
          <p>{t("uploadGroupImageDescription")}</p>
          <input
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
            ref={imageInputRef}
            type="file"
          />
          <Button onClick={() => imageInputRef.current?.click()} variant="secondary">
            {t("uploadImageButton")}<FiArrowUpRight aria-hidden="true" />
          </Button>
          {uploadError ? <p className="upload-challenge-card__error" role="alert">{uploadError}</p> : null}
        </Card>
      </div>
      {galleryError ? (
        <div className="gallery-error" role="alert">
          <p className="upload-challenge-card__error">{galleryError}</p>
          <Button onClick={loadGallery} variant="secondary">{t("tryAgain")}</Button>
        </div>
      ) : null}
      {galleryLoading ? <p aria-live="polite">{t("loading")}</p> : null}
      {communityImages.length > 0 ? (
        <section className="community-gallery" aria-labelledby="community-gallery-title">
          <h2 id="community-gallery-title">{t("communityGalleryTitle")}</h2>
          <div className="community-gallery__grid">
            {communityImages.map((image) => (
              <Card className="community-image-card" key={image.id}>
                <img src={image.dataUrl} alt={image.name} />
                <strong>{image.name}</strong>
                <small>{t("medium")} · {t("levelPieceCount", { count: 25 })}</small>
                <Button onClick={() => playCommunityImage(image)}>{t("playCommunityImage")}</Button>
                <Button onClick={() => removeCommunityImage(image)} variant="secondary">{t("deleteCommunityImage")}</Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
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
