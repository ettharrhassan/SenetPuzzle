import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import multer from "multer";

const uploadDirectory = resolve(process.cwd(), "uploads", "puzzles");
const allowedTypes = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);
const sizeLimitMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

function validateImage(_request, file, callback) {
  const extension = extname(file.originalname).toLowerCase();
  const validExtensions = allowedTypes.get(file.mimetype);

  if (!validExtensions?.has(extension)) {
    const error = new Error("Only JPG, JPEG, PNG, and WebP images are allowed.");
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
}

/** Local image storage for the upload route that will be added in Phase 3. */
const puzzleImageUpload = multer({
  storage,
  fileFilter: validateImage,
  limits: { fileSize: sizeLimitMb * 1024 * 1024, files: 1 },
});

export default puzzleImageUpload;