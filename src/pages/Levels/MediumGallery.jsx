import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { CHALLENGES, UPLOADED_CHALLENGE_ID } from "../../constants/challenges";
import { deleteCommunityImage, getCommunityImages } from "../../services/gameService";

export default function MediumGallery() {
  const { t, language } = useLanguage();
  const { selectChallenge, selectDifficulty } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddedNotice, setShowAddedNotice] = useState(Boolean(location.state?.imageAdded));
  const BackIcon = language === "ar" ? FiArrowRight : FiArrowLeft;

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setImages(await getCommunityImages());
    } catch (requestError) {
      const message = requestError.message.toLowerCase();
      if (requestError.status === 404) setError(t("galleryEndpointMissing"));
      else if (message.includes("not configured")) setError(t("galleryDbNotConfigured"));
      else if (message.includes("temporarily unavailable")) setError(t("galleryDbUnavailable"));
      else setError(requestError.message === "Failed to fetch" ? t("galleryLoadError") : requestError.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadImages(); }, [loadImages]);
  useEffect(() => {
    if (location.state?.imageAdded) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function playOriginalImage() {
    const original = CHALLENGES.find((challenge) => challenge.difficultyKey === "medium");
    selectChallenge(original.id);
    selectDifficulty("pieces-25");
    navigate("/puzzle");
  }

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
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="selection-page medium-gallery-page">
      <Button onClick={() => navigate("/challenges")} variant="secondary">
        <BackIcon aria-hidden="true" />{t("changeChallenge")}
      </Button>
      <div className="selection-heading">
        <span className="section-kicker">{t("medium")}</span>
        <h1>{t("challengeTeamMedium")}</h1>
        <p>{t("mediumGalleryDescription")}</p>
      </div>
      {showAddedNotice ? (
        <p className="medium-gallery-notice" role="status">{t("imageAddedToMedium")}</p>
      ) : null}
      {loading ? <p aria-live="polite">{t("loading")}</p> : null}
      {error ? (
        <div className="gallery-error" role="alert">
          <p className="upload-challenge-card__error">{error}</p>
          <Button onClick={loadImages} variant="secondary">{t("tryAgain")}</Button>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="community-gallery__grid medium-gallery__grid">
          <Card className="community-image-card">
            <button className="community-image-card__play" onClick={playOriginalImage} type="button">
              <img src={CHALLENGES.find((challenge) => challenge.difficultyKey === "medium").image} alt={t("challengeTeamName")} />
              <strong>{t("originalGroupImage")}</strong>
              <small>{t("medium")} · {t("levelPieceCount", { count: 25 })}</small>
              <span>{t("playCommunityImage")}</span>
            </button>
          </Card>
          {images.map((image) => (
            <Card className="community-image-card" key={image.id}>
              <button className="community-image-card__play" onClick={() => playCommunityImage(image)} type="button">
                <img src={image.dataUrl} alt={image.name} />
                <strong>{image.name}</strong>
                <small>{t("medium")} · {t("levelPieceCount", { count: 25 })}</small>
                <span>{t("playCommunityImage")}</span>
              </button>
              <Button onClick={() => removeCommunityImage(image)} variant="secondary">{t("deleteCommunityImage")}</Button>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
