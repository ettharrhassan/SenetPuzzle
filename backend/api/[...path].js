import app from "../app.js";
import { connectToDatabase } from "../config/db.js";

export default async function handler(request, response) {
  if (request.method === "OPTIONS") return app(request, response);
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("MongoDB connection unavailable.", {
      name: error.name,
      code: error.code,
      uriConfigured: Boolean(process.env.MONGODB_URI?.trim()),
    });
    return response.status(503).json({
      status: "error",
      database: process.env.MONGODB_URI?.trim() ? "disconnected" : "not-configured",
      message: process.env.MONGODB_URI?.trim()
        ? "The database is temporarily unavailable."
        : "The database is not configured.",
    });
  }
  return app(request, response);
}
