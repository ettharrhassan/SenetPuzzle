import { Router } from "express";
import {
  addCommunityImage,
  deleteCommunityImage,
  listCommunityImages,
} from "../controllers/communityImageController.js";
import asyncHandler from "../utils/asyncHandler.js";
import requireDatabase from "../middleware/requireDatabase.js";

const router = Router();
router.get("/", requireDatabase, asyncHandler(listCommunityImages));
router.post("/", requireDatabase, asyncHandler(addCommunityImage));
router.delete("/:imageId", requireDatabase, asyncHandler(deleteCommunityImage));

export default router;
