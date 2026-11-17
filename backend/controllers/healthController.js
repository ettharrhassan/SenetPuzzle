import mongoose from "mongoose";

export function getHealth(_request, response) {
  const isConfigured = Boolean(process.env.MONGODB_URI?.trim());
  const database = !isConfigured
    ? "not-configured"
    : mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected";

  response.status(200).json({
    status: "ok",
    database,
    message: "The SENET API is running.",
  });
}