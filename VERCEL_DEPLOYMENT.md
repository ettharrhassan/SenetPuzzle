# Deploy SENET to Vercel

SENET keeps its Vite frontend and Express API in separate folders, so deploy
them as two Vercel projects connected to the same Git repository.

## Frontend project

1. Import the repository into Vercel and set **Root Directory** to `.`.
2. Select the Vite framework preset. The build command is `npm run build` and
   the output directory is `dist`.
3. Set the frontend project's **Production** `VITE_API_URL` to
   `https://senet-puzzle-backend.vercel.app/api`. The frontend defaults to
   this URL if the variable is unset; the client normalizes it to exactly one
   `/api` suffix. Set the same value for Preview if previews should use the
   production backend.
4. Deploy the frontend. `vercel.json` provides the SPA rewrite needed for
   React Router routes such as `/profile` and `/leaderboard`.

## Backend project

1. Create another Vercel project from the same repository and set **Root
   Directory** to `backend`.
2. Vercel detects the Express `server.js` entry point and the backend's own
   `package.json` dependencies.
3. Add these environment variables in the backend project's Settings, for
   Production (and Preview if you use previews):
   - `MONGODB_URI`: the Atlas connection URI. Keep it secret; do not add a
     `VITE_` prefix.
   - `CLIENT_ORIGIN`: the exact deployed frontend origin, without a trailing
     slash (for example `https://your-app.vercel.app`).
   - `MAX_FILE_SIZE_MB`: `10`.
4. Deploy the backend and redeploy the frontend after changing
   `VITE_API_URL`; Vite embeds this value at build time.

For local development, the frontend defaults to
`http://localhost:5000/api`; copy `.env.example` to `.env` only if you need to
override that value. Never commit `.env` files.

## Before enabling image uploads in production

Vercel Functions do not provide persistent local storage. Files written under
`backend/uploads` will not be durable between invocations, so keep puzzle
uploads local during development and use Cloudinary or another object storage
service before enabling production uploads.

Atlas also needs to allow connections from the deployed backend. Vercel uses
dynamic egress IPs by default; use a supported static egress/private network
option or choose a hosting plan with stable egress before changing Atlas's IP
access list. Do not add `0.0.0.0/0` casually because it permits connection
attempts from any public IP (database credentials are still required).
