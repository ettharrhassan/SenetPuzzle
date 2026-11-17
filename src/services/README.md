# SENET API client

The frontend sends player and result data to the Express API at
`http://localhost:5000/api` by default. Set `VITE_API_URL` in a local
Vite environment file only if the API uses another address.

- `POST /players` stores the entered name and cycle number.
- `POST /leaderboard/attempts` stores a completed puzzle result.
- `GET /leaderboard?challengeId=...&difficulty=...&sortBy=time|moves`
  returns one personal best per registered player.

The API writes to MongoDB only when the database connection is active. It does
not seed sample players or fabricated leaderboard scores.
