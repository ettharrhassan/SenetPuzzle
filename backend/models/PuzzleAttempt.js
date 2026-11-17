import mongoose from "mongoose";

const puzzleAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    playerId: { type: String, required: true, index: true },
    playerName: { type: String, required: true, trim: true, maxlength: 50 },
    cycleNumber: { type: Number, required: true, min: 1, max: 999 },
    challengeId: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, enum: ["pieces-50", "pieces-75", "pieces-100"] },
    completionTimeSeconds: { type: Number, required: true, min: 0, validate: Number.isInteger },
    moves: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { timestamps: true },
);

puzzleAttemptSchema.index({ challengeId: 1, difficulty: 1, playerId: 1 });

export default mongoose.model("PuzzleAttempt", puzzleAttemptSchema);
