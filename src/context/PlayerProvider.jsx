import { useEffect, useMemo, useState } from "react";
import PlayerContext from "./PlayerContext";
import { CHALLENGES, UPLOADED_CHALLENGE_ID } from "../constants/challenges";
import { LEVELS } from "../constants/levels";
import { registerPlayer as savePlayer } from "../services/gameService";

const STORAGE_KEY = "senet-game-state";

function isValidIndexList(values, count, allowEmpty = true) {
  return (
    Array.isArray(values) &&
    (allowEmpty || values.length > 0) &&
    values.every(
      (value) => Number.isInteger(value) && value >= 0 && value < count,
    ) &&
    new Set(values).size === values.length
  );
}

function restoreProgress(progress, player, challengeId, difficulty) {
  const level = LEVELS.find((item) => item.id === difficulty);
  const count = level?.pieces;

  if (
    !progress ||
    !player ||
    !count ||
    progress.playerId !== player.id ||
    progress.challengeId !== challengeId ||
    progress.difficulty !== difficulty ||
    !Array.isArray(progress.pieceOrder) ||
    progress.pieceOrder.length !== count ||
    new Set(progress.pieceOrder).size !== count ||
    !progress.pieceOrder.every(
      (id) => Number.isInteger(id) && id >= 0 && id < count,
    ) ||
    !isValidIndexList(progress.placedPieces, count) ||
    !Number.isInteger(progress.moves) ||
    progress.moves < 0 ||
    !Number.isInteger(progress.mistakes) ||
    progress.mistakes < 0 ||
    !Number.isInteger(progress.seconds) ||
    progress.seconds < 0 ||
    typeof progress.started !== "boolean" ||
    !Number.isInteger(progress.activeSlot) ||
    progress.activeSlot < 0 ||
    progress.activeSlot >= count ||
    (progress.selectedPiece !== null &&
      (!Number.isInteger(progress.selectedPiece) ||
        progress.selectedPiece < 0 ||
        progress.selectedPiece >= count ||
        progress.placedPieces.includes(progress.selectedPiece)))
  ) {
    return null;
  }

  return {
    playerId: progress.playerId,
    challengeId: progress.challengeId,
    difficulty: progress.difficulty,
    pieceOrder: progress.pieceOrder,
    placedPieces: progress.placedPieces,
    selectedPiece: progress.selectedPiece,
    activeSlot: progress.activeSlot,
    moves: progress.moves,
    mistakes: progress.mistakes,
    seconds: progress.seconds,
    started: progress.started,
  };
}

function readStoredState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    const player = parsed.player;
    const validPlayer =
      player &&
      typeof player.id === "string" &&
      typeof player.name === "string" &&
      player.name.trim().length > 0 &&
      Number.isInteger(Number(player.cycleNumber)) &&
      Number(player.cycleNumber) > 0;
    const challengeId = CHALLENGES.some(
      (challenge) => challenge.id === parsed.challengeId,
    ) || parsed.challengeId?.startsWith(`${UPLOADED_CHALLENGE_ID}:`)
      ? parsed.challengeId
      : null;
    const difficulty = LEVELS.some((level) => level.id === parsed.difficulty)
      ? parsed.difficulty
      : null;
    const result =
      validPlayer &&
      parsed.result?.playerId === player.id &&
      parsed.result?.challengeId === challengeId &&
      parsed.result?.difficulty === difficulty &&
      Number.isInteger(parsed.result?.moves) &&
      parsed.result.moves > 0 &&
      Number.isInteger(parsed.result?.completionTimeSeconds) &&
      parsed.result.completionTimeSeconds >= 0
        ? parsed.result
        : null;
    const savedPlayer = validPlayer ? player : null;
    const savedProgressEntries = Array.isArray(parsed.progresses)
      ? parsed.progresses
      : parsed.progress
        ? [parsed.progress]
        : [];
    const progresses = savedPlayer
      ? savedProgressEntries
          .map((savedProgress) => {
            const validChallenge = CHALLENGES.some(
              (challenge) => challenge.id === savedProgress?.challengeId,
            ) || savedProgress?.challengeId?.startsWith(`${UPLOADED_CHALLENGE_ID}:`);
            const validDifficulty = LEVELS.some(
              (level) => level.id === savedProgress?.difficulty,
            );
            if (!validChallenge || !validDifficulty) return null;

            const restored = restoreProgress(
              savedProgress,
              savedPlayer,
              savedProgress.challengeId,
              savedProgress.difficulty,
            );
            return restored?.placedPieces.length > 0 ? restored : null;
          })
          .filter(Boolean)
      : [];

    return {
      ...parsed,
      player: savedPlayer,
      challengeId: savedPlayer ? challengeId : null,
      difficulty: savedPlayer && challengeId ? difficulty : null,
      result,
      progress: null,
      progresses,
    };
  } catch (error) {
    console.error("Could not restore the saved Senet player state.", error);
    return {};
  }
}

export default function PlayerProvider({ children }) {
  const [gameState, setGameState] = useState(readStoredState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const value = useMemo(
    () => ({
      player: gameState.player ?? null,
      challengeId: gameState.challengeId ?? null,
      difficulty: gameState.difficulty ?? null,
      result: gameState.result ?? null,
      progress:
        gameState.progresses?.find(
          (progress) =>
            progress.challengeId === gameState.challengeId &&
            progress.difficulty === gameState.difficulty,
        ) ?? null,
      progresses: gameState.progresses ?? [],
      registerPlayer: async ({ name, cycleNumber }) => {
        const player = await savePlayer({
          id: gameState.player?.id ?? window.crypto.randomUUID(),
          name: name.trim(),
          cycleNumber: Number(cycleNumber),
        });
        setGameState((current) => ({ ...current, player }));
        return player;
      },
      selectChallenge: (challengeId) => {
        setGameState((current) => ({
          ...current,
          challengeId,
          difficulty: current.challengeId === challengeId ? current.difficulty : null,
          result: null,
        }));
      },
      selectDifficulty: (difficulty) => {
        setGameState((current) => ({
          ...current,
          difficulty,
          result: null,
        }));
      },
      saveProgress: (progress) => {
        setGameState((current) => {
          const progresses = current.progresses ?? [];
          const existingIndex = progresses.findIndex(
            (item) =>
              item.challengeId === progress.challengeId &&
              item.difficulty === progress.difficulty,
          );
          if (
            existingIndex >= 0 &&
            JSON.stringify(progresses[existingIndex]) === JSON.stringify(progress)
          ) {
            return current;
          }
          const nextProgresses = [...progresses];
          if (existingIndex >= 0) nextProgresses[existingIndex] = progress;
          else nextProgresses.push(progress);
          return { ...current, progresses: nextProgresses };
        });
      },
      clearProgress: (challengeId = gameState.challengeId, difficulty = gameState.difficulty) => {
        setGameState((current) => {
          const nextProgresses = (current.progresses ?? []).filter(
            (progress) =>
              progress.challengeId !== challengeId ||
              progress.difficulty !== difficulty,
          );
          return nextProgresses.length === (current.progresses ?? []).length
            ? current
            : { ...current, progresses: nextProgresses };
        });
      },
      completeAttempt: (result) => {
        setGameState((current) => ({
          ...current,
          result,
          progresses: (current.progresses ?? []).filter(
            (progress) =>
              progress.challengeId !== result.challengeId ||
              progress.difficulty !== result.difficulty,
          ),
        }));
      },
    }),
    [gameState],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

