// Cultivation endpoints live on the ML service (port 8001).
// Use an empty base so Vite's dev-server proxy forwards /cultivation → port 8001.
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

export async function updateTask(userId, sessionId, taskId, status, photo) {
  const body = { status };
  if (photo !== undefined) body.photo = photo; // data URI, or null to clear
  const { session_status: sessionStatus, ...task } = await req("PUT",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/task/${encodeURIComponent(taskId)}`,
    body,
  );
  _listCache.ts = 0; // bust cache so next listCultivations call fetches fresh data
  // sessionStatus flips to "completed" on the call that closes the last task.
  return { task, sessionStatus };
}

export const abandonCultivation = (userId, sessionId) =>
  req("DELETE",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`,
  );

// A session belongs to exactly one crop row, linked by crop_id. Matching on the
// crop name alone would hand a new Chilli on farm 2 — or a second Chilli season
// on farm 1 — the progress and "Completed" status of an older Chilli session.
// Sessions created before crop_id existed have no link, so those fall back to
// name + planting date (+ farm when both sides have one): a re-planted crop
// always has a different planting date.
const _day = (d) => (d ? String(d).slice(0, 10) : "");

export function sessionBelongsToCrop(session, crop) {
  if (!session || !crop) return false;
  if (session.crop_id) return crop.id != null && session.crop_id === String(crop.id);
  if (session.farm_id && crop.farm_id && session.farm_id !== String(crop.farm_id)) return false;
  return (
    (session.crop || "").toLowerCase() === (crop.crop_name || "").toLowerCase() &&
    _day(session.planting_date) === _day(crop.planting_date)
  );
}

export function findSessionForCrop(sessions, crop, statuses) {
  return (sessions || []).find(s =>
    (!statuses || statuses.includes(s.status)) && sessionBelongsToCrop(s, crop)
  ) || null;
}
