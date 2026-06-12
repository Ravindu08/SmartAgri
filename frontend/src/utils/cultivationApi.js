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

export const listCultivations = (userId) =>
  req("GET", `/cultivation/${encodeURIComponent(userId)}`);

export const updateTask = (userId, sessionId, taskId, status) =>
  req("PUT",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/task/${encodeURIComponent(taskId)}`,
    { status },
  );

export const abandonCultivation = (userId, sessionId) =>
  req("DELETE",
    `/cultivation/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`,
  );
