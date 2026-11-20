import { Router } from "express";
import {
  addCommunityImage,
  deleteCommunityImage,
  listCommunityImages,
} from "../controllers/communityImageController.js";
import asyncHandler from "../utils/asyncHandler.js";
import requireDatabase from "../middleware/requireDatabase.js";
import puzzleImageUpload from "../config/multer.js";

const router = Router();
router.get("/", requireDatabase, asyncHandler(listCommunityImages));
router.post("/", requireDatabase, puzzleImageUpload.single("image"), asyncHandler(addCommunityImage));
router.delete("/:imageId", requireDatabase, asyncHandler(deleteCommunityImage));

export default router;
