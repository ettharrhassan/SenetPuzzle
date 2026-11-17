import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import connectToDatabase from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import healthRoutes from "./routes/healthRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const databaseRetryDelayMs = 15000;
let databaseRetryTimer = null;
let shuttingDown = false;

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "10kb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api/health", healthRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.info(`SENET API listening on port ${port}.`);

  if (!process.env.MONGODB_URI) {
    console.info("MONGODB_URI is not configured; starting without a database connection.");
    return;
  }

  void connectToDatabaseWithRetry();
});

function scheduleDatabaseRetry() {
  if (shuttingDown || databaseRetryTimer) return;
  databaseRetryTimer = setTimeout(() => {
    databaseRetryTimer = null;
    void connectToDatabaseWithRetry();
  }, databaseRetryDelayMs);
}

async function connectToDatabaseWithRetry() {
  try {
    await connectToDatabase();
    if (databaseRetryTimer) clearTimeout(databaseRetryTimer);
    databaseRetryTimer = null;
    console.info("MongoDB connection established.");
  } catch (error) {
    if (
      error.code === 18 ||
      error.code === 8000 ||
      error.codeName === "AuthenticationFailed" ||
      (error.codeName === "AtlasError" && /bad auth|authentication failed/i.test(error.message))
    ) {
      console.error("MongoDB authentication failed. Check the database username and password in backend/.env.");
    } else if (error.code === 13 || error.codeName === "Unauthorized") {
      console.error("MongoDB rejected the database user's permissions (code 13). Check the Atlas database user role.");
    } else {
      const code = Number.isInteger(error.code) ? `, code ${error.code}` : "";
      const networkCodes = [...(error.reason?.servers?.values?.() ?? [])]
        .map((server) => server.error?.cause?.code ?? server.error?.code)
        .filter(Boolean);
      const networkDetail = networkCodes.length > 0
        ? `; network detail: ${[...new Set(networkCodes)].join(", ")}`
        : "";
      console.error(
        `MongoDB connection failed (${error.name}${code}${networkDetail}). Check Atlas Network Access and cluster status. Retrying in ${databaseRetryDelayMs / 1000} seconds.`,
      );
    }
    scheduleDatabaseRetry();
  }
}

mongoose.connection.on("disconnected", scheduleDatabaseRetry);

async function shutDown(signal) {
  shuttingDown = true;
  if (databaseRetryTimer) clearTimeout(databaseRetryTimer);
  console.info(`${signal} received. Shutting down the SENET API.`);

  server.close(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(0);
    } catch (error) {
      console.error(`MongoDB disconnection failed (${error.name}).`);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));

export default app;
