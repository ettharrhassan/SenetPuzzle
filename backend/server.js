import mongoose from "mongoose";
import app from "./app.js";
import { connectToDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;
const databaseRetryDelayMs = 15000;
let databaseRetryTimer = null;
let shuttingDown = false;

const server = app.listen(port, () => {
  console.info(`SENET API listening on port ${port}.`);

  if (!process.env.MONGODB_URI?.trim()) {
    console.info("MONGODB_URI is not configured; starting without a database connection.");
    return;
  }

  void connectToDatabaseWithRetry();
});

function scheduleDatabaseRetry() {
  if (shuttingDown || databaseRetryTimer || !process.env.MONGODB_URI?.trim()) return;
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
