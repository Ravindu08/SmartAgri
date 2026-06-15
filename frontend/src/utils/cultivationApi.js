// Cultivation endpoints live on the ML service (port 8000).
// Use an empty base so Vite's dev-server proxy forwards /cultivation → port 8000.
const BASE = "";

async function req(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(msg);
  }
  if (r.status === 204) return null;
  return r.json();
}

export const startCultivation = (userId, crop, plantingDate, district, cropId, farmId) =>
  req("POST", "/cultivation", {
    user_id:       userId,
    crop,
    planting_date: plantingDate,
    district:      district || null,
    crop_id:       cropId  || null,
    farm_id:       farmId  || null,
  });

const _listCache = { userId: null, data: null, ts: 0 };
const CACHE_MS = 5000;

export async function listCultivations(userId) {
  const now = Date.now();
  if (_listCache.userId === userId && now - _listCache.ts < CACHE_MS) {
    return _listCache.data;
  }
  const data = await req("GET", `/cultivation/${encodeURIComponent(userId)}`);
  _listCache.userId = userId;
  _listCache.data   = data;
  _listCache.ts     = now;
  return data;
}

export const updateTask = (userId, sessionId, taskId, status) =>
  req("PUT",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/task/${encodeURIComponent(taskId)}`,
    { status },
  );

export const abandonCultivation = (userId, sessionId) =>
  req("DELETE",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`,
  );
