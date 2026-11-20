const configuredApiUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://senet-puzzle-backend.vercel.app/api")
).replace(/\/+$/, "");
const API_URL = `${configuredApiUrl.replace(/(?:\/api)+$/i, "")}/api`;

async function imageRequest(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_URL}/images${path}`, {
    ...options,
    cache: "no-store",
    headers,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Image request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getCommunityImages() {
  const data = await imageRequest("");
  return data.images;
}

export async function uploadCommunityImage(name, dataUrl) {
  const data = await imageRequest("", {
    method: "POST",
    body: JSON.stringify({ name, dataUrl }),
  });
  return data.image;
}

export async function deleteCommunityImage(id, adminToken) {
  return imageRequest(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(API_URL + path, {
    ...options,
    ...(options.method === undefined || options.method === "GET"
      ? { cache: "no-store" }
      : {}),
    headers,
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
