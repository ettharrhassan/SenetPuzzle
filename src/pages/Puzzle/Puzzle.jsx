import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { FaHandPointer } from "react-icons/fa6";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMove,
  FiRefreshCw,
} from "react-icons/fi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { CHALLENGES } from "../../constants/challenges";
import { LEVELS } from "../../constants/levels";
import JigsawPiece from "../../components/puzzle/JigsawPiece";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";
import { createJigsawLayout } from "../../utils/jigsaw";

const JIGSAW_LAYOUTS = new Map(
  LEVELS.map((level) => [
    level.id,
    createJigsawLayout(level.columns, level.rows),
  ]),
);
function shufflePieces(pieceCount) {
  const pieces = Array.from({ length: pieceCount }, (_, index) => index);
  for (let index = pieces.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index], pieces[swapIndex]] = [pieces[swapIndex], pieces[index]];
  }
  return pieces;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function Puzzle() {
  const { language, t } = useLanguage();
  const { player, challengeId, difficulty, progress, saveProgress, clearProgress, completeAttempt } = usePlayer();
  const navigate = useNavigate();
  const selectedLevel = LEVELS.find((level) => level.id === difficulty);
  const selectedChallenge = CHALLENGES.find(
    (challenge) => challenge.id === challengeId,
  );
  const pieceCount = selectedLevel?.pieces ?? 50;
  const columns = selectedLevel?.columns ?? 10;
  const rows = selectedLevel?.rows ?? 5;
  const jigsawLayout =
    JIGSAW_LAYOUTS.get(difficulty) ?? JIGSAW_LAYOUTS.get(LEVELS[0].id);
  const savedProgress =
    progress?.playerId === player?.id &&
    progress?.challengeId === challengeId &&
    progress?.difficulty === difficulty &&
    progress?.pieceOrder?.length === pieceCount
      ? progress
      : null;
  const firstPiece = jigsawLayout.pieces[0];
  const [boardSlotSize, setBoardSlotSize] = useState(100);
  const trayPieceWidth =
    boardSlotSize * (firstPiece.viewBoxWidth / jigsawLayout.cellWidth);
  const trayPieceHeight =
    boardSlotSize * (firstPiece.viewBoxHeight / jigsawLayout.cellHeight);
  const boardRef = useRef(null);
  const remainingPiecesRef = useRef(null);
  const pointerDragRef = useRef(null);
  const activePointerListenersRef = useRef(null);
  const suppressClickRef = useRef(false);
  const shouldFocusBoardRef = useRef(false);
  const [pieceOrder, setPieceOrder] = useState(
    () => savedProgress?.pieceOrder ?? shufflePieces(pieceCount),
  );
  const [placedPieces, setPlacedPieces] = useState(
    () => new Set(savedProgress?.placedPieces ?? []),
  );
  const [selectedPiece, setSelectedPiece] = useState(
    () => savedProgress?.selectedPiece ?? null,
  );
  const [activeSlot, setActiveSlot] = useState(
    () => savedProgress?.activeSlot ?? 0,
  );
  const [moves, setMoves] = useState(() => savedProgress?.moves ?? 0);
  const [mistakes, setMistakes] = useState(() => savedProgress?.mistakes ?? 0);
  const [seconds, setSeconds] = useState(() => savedProgress?.seconds ?? 0);
  const [started, setStarted] = useState(
    () => (savedProgress?.placedPieces?.length ?? 0) > 0,
  );
  const [feedback, setFeedback] = useState("");
  const [dragPreview, setDragPreview] = useState(null);
  const BackIcon = language === "ar" ? FiArrowRight : FiArrowLeft;
  const PreviousIcon = language === "ar" ? FiChevronRight : FiChevronLeft;
  const NextIcon = language === "ar" ? FiChevronLeft : FiChevronRight;
  const isComplete = placedPieces.size === pieceCount;
  const remainingPieces = pieceOrder.filter(
    (pieceId) => !placedPieces.has(pieceId),
  );

  useEffect(() => {
    if (!player || !challengeId || !difficulty) return;
    if (isComplete) {
      clearProgress();
      return;
    }

    if (placedPieces.size === 0) {
      clearProgress();
      return;
    }

    saveProgress({
      playerId: player.id,
      challengeId,
      difficulty,
      pieceOrder,
      placedPieces: [...placedPieces],
      selectedPiece,
      activeSlot,
      moves,
      mistakes,
      seconds,
      started,
    });
  }, [
    player,
    challengeId,
    difficulty,
    pieceOrder,
    placedPieces,
    selectedPiece,
    activeSlot,
    moves,
    mistakes,
    seconds,
    started,
    isComplete,
    saveProgress,
    clearProgress,
  ]);
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;

    const updateSlotSize = () => {
      const styles = window.getComputedStyle(board);
      const padding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      setBoardSlotSize((board.clientWidth - padding) / columns);
    };

    updateSlotSize();
    const observer = new ResizeObserver(updateSlotSize);
    observer.observe(board);
    return () => observer.disconnect();
  }, [columns]);

  useEffect(() => {
    if (!started || isComplete) return undefined;
    const timerId = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timerId);
  }, [started, isComplete]);

  useEffect(
    () => () => {
      const listeners = activePointerListenersRef.current;
      if (listeners) {
        window.removeEventListener("pointermove", listeners.move, true);
        window.removeEventListener("pointerup", listeners.up, true);
        window.removeEventListener("pointercancel", listeners.cancel, true);
      }
      document.documentElement.classList.remove(
        "is-puzzle-piece-dragging",
      );
    },
    [],
  );

  useEffect(() => {
    if (selectedPiece !== null && shouldFocusBoardRef.current) {
      boardRef.current?.focus();
      shouldFocusBoardRef.current = false;
    }
  }, [selectedPiece]);

  function restartPuzzle() {
    clearProgress();
    setPieceOrder(shufflePieces(pieceCount));
    setPlacedPieces(new Set());
    setSelectedPiece(null);
    setMoves(0);
    setMistakes(0);
    setSeconds(0);
    setStarted(false);
    setFeedback("");
    setDragPreview(null);
  }

  function placePiece(pieceId, slotIndex) {
    if (
      isComplete ||
      !Number.isInteger(pieceId) ||
      !Number.isInteger(slotIndex) ||
      pieceId < 0 ||
      pieceId >= pieceCount ||
      placedPieces.has(pieceId)
    ) {
      return;
    }

    setMoves((currentMoves) => currentMoves + 1);
    setSelectedPiece(null);

    if (pieceId !== slotIndex || placedPieces.has(slotIndex)) {
      setMistakes((currentMistakes) => currentMistakes + 1);
      setFeedback(t("incorrectPlacement"));
      return;
    }

    setStarted(true);
    const nextPlacedPieces = new Set(placedPieces);
    nextPlacedPieces.add(slotIndex);
    setPlacedPieces(nextPlacedPieces);
    setFeedback(t("correctPlacement"));

    if (nextPlacedPieces.size === pieceCount) {
      completeAttempt({
        id: window.crypto.randomUUID(),
        playerId: player.id,
        playerName: player.name,
        cycleNumber: player.cycleNumber,
        challengeId,
        difficulty,
        moves: moves + 1,
        mistakes,
        completionTimeSeconds: seconds,
      });
      navigate("/results");
    }
  }

  function handlePieceClick(event, pieceId) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (event.detail === 0) shouldFocusBoardRef.current = true;
    setFeedback("");
    setSelectedPiece((currentPiece) =>
      currentPiece === pieceId ? null : pieceId,
    );
  }

  function handleBoardKeyDown(event) {
    const row = Math.floor(activeSlot / columns);
    const column = activeSlot % columns;
    const nextSlotByKey = {
      ArrowLeft: column > 0 ? activeSlot - 1 : activeSlot,
      ArrowRight: column < columns - 1 ? activeSlot + 1 : activeSlot,
      ArrowUp: row > 0 ? activeSlot - columns : activeSlot,
      ArrowDown: row < rows - 1 ? activeSlot + columns : activeSlot,
    };

    if (Object.hasOwn(nextSlotByKey, event.key)) {
      event.preventDefault();
      setActiveSlot(nextSlotByKey[event.key]);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      selectedPiece !== null
    ) {
      event.preventDefault();
      placePiece(selectedPiece, activeSlot);
    }
  }

  function handlePointerDown(event, pieceId) {
    if (
      event.button !== 0 ||
      placedPieces.has(pieceId) ||
      pointerDragRef.current
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const pieceBounds = event.currentTarget.getBoundingClientRect();
    pointerDragRef.current = {
      pieceId,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      mode: null,
      lastX: event.clientX,
      startX: event.clientX,
      grabOffsetX: event.clientX - pieceBounds.left,
      grabOffsetY: event.clientY - pieceBounds.top,
      width: pieceBounds.width,
      height: pieceBounds.height,
    };
    const listeners = {
      move: handlePointerMove,
      up: finishPointerDrag,
      cancel: cancelPointerDrag,
    };
    activePointerListenersRef.current = listeners;
    window.addEventListener("pointermove", listeners.move, true);
    window.addEventListener("pointerup", listeners.up, true);
    window.addEventListener("pointercancel", listeners.cancel, true);
  }

  function handlePointerMove(event) {
    const activeDrag = pointerDragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - activeDrag.startX;
    const deltaY = event.clientY - activeDrag.startY;
    if (!activeDrag.mode) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return;

      activeDrag.mode =
        activeDrag.pointerType === "touch" &&
        Math.abs(deltaX) > Math.abs(deltaY)
          ? "scroll"
          : "drag";
      setFeedback("");
      if (activeDrag.mode === "drag") {
        document.documentElement.classList.add("is-puzzle-piece-dragging");
      }
    }

    if (activeDrag.mode === "scroll") {
      const tray = remainingPiecesRef.current;
      if (tray) tray.scrollLeft -= event.clientX - activeDrag.lastX;
      activeDrag.lastX = event.clientX;
      return;
    }

    setDragPreview({
      pieceId: activeDrag.pieceId,
      x: event.clientX - activeDrag.grabOffsetX,
      y: event.clientY - activeDrag.grabOffsetY,
      grabOffsetX: activeDrag.grabOffsetX,
      grabOffsetY: activeDrag.grabOffsetY,
      width: activeDrag.width,
      height: activeDrag.height,
    });
  }

  function finishPointerDrag(event) {
    const activeDrag = pointerDragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    removePointerListeners();
    if (activeDrag.mode === "drag") {
      suppressClickRef.current = true;
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-puzzle-slot]");
      if (target) {
        placePiece(activeDrag.pieceId, Number(target.dataset.puzzleSlot));
      }
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 250);
    } else if (activeDrag.mode === "scroll") {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 250);
    }

    pointerDragRef.current = null;
    setDragPreview(null);
  }

  function removePointerListeners() {
    const listeners = activePointerListenersRef.current;
    document.documentElement.classList.remove("is-puzzle-piece-dragging");
    if (!listeners) return;
    window.removeEventListener("pointermove", listeners.move, true);
    window.removeEventListener("pointerup", listeners.up, true);
    window.removeEventListener("pointercancel", listeners.cancel, true);
    activePointerListenersRef.current = null;
  }

  function cancelPointerDrag() {
    removePointerListeners();
    pointerDragRef.current = null;
    setDragPreview(null);
  }

  function scrollPieces(direction) {
    remainingPiecesRef.current?.scrollBy({
      left: direction * remainingPiecesRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <div className="puzzle-page">
      <div className="page-heading">
        <div>
          <Link className="back-link" to="/challenges">
            <BackIcon aria-hidden="true" />
            {t("changeChallenge")}
          </Link>
          <span className="section-kicker">{t("stepTwo")}</span>
          <h1>{t(selectedChallenge?.titleKey ?? "puzzle")}</h1>
        </div>
        <Button onClick={restartPuzzle} variant="secondary">
          <FiRefreshCw aria-hidden="true" />
          {t("restart")}
        </Button>
      </div>

      <div className="assembly-header" aria-label={t("currentAttempt")}>
        <Card className="assembly-stat">
          <FiClock aria-hidden="true" />
          <span>{t("time")}</span>
          <strong>{formatTime(seconds)}</strong>
        </Card>
        <Card className="assembly-stat">
          <FiMove aria-hidden="true" />
          <span>{t("moves")}</span>
          <strong>{moves.toLocaleString(language === "ar" ? "ar" : "en")}</strong>
        </Card>
        <Card className="assembly-stat">
          <FiAlertCircle aria-hidden="true" />
          <span>{t("mistakes")}</span>
          <strong>{mistakes.toLocaleString(language === "ar" ? "ar" : "en")}</strong>
        </Card>
      </div>

      <Card className="assembly-card">
        <div className="assembly-card__heading">
          <div>
            <span className="section-kicker">
              {t(selectedLevel?.titleKey ?? "level50")}
            </span>
            <h2>{t("puzzle")}</h2>
          </div>
          <span className="challenge-badge">
            {t("levelPieceCount", { count: pieceCount })}
          </span>
        </div>

        <div
          aria-label={t("emptyPuzzleBoard")}
          className="assembly-board"
          dir="ltr"
          onKeyDown={handleBoardKeyDown}
          ref={boardRef}
          tabIndex={0}
          role="grid"
          aria-activedescendant={`puzzle-slot-${activeSlot}`}
          style={{
            aspectRatio: `${columns} / ${rows}`,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: pieceCount }, (_, slotIndex) => {
            const isPlaced = placedPieces.has(slotIndex);
            return (
              <div
                aria-label={
                  isPlaced
                    ? t("piecePlaced", { number: slotIndex + 1 })
                    : t("emptyPieceSlot", { number: slotIndex + 1 })
                }
                className={`assembly-slot${isPlaced ? " is-placed" : ""}${
                  activeSlot === slotIndex ? " is-active" : ""
                }${
                  selectedPiece !== null && !isPlaced ? " can-receive-piece" : ""
                }`}
                data-puzzle-slot={slotIndex}
                id={`puzzle-slot-${slotIndex}`}
                key={slotIndex}
                onClick={() => {
                  setActiveSlot(slotIndex);
                  if (selectedPiece !== null) {
                    placePiece(selectedPiece, slotIndex);
                  }
                }}
                role="gridcell"
                tabIndex={-1}
              >
                <JigsawPiece
                  className={
                    isPlaced
                      ? "jigsaw-piece jigsaw-piece--placed"
                      : "jigsaw-piece jigsaw-piece--placeholder"
                  }
                  clipId={"board-piece-" + pieceCount + "-" + slotIndex}
                  image={selectedChallenge?.image}
                  piece={jigsawLayout.pieces[slotIndex]}
                  placeholder={!isPlaced}
                  style={{
                    left:
                      -(jigsawLayout.pieces[slotIndex].edgePaddingX / jigsawLayout.cellWidth) *
                      boardSlotSize,
                    top:
                      -(jigsawLayout.pieces[slotIndex].edgePaddingY / jigsawLayout.cellHeight) *
                      boardSlotSize,
                    width:
                      boardSlotSize *
                      (jigsawLayout.pieces[slotIndex].viewBoxWidth / jigsawLayout.cellWidth),
                    height:
                      boardSlotSize *
                      (jigsawLayout.pieces[slotIndex].viewBoxHeight / jigsawLayout.cellHeight),
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="assembly-progress" aria-live="polite">
          <span>{t("placedCount", { placed: placedPieces.size, total: pieceCount })}</span>
          <span>{t("piecesRemaining", { count: remainingPieces.length })}</span>
        </div>
        <p aria-live="polite" className="puzzle-instructions">
          {feedback || t("assemblyInstructions")}
        </p>

        <div className="pieces-tray">
          <div className="pieces-tray__heading">
            <div>
              <h3>{t("piecesToPlace")}</h3>
              <span>{t("piecesRemaining", { count: remainingPieces.length })}</span>
            </div>
          </div>
          <div className="pieces-tray__row">
            <button
              aria-label={t("previousPieces")}
              className="tray-scroll-button"
              onClick={() => scrollPieces(-1)}
              type="button"
            >
              <PreviousIcon aria-hidden="true" />
            </button>
            <div
              aria-label={t("piecesToPlace")}
              className="pieces-scroll"
              dir="ltr"
              ref={remainingPiecesRef}
              role="group"
            >
              {remainingPieces.map((pieceId) => (
              <button
                aria-label={t("selectPiece", { number: pieceId + 1 })}
                aria-pressed={selectedPiece === pieceId}
                className={`assembly-piece${
                  selectedPiece === pieceId ? " is-selected" : ""
                }${
                  dragPreview?.pieceId === pieceId ? " is-dragging" : ""
                }`}
                style={{
                  width: `${trayPieceWidth}px`,
                  height: `${trayPieceHeight}px`,
                  clipPath: `url(#tray-piece-${pieceCount}-${pieceId})`,
                }}
                draggable={false}
                key={pieceId}
                onClick={(event) => handlePieceClick(event, pieceId)}
                onPointerDown={(event) => handlePointerDown(event, pieceId)}
                title={t("selectPiece", { number: pieceId + 1 })}
                type="button"
              >
                <JigsawPiece
                  className="jigsaw-piece jigsaw-piece--tray"
                  clipId={`tray-piece-${pieceCount}-${pieceId}`}
                  image={selectedChallenge?.image}
                  piece={jigsawLayout.pieces[pieceId]}
                />
                </button>
              ))}
            </div>
            <button
              aria-label={t("nextPieces")}
              className="tray-scroll-button"
              onClick={() => scrollPieces(1)}
              type="button"
            >
              <NextIcon aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="assembly-sidebar">
          <Card className="instructions-card">
            <span className="instructions-card__number">{t("stepTwo")}</span>
            <h3>{t("howToPlay")}</h3>
            <p>{t("assemblyInstructions")}</p>
          </Card>
        </div>

      </Card>

      {dragPreview &&
        createPortal(
          <span
            aria-hidden="true"
            className="piece-drag-preview"
            style={{
              left: dragPreview.x,
              top: dragPreview.y,
              width: dragPreview.width,
              height: dragPreview.height,
              clipPath: `url(#drag-piece-${pieceCount}-${dragPreview.pieceId})`,
            }}
          >
            <JigsawPiece
              className="jigsaw-piece jigsaw-piece--drag"
              clipId={`drag-piece-${pieceCount}-${dragPreview.pieceId}`}
              image={selectedChallenge?.image}
              piece={jigsawLayout.pieces[dragPreview.pieceId]}
            />
            <span
              aria-hidden="true"
              className="piece-drag-hand"
              style={{
                left: dragPreview.grabOffsetX,
                top: dragPreview.grabOffsetY,
              }}
            >
              <FaHandPointer />
            </span>
          </span>,
          document.body,
        )}
    </div>
  );
}

