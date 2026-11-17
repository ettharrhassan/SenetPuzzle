# SENET API client

The frontend sends player and result data to the Express API. It uses
`http://localhost:5000/api` in local development and
`https://senet-puzzle-backend.vercel.app/api` in production by default. Set
`VITE_API_URL` only when the API uses another address. The client normalizes
the base URL to end with exactly one `/api`.

- `GET /health` checks API and database connectivity.
- `POST /players` stores the entered name and cycle number.
- `GET /players/:clientId/attempts` returns the player's attempts.
- `POST /leaderboard/attempts` stores a completed puzzle result.
- `GET /leaderboard?challengeId=...&difficulty=...&sortBy=time|moves`
  returns one personal best per registered player.

The API writes to MongoDB only when the database connection is active. It does
not seed sample players or fabricated leaderboard scores.
