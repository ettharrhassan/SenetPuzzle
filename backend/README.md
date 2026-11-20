# SENET backend

This Express API is kept in its own folder next to the React/Vite frontend.

## Run locally

1. Copy `.env.example` to `.env` inside this folder.
2. Add your Atlas connection string to `MONGODB_URI` in `.env`. Keep `.env` private; it is ignored by Git.
3. From this folder, run `npm install` once, then `npm run dev`.
4. Open `http://localhost:5000/api/health` to check the API.

The API starts without MongoDB when `MONGODB_URI` is absent. Its health response says `database: "not-configured"`; it never reports a successful database connection unless Mongoose is actually connected.

`npm start` runs the same local server without file watching. Local startup
retries a configured MongoDB connection after transient failures and closes the
HTTP server and database connection on shutdown.

## Player and leaderboard endpoints

- `POST /api/players` saves the entered name and cycle number in MongoDB.
- `POST /api/leaderboard/attempts` records a completed puzzle. The server uses
  the registered player profile rather than trusting a name sent with a score.
- `GET /api/leaderboard?challengeId=...&difficulty=pieces-15&sortBy=time`
  returns completed attempts' personal bests for that image and piece count.
  Set `sortBy=moves` to rank by fewest moves.

The leaderboard starts empty and only shows actual completed attempts. No demo
players or fabricated scores are inserted.

`GET /api/images` lists shared group photos and `POST /api/images` adds one.
Images are resized in the browser and stored in MongoDB as JPEG data, so they
remain available across devices and Vercel invocations. Uploads are limited to
about 1.3 MB after resizing. `DELETE /api/images/:imageId` requires the
`IMAGE_ADMIN_TOKEN` environment variable and a matching Bearer token.

Vercel detects `server.js` as the Express entry point and sends all API paths
through the Express router. Keep the backend project's Root Directory set to
`backend`. Configure `MONGODB_URI`, `CLIENT_ORIGIN`, and `IMAGE_ADMIN_TOKEN`
in the Vercel project's environment variables. A failed or missing database
connection returns HTTP 503 without exposing connection details.

MongoDB must be configured for the shared image gallery to work. Keep
`IMAGE_ADMIN_TOKEN` private and configure it on the backend host to enable
authorized deletion.

Authentic classic jigsaw piece generation is intentionally not implemented yet.
