import CommunityImage from "../models/CommunityImage.js";
import mongoose from "mongoose";

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

export async function listCommunityImages(_request, response) {
  const images = await CommunityImage.find().sort({ createdAt: -1 }).lean();
  response.json({ images: images.map(({ _id, name, dataUrl, createdAt }) => ({
    id: _id.toString(), name, dataUrl, createdAt,
  })) });
}

export async function addCommunityImage(request, response) {
  const file = request.file;
  if (!file || !matchesImageSignature(file.buffer, file.mimetype)) {
    return response.status(400).json({ status: "error", message: "Choose a valid JPG, PNG, or WebP image." });
  }
  const requestedName = typeof request.body?.name === "string" ? request.body.name : file.originalname;
  const name = requestedName.trim().replace(/[\\/]/g, " ").slice(0, 120) || "Group photo";
  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const image = await CommunityImage.create({ name, dataUrl });
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

