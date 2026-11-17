import Player from "../models/Player.js";
import PuzzleAttempt from "../models/PuzzleAttempt.js";

export async function saveAttempt(request, response) {
  const body = request.body ?? {};
  const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
  const player = await Player.findOne({ clientId: playerId });
  if (!player) {
    return response.status(400).json({
      status: "error",
      message: "Register the player before saving a puzzle result.",
    });
  }

  const attemptId = typeof body.id === "string" ? body.id.trim() : "";
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  const difficulty = body.difficulty;
  const completionTimeSeconds = Number(body.completionTimeSeconds);
  const moves = Number(body.moves);

  if (
    attemptId.length < 8 ||
    !challengeId ||
    !["pieces-50", "pieces-75", "pieces-100"].includes(difficulty) ||
    !Number.isInteger(completionTimeSeconds) ||
    completionTimeSeconds < 0 ||
    !Number.isInteger(moves) ||
    moves < 1
  ) {
    return response.status(400).json({
      status: "error",
      message: "The puzzle result has missing or invalid score details.",
    });
  }

  await PuzzleAttempt.findOneAndUpdate(
    { attemptId },
    {
      $setOnInsert: {
        attemptId,
        playerId: player.clientId,
        playerName: player.name,
        cycleNumber: player.cycleNumber,
        challengeId,
        difficulty,
        completionTimeSeconds,
        moves,
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  response.status(201).json({ status: "ok", message: "Puzzle result saved." });
}

export async function getLeaderboard(request, response) {
  const { challengeId, difficulty, sortBy = "time" } = request.query;
  if (
    typeof challengeId !== "string" ||
    !challengeId.trim() ||
    !["pieces-50", "pieces-75", "pieces-100"].includes(difficulty) ||
    !["time", "moves"].includes(sortBy)
  ) {
    return response.status(400).json({
      status: "error",
      message: "Choose a valid puzzle and ranking order.",
    });
  }

  const attempts = await PuzzleAttempt.find({
    challengeId: challengeId.trim(),
    difficulty,
  })
    .select("playerId playerName cycleNumber challengeId difficulty completionTimeSeconds moves")
    .lean();

  const personalBests = new Map();
  for (const attempt of attempts) {
    const existing = personalBests.get(attempt.playerId);
    const better =
      !existing ||
      (sortBy === "moves"
        ? attempt.moves < existing.moves ||
          (attempt.moves === existing.moves &&
            attempt.completionTimeSeconds < existing.completionTimeSeconds)
        : attempt.completionTimeSeconds < existing.completionTimeSeconds ||
          (attempt.completionTimeSeconds === existing.completionTimeSeconds &&
            attempt.moves < existing.moves));

    if (better) personalBests.set(attempt.playerId, attempt);
  }

  const entries = [...personalBests.values()].sort((first, second) =>
    sortBy === "moves"
      ? first.moves - second.moves ||
        first.completionTimeSeconds - second.completionTimeSeconds
      : first.completionTimeSeconds - second.completionTimeSeconds ||
        first.moves - second.moves,
  );

  response.json({
    status: "ok",
    entries: entries.map((entry) => ({
      player_id: entry.playerId,
      player_name: entry.playerName,
      cycle_number: entry.cycleNumber,
      challenge_id: entry.challengeId,
      difficulty: entry.difficulty,
      completion_time_seconds: entry.completionTimeSeconds,
      moves: entry.moves,
    })),
  });
}
