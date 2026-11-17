# SENET backend

This Express API is kept in its own folder next to the React/Vite frontend.

## Run locally

1. Copy `.env.example` to `.env` inside this folder.
2. Add your Atlas connection string to `MONGODB_URI` in `.env`. Keep `.env` private; it is ignored by Git.
3. From this folder, run `npm install` once, then `npm run dev`.
4. Open `http://localhost:5000/api/health` to check the API.

The API starts without MongoDB when `MONGODB_URI` is absent. Its health response says `database: "not-configured"`; it never reports a successful database connection unless Mongoose is actually connected.

## Player and leaderboard endpoints

- `POST /api/players` saves the entered name and cycle number in MongoDB.
- `POST /api/leaderboard/attempts` records a completed puzzle. The server uses
  the registered player profile rather than trusting a name sent with a score.
- `GET /api/leaderboard?challengeId=...&difficulty=pieces-50&sortBy=time`
  returns completed attempts' personal bests for that image and piece count.
  Set `sortBy=moves` to rank by fewest moves.

The leaderboard starts empty and only shows actual completed attempts. No demo
players or fabricated scores are inserted.

Uploaded puzzle files will be stored in `uploads/puzzles/`. Multer is configured for JPG, JPEG, PNG, and WebP with a configurable size limit. The upload endpoint and MongoDB image metadata model will be added in the image-management phase.

Authentic classic jigsaw piece generation is intentionally not implemented yet.