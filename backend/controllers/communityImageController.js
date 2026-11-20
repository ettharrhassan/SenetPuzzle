import CommunityImage from "../models/CommunityImage.js";
import mongoose from "mongoose";

export async function listCommunityImages(_request, response) {
  const images = await CommunityImage.find().sort({ createdAt: -1 }).lean();
  response.json({ images: images.map(({ _id, name, dataUrl, createdAt }) => ({
    id: _id.toString(), name, dataUrl, createdAt,
  })) });
}

export async function addCommunityImage(request, response) {
  const { name, dataUrl } = request.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof dataUrl !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 1_800_000) {
    return response.status(400).json({ status: "error", message: "Upload a JPG, PNG, or WebP image under 1.3 MB." });
  }
  const image = await CommunityImage.create({ name: name.trim().slice(0, 120), dataUrl });
  return response.status(201).json({ image: {
    id: image._id.toString(), name: image.name, dataUrl: image.dataUrl, createdAt: image.createdAt,
  } });
}

export async function deleteCommunityImage(request, response) {
  const adminToken = process.env.IMAGE_ADMIN_TOKEN?.trim();
  if (!adminToken || request.get("authorization") !== `Bearer ${adminToken}`) {
    return response.status(403).json({ status: "error", message: "Image administrator access is required." });
  }
  if (!mongoose.isValidObjectId(request.params.imageId)) {
    return response.status(400).json({ status: "error", message: "Invalid image identifier." });
  }
  const image = await CommunityImage.findByIdAndDelete(request.params.imageId);
  if (!image) return response.status(404).json({ status: "error", message: "Image not found." });
  return response.status(204).end();
}
