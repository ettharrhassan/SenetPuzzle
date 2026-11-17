const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api")
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(API_URL + path, {
    ...options,
    ...(options.method === undefined || options.method === "GET"
      ? { cache: "no-store" }
      : {}),
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "SENET API request failed (" + response.status + ").");
  }
  return data;
}

export async function registerPlayer(player) {
  const saved = await request("/players", {
    method: "POST",
    body: JSON.stringify({ clientId: player.id, name: player.name, cycleNumber: player.cycleNumber }),
  });
  return { id: saved.player.clientId, name: saved.player.name, cycleNumber: saved.player.cycleNumber };
}

export async function getPlayerAttempts(playerId) {
  const response = await request(`/players/${encodeURIComponent(playerId)}/attempts`);
  return response.entries;
}

export async function submitAttempt(attempt) {
  await request("/leaderboard/attempts", { method: "POST", body: JSON.stringify(attempt) });
  return { configured: true };
}

export async function getLeaderboard({ challengeId, difficulty, sortBy }) {
  const params = new URLSearchParams({ challengeId, difficulty, sortBy });
  const response = await request("/leaderboard?" + params.toString());
  return { configured: true, entries: response.entries };
}
