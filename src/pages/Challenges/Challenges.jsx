import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiCheck, FiClock, FiGrid, FiMove, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { CHALLENGES } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";
import { uploadCommunityImage } from "../../services/gameService";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 2.5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The image could not be prepared for upload."));
    }, "image/jpeg", quality);
  });
}

async function preparePuzzleImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The image could not be prepared for upload.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.7, 0.58, 0.48]) {
        const blob = await canvasToJpeg(canvas, quality);
        if (blob.size <= MAX_UPLOAD_IMAGE_BYTES) return blob;
      }
      scale *= 0.8;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("The image is too large to prepare. Choose a smaller image.");
}

export default function Challenges() {
  const { t } = useLanguage();
  const { player, challengeId, selectChallenge, selectDifficulty } = usePlayer();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadInFlightRef = useRef(false);
  const previewObjectUrlRef = useRef(null);

  useEffect(() => () => {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
  }, []);

  function handleImageUpload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (uploadInFlightRef.current) return;
    setUploadError("");
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_IMAGE_TYPES.has(file.type) && !(file.type === "" && ACCEPTED_IMAGE_EXTENSIONS.has(extension))) {
      setUploadError(t("invalidImage"));
      setUploadPreview(null);
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setUploadError(t("sourceImageTooLarge", { size: 10 }));
      setUploadPreview(null);
      return;
    }

    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    const localPreviewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = localPreviewUrl;
    setUploadPreview({ src: localPreviewUrl, name: file.name, file });
    setImageTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 120));
  }

  function cancelSelectedImage() {
    if (isUploading) return;
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
    setUploadPreview(null);
    setImageTitle("");
    setUploadError("");
  }

  async function addSelectedImage() {
    const title = imageTitle.trim();
    if (!uploadPreview?.file || !title || uploadInFlightRef.current) return;
    uploadInFlightRef.current = true;
    setIsUploading(true);
    setUploadError("");
    try {
      const preparedImage = await preparePuzzleImage(uploadPreview.file);
      await uploadCommunityImage(title, preparedImage);
      URL.revokeObjectURL(uploadPreview.src);
      previewObjectUrlRef.current = null;
      setUploadPreview(null);
      setImageTitle("");
      selectChallenge("team-medium-75");
      selectDifficulty("pieces-25");
      navigate("/medium", { state: { imageAdded: true } });
    } catch (error) {
      const message = error.message.toLowerCase();
      if (error.status === 413 || message.includes("too large")) {
        setUploadError(t("uploadPayloadTooLarge"));
      } else if (error.status === 400 && (message.includes("jpg") || message.includes("image"))) {
        setUploadError(t("invalidImage"));
      } else {
        setUploadError(error.message || t("uploadImageError"));
      }
    } finally {
      uploadInFlightRef.current = false;
      setIsUploading(false);
    }
  }

  function chooseChallenge(id) {
    const challenge = CHALLENGES.find((item) => item.id === id);
    selectChallenge(id);
    selectDifficulty(challenge.levelId);
    navigate(challenge.difficultyKey === "medium" ? "/medium" : "/puzzle");
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
          <div className="challenge-level-option" key={challenge.id}>
            <button
              aria-pressed={challengeId === challenge.id}
              className={`challenge-option${challengeId === challenge.id ? " is-selected" : ""}`}
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
          </div>
        ))}
        <Card className="upload-challenge-card upload-challenge-card--below-levels">
          <span className="challenge-art upload-challenge-card__art" aria-hidden={!uploadPreview}>
            {uploadPreview ? <img alt={uploadPreview.name} src={uploadPreview.src} /> : <FiUpload />}
          </span>
          <strong>{t("uploadGroupImage")}</strong>
          <p>{t("uploadGroupImageDescription")}</p>
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={isUploading}
            onChange={handleImageUpload}
            ref={imageInputRef}
            type="file"
          />
          {isUploading ? <span aria-live="polite" className="upload-challenge-card__status">{t("uploadingImage")}</span> : null}
          <div className="upload-challenge-card__actions">
            <Button disabled={isUploading} onClick={() => imageInputRef.current?.click()} variant="secondary">
              {uploadPreview ? t("replaceImage") : t("uploadImageButton")}<FiArrowUpRight aria-hidden="true" />
            </Button>
          </div>
          {uploadError ? <p className="upload-challenge-card__error" role="alert">{uploadError}</p> : null}
        </Card>
      </div>
      {uploadPreview ? (
        <div className="image-add-dialog-backdrop">
          <section aria-labelledby="image-add-dialog-title" aria-modal="true" className="image-add-dialog" role="alertdialog">
            <h2 id="image-add-dialog-title">{t("addImageConfirmationTitle")}</h2>
            <img alt={uploadPreview.name} src={uploadPreview.src} />
            <p>{t("addImageConfirmationDescription")}</p>
            <label className="image-add-dialog__title-field">
              <span>{t("imageTitleLabel")}</span>
              <input
                autoFocus
                className="field__input"
                maxLength={120}
                onChange={(event) => setImageTitle(event.target.value)}
                placeholder={t("imageTitlePlaceholder")}
                value={imageTitle}
              />
            </label>
            {isUploading ? <p aria-live="polite" className="upload-challenge-card__status">{t("uploadingImage")}</p> : null}
            {uploadError ? <p className="upload-challenge-card__error" role="alert">{uploadError}</p> : null}
            <div className="image-add-dialog__actions">
              <Button disabled={isUploading || !imageTitle.trim()} loading={isUploading} onClick={addSelectedImage}>
                {t("addImageToMedium")}
              </Button>
              <Button disabled={isUploading} onClick={() => imageInputRef.current?.click()} variant="secondary">
                {t("replaceImage")}
              </Button>
              <Button disabled={isUploading} onClick={cancelSelectedImage} variant="secondary">
                {t("cancel")}
              </Button>
            </div>
          </section>
        </div>
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
