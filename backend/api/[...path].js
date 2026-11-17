import app from "../app.js";
import { connectToDatabase } from "../config/db.js";

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return app(request, response);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    const database = process.env.MONGODB_URI?.trim()
      ? "disconnected"
      : "not-configured";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`MongoDB connection unavailable (${errorName}).`);

    return response.status(503).json({
      status: "error",
      database,
      message: database === "not-configured"
        ? "The database is not configured."
        : "The database is temporarily unavailable.",
    });
  }

  return app(request, response);
}
