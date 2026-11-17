import { Router } from "express";
import {
  getPlayerAttempts,
  registerPlayer,
} from "../controllers/playerController.js";
import asyncHandler from "../utils/asyncHandler.js";
import requireDatabase from "../middleware/requireDatabase.js";

const router = Router();
router.get("/:clientId/attempts", requireDatabase, asyncHandler(getPlayerAttempts));
router.post("/", requireDatabase, asyncHandler(registerPlayer));

export default router;
