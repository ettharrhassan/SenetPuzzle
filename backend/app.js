import "dotenv/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import cors from "cors";
import express from "express";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import healthRoutes from "./routes/healthRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

const app = express();
const backendDirectory = fileURLToPath(new URL(".", import.meta.url));
const clientOrigin = process.env.CLIENT_ORIGIN || "https://senetpuzzle.vercel.app/" ||"http://localhost:5173";

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
app.use(express.json({ limit: "10kb" }));

if (process.env.VERCEL !== "1") {
  app.use("/uploads", express.static(resolve(backendDirectory, "uploads")));
}

app.use("/api/health", healthRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
