import { extname } from "node:path";
import multer from "multer";

const allowedTypes = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);
const configuredSizeLimitMb = Number(process.env.MAX_FILE_SIZE_MB) || 3;
// Leave room below Vercel's request-body ceiling; the browser sends resized images.
const sizeLimitMb = Math.min(configuredSizeLimitMb, 3);

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

const puzzleImageUpload = multer({
  // Files are persisted in MongoDB by the controller. Do not write to Vercel's ephemeral disk.
  storage: multer.memoryStorage(),
  fileFilter: validateImage,
  limits: { fileSize: sizeLimitMb * 1024 * 1024, files: 1 },
});

export default puzzleImageUpload;
