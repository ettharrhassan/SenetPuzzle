import Player from "../models/Player.js";
import PuzzleAttempt from "../models/PuzzleAttempt.js";

export async function registerPlayer(request, response) {
  const { clientId, name, cycleNumber } = request.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cycle = Number(cycleNumber);

  if (
    typeof clientId !== "string" ||
    clientId.trim().length < 8 ||
    !cleanName ||
    cleanName.length > 50 ||
    !Number.isInteger(cycle) ||
    cycle < 1 ||
    cycle > 999
  ) {
    return response.status(400).json({
      status: "error",
      message: "Enter a player name and a cycle number from 1 to 999.",
    });
  }

  const player = await Player.findOneAndUpdate(
    { clientId: clientId.trim() },
    { $set: { name: cleanName, cycleNumber: cycle } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).select("clientId name cycleNumber");

  response.status(200).json({
    status: "ok",
    player: {
      clientId: player.clientId,
      name: player.name,
      cycleNumber: player.cycleNumber,
    },
  });
}

export async function getPlayerAttempts(request, response) {
  const clientId = typeof request.params.clientId === "string"
    ? request.params.clientId.trim()
    : "";

  if (clientId.length < 8 || clientId.length > 80) {
    return response.status(400).json({
      status: "error",
      message: "A valid player ID is required.",
    });
  }

  const player = await Player.findOne({ clientId }).select("clientId").lean();
  if (!player) {
    return response.status(404).json({
      status: "error",
      message: "Player registration was not found.",
    });
  }

  const attempts = await PuzzleAttempt.find({ playerId: clientId })
    .select("attemptId challengeId difficulty completionTimeSeconds moves createdAt")
    .sort({ createdAt: -1 })
    .lean();

  response.json({
    status: "ok",
    entries: attempts.map((attempt) => ({
      id: attempt.attemptId,
      challengeId: attempt.challengeId,
      difficulty: attempt.difficulty,
      completionTimeSeconds: attempt.completionTimeSeconds,
      moves: attempt.moves,
      completedAt: attempt.createdAt,
    })),
  });
}
