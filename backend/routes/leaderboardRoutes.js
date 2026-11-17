import { Router } from "express";
import {
  getLeaderboard,
  saveAttempt,
} from "../controllers/leaderboardController.js";
import asyncHandler from "../utils/asyncHandler.js";
import requireDatabase from "../middleware/requireDatabase.js";

const router = Router();
router.get("/", requireDatabase, asyncHandler(getLeaderboard));
router.post("/attempts", requireDatabase, asyncHandler(saveAttempt));

export default router;
