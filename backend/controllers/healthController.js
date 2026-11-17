import mongoose from "mongoose";

export function getHealth(_request, response) {
  const database = process.env.MONGODB_URI
    ? mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
    : "not-configured";

  response.status(200).json({
    status: "ok",
    database,
    message: "The SENET API is running.",
  });
}