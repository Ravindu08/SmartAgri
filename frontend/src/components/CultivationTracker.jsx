import { useState, useEffect, useCallback, useRef } from "react";
import { ML_BASE_URL } from "../services/api";
import * as API from "../utils/cultivationApi";
import { getFarms, getFarm } from "../services/farmService";
import { createCrop, deleteCrop } from "../services/cropService";
import { useApp } from "../context/AppContext";
import { getCropLabel, getSoilLabel } from "../data/cropData";
import { STAGE_NAME_LABELS } from "../data/translations";
import CustomSelect from "./CustomSelect";
// Cultivation dashboard/calendar/modal styles live in CropGuidance.css. Import
// directly here (not just from the CropGuidance page) so the tracker renders
// fully styled even when a user lands on /landowner/cultivations first —
// Vite only fetches a lazy page's CSS chunk once that page has been visited.
import "../styles/CropGuidance.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const ACT_META = {
  prepare:   { icon: "🚜", cls: "act-prepare"   },
  plant:     { icon: "🌱", cls: "act-plant"     },
  water:     { icon: "💧", cls: "act-water"     },
  fertilize: { icon: "🌿", cls: "act-fertilize" },
  weed:      { icon: "✂️", cls: "act-weed"      },
  train:     { icon: "🪵", cls: "act-train"     },
  monitor:   { icon: "🔍", cls: "act-monitor"   },
  spray:     { icon: "💦", cls: "act-spray"     },
  harvest:   { icon: "🧺", cls: "act-harvest"   },
  thin:      { icon: "🌾", cls: "act-thin"      },
};

const DAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"];

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala",
  "Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
  "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d) {
  // Use local date parts — toISOString() shifts to UTC and gives wrong date in non-UTC zones
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function effectiveStatus(task) {
  if (task.status === "done" || task.status === "skipped") return task.status;
  if (task.scheduled_date < todayStr()) return "overdue";
  return "pending";
}

function getWeekDays(refDate) {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return day;
  });
}

function sessionProgress(session) {
  const tasks = Object.values(session.tasks);
  if (tasks.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = tasks.filter(t => t.status === "done").length;
  return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100) };
}

function daysSince(plantingDate) {
  if (!plantingDate) return null;
  return Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86400000);
}

function fmtDate(dateStr) {
  // Parse as local midnight to avoid UTC shift
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, t, onClose, onUpdate }) {
  const meta   = ACT_META[task.type] || { icon: "📋" };
  const status = effectiveStatus(task);

  return (
    <div className="cult-modal-overlay" onClick={onClose}>
      <div className="cult-modal" onClick={e => e.stopPropagation()}>
        <button className="cult-modal-close" onClick={onClose}>✕</button>
        <div className="cult-modal-header">
          <span className="cult-modal-icon">{meta.icon}</span>
          <div>
            <div className="cult-modal-stage">{task.stage_name}</div>
            <div className="cult-modal-title">{task.title}</div>
          </div>
        </div>
        <div className="cult-modal-meta">
          <span>{t.scheduledFor}: <strong>{fmtDate(task.scheduled_date)}</strong></span>
          <span className={`cult-status-badge status-${status}`}>
            {t[`taskStatus_${status}`] || status}
          </span>
        </div>
        {task.description && <p className="cult-modal-desc">{task.description}</p>}
        {task.why && (
          <div className="cult-modal-why">
            <span>💡</span> {task.why}
          </div>
        )}
        <div className="cult-modal-actions">
          {status !== "done" && (
            <button
              className="cult-btn cult-btn-done"
              onClick={() => onUpdate(task.id, "done")}
            >
              ✓ {t.markDone}
            </button>
          )}
          {status !== "skipped" && (
            <button
              className="cult-btn cult-btn-skip"
              onClick={() => onUpdate(task.id, "skipped")}
            >
              — {t.markSkipped}
            </button>
          )}
          {(status === "done" || status === "skipped") && (
            <button
              className="cult-btn cult-btn-reset"
              onClick={() => onUpdate(task.id, "pending")}
            >
              ↩ {t.resetTask}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StageProgressBar ──────────────────────────────────────────────────────────
function StageProgressBar({ stages, daysElapsed, t, lang }) {
  if (!stages || stages.length === 0) return null;
  const allDays = stages.flatMap(s => [s.day_start, s.day_end]);
  const minDay  = Math.min(...allDays);
  const maxDay  = Math.max(...allDays);
  const span    = maxDay - minDay || 1;

  const markerPct = daysElapsed !== null
    ? Math.min(100, Math.max(0, ((daysElapsed - minDay) / span) * 100))
    : null;

  const currentStage = daysElapsed !== null
    ? stages.find(s => daysElapsed >= s.day_start && daysElapsed <= s.day_end)
    : null;

  return (
    <div className="cult-stage-wrap">
      {currentStage && (
        <div className="cult-current-stage-label">
          {currentStage.icon} {t.currentStage}: <strong>{STAGE_NAME_LABELS[lang]?.[currentStage.name] || currentStage.name}</strong>
          {" "}({t.stageDay} {currentStage.day_start}–{currentStage.day_end})
        </div>
      )}
      <div className="cult-stage-bar-container" title={t.stageProgress}>
        {stages.map((stage) => {
          const left  = ((stage.day_start - minDay) / span) * 100;
          const width = Math.max(2, ((stage.day_end - stage.day_start) / span) * 100);
          const isCur = currentStage?.id === stage.id;
          return (
            <div
              key={stage.id}
              className={`cult-stage-seg${isCur ? " current" : ""}`}
              style={{ left: `${left}%`, width: `${width}%`, background: stage.color || "#4caf50" }}
              title={`${stage.name}: ${t.stageDay} ${stage.day_start}–${stage.day_end}`}
            />
          );
        })}
        {markerPct !== null && (
          <div className="cult-stage-marker" style={{ left: `${markerPct}%` }} />
        )}
      </div>
      <div className="cult-stage-icon-row">
        {stages.map((stage) => {
          const left = ((stage.day_start - minDay) / span) * 100;
          const isCur = currentStage?.id === stage.id;
          return (
            <span
              key={stage.id}
              className={`cult-stage-icon-label${isCur ? " current" : ""}`}
              style={{ left: `${left}%` }}
              title={stage.name}
            >
              {stage.icon}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── WarningPanel ──────────────────────────────────────────────────────────────
function WarningPanel({ session, t }) {
  const tasks    = Object.values(session.tasks);
  const today    = todayStr();
  const in3days  = toDateStr(new Date(Date.now() + 3 * 86400000));

  const overdue  = tasks.filter(t =>
    t.status !== "done" && t.status !== "skipped" && t.scheduled_date < today
  );
  const dueSoon  = tasks.filter(t =>
    t.status !== "done" && t.status !== "skipped" &&
    t.scheduled_date >= today && t.scheduled_date <= in3days
  );

  if (overdue.length === 0 && dueSoon.length === 0) return null;

  return (
    <div className="cult-warning-panel">
      {overdue.length > 0 && (
        <div className="cult-warn-group cult-warn-overdue">
          <div className="cult-warn-label">⚠ {t.overdueWarning} ({overdue.length})</div>
          <ul>
            {overdue.map(task => (
              <li key={task.id}>
                {ACT_META[task.type]?.icon || "📋"} {task.title}
                <span className="cult-warn-date">{fmtDate(task.scheduled_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="cult-warn-group cult-warn-due">
          <div className="cult-warn-label">📅 {t.dueSoon} ({dueSoon.length})</div>
          <ul>
            {dueSoon.map(task => (
              <li key={task.id}>
                {ACT_META[task.type]?.icon || "📋"} {task.title}
                <span className="cult-warn-date">{fmtDate(task.scheduled_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── WeeklyCalendar ────────────────────────────────────────────────────────────
function WeeklyCalendar({ session, t, onTaskClick }) {
  const [offset, setOffset] = useState(0);

  const refDate  = new Date(Date.now() + offset * 7 * 86400000);
  const weekDays = getWeekDays(refDate);
  const today    = todayStr();

  const tasksByDay = {};
  Object.values(session.tasks).forEach(task => {
    const d = task.scheduled_date;
    if (!tasksByDay[d]) tasksByDay[d] = [];
    tasksByDay[d].push(task);
  });

  const weekStart = toDateStr(weekDays[0]);
  const weekEnd   = toDateStr(weekDays[6]);

  return (
    <div className="cult-calendar">
      <div className="cult-cal-nav">
        <button className="cult-cal-nav-btn" onClick={() => setOffset(o => o - 1)}>‹</button>
        <span className="cult-cal-range">
          {fmtDate(weekStart)} – {fmtDate(weekEnd)}
        </span>
        <button className="cult-cal-nav-btn" onClick={() => setOffset(o => o + 1)}>›</button>
        {offset !== 0 && (
          <button className="cult-cal-today-btn" onClick={() => setOffset(0)}>
            {t.thisWeek}
          </button>
        )}
      </div>
      <div className="cult-week-grid">
        {weekDays.map((day, i) => {
          const dateStr  = toDateStr(day);
          const isToday  = dateStr === today;
          const dayTasks = (tasksByDay[dateStr] || []).sort((a, b) => a.day - b.day);
          return (
            <div key={i} className={`cult-week-col${isToday ? " today" : ""}`}>
              <div className="cult-day-header">
                <div className="cult-day-name">{t[DAY_KEYS[i]] || DAY_NAMES_EN[i]}</div>
                <div className={`cult-day-num${isToday ? " today" : ""}`}>{day.getDate()}</div>
              </div>
              <div className="cult-day-tasks">
                {dayTasks.map(task => {
                  const st   = effectiveStatus(task);
                  const meta = ACT_META[task.type] || { icon: "📋" };
                  return (
                    <button
                      key={task.id}
                      className={`cult-task-chip status-${st}`}
                      onClick={() => onTaskClick(task)}
                      title={`${task.title} — ${t[`taskStatus_${st}`] || st}`}
                    >
                      <span className="cult-chip-icon">{meta.icon}</span>
                      {st === "done"    && <span className="cult-chip-badge cult-chip-badge--done">✓</span>}
                      {st === "overdue" && <span className="cult-chip-badge cult-chip-badge--overdue">!</span>}
                      {st === "skipped" && <span className="cult-chip-badge cult-chip-badge--skipped">×</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cult-chip-legend">
        {[
          { s: "pending",  badge: null,  icon: "📋" },
          { s: "overdue",  badge: "!",   icon: "📋" },
          { s: "done",     badge: "✓",   icon: "📋" },
          { s: "skipped",  badge: "×",   icon: "📋" },
        ].map(({ s, badge }) => (
          <div key={s} className="cult-legend-item">
            <span className={`cult-legend-chip status-${s}`}>
              {badge && <span className={`cult-chip-badge cult-chip-badge--${s}`}>{badge}</span>}
            </span>
            <span className="cult-legend-label">{t[`taskStatus_${s}`] || s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CultivationDashboard ──────────────────────────────────────────────────────
function CultivationDashboard({ session, guidanceData, t, onBack, onUpdateTask, onAbandon, lang }) {
  const [activeTask, setActiveTask] = useState(null);
  const elapsed  = daysSince(session.planting_date);
  const progress = sessionProgress(session);
  const stages   = guidanceData?.stages || [];

  async function handleUpdate(taskId, status) {
    await onUpdateTask(session.id, taskId, status);
    setActiveTask(null);
  }

  return (
    <div className="cult-dashboard">
      {activeTask && (
        <TaskModal
          task={activeTask}
          t={t}
          onClose={() => setActiveTask(null)}
          onUpdate={handleUpdate}
        />
      )}

      <div className="cult-dash-header">
        <button className="guidance-back-btn" onClick={onBack}>
          ← {t.backToList}
        </button>
        <div className="cult-dash-title-row">
          <div>
            <h2 className="cult-dash-crop">{getCropLabel(session.crop, lang)}</h2>
            <div className="cult-dash-meta">
              📅 {t.plantingDate}: <strong>{fmtDate(session.planting_date)}</strong>
              {elapsed !== null && (
                <> · {t.stageDay} <strong>{elapsed}</strong></>
              )}
              {session.district && <> · 📍 {session.district}</>}
            </div>
          </div>
          <button
            className="cult-btn cult-btn-abandon"
            onClick={() => {
              if (window.confirm(t.confirmAbandon)) onAbandon(session.id);
            }}
          >
            {t.abandonSession}
          </button>
        </div>
        <div className="cult-overall-progress">
          <div className="cult-progress-bar">
            <div className="cult-progress-fill" style={{ width: `${progress.pct}%` }} />
          </div>
          <span>{progress.done}/{progress.total} {t.tasksComplete} · {progress.pct}%</span>
        </div>
      </div>

      {stages.length > 0 && (
        <div className="cult-section">
          <div className="cult-section-title">📊 {t.stageProgress}</div>
          <StageProgressBar stages={stages} daysElapsed={elapsed} t={t} lang={lang} />
        </div>
      )}

      <WarningPanel session={session} t={t} />

      <div className="cult-section">
        <div className="cult-section-title">📆 {t.weeklyCalendar}</div>
        <WeeklyCalendar session={session} t={t} onTaskClick={setActiveTask} />
      </div>
    </div>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────
function SessionCard({ session, t, onOpen, onAbandon, lang }) {
  const progress = sessionProgress(session);
  const elapsed  = daysSince(session.planting_date);
  const tasks    = Object.values(session.tasks);
  const overdue  = tasks.filter(tk =>
    tk.status !== "done" && tk.status !== "skipped" && tk.scheduled_date < todayStr()
  ).length;

  return (
    <div className={`cult-session-card${session.status === "abandoned" ? " abandoned" : ""}`}>
      <div className="cult-card-top">
        <div>
          <div className="cult-card-crop">{getCropLabel(session.crop, lang)}</div>
          <div className="cult-card-sub">
            📅 {fmtDate(session.planting_date)}
            {elapsed !== null && <> · {t.stageDay} {elapsed}</>}
            {session.district && <> · 📍 {session.district}</>}
          </div>
        </div>
        <span className={`cult-status-badge status-${session.status}`}>
          {t[`sessionStatus_${session.status}`] || session.status}
        </span>
      </div>
      <div className="cult-progress-bar" title={`${progress.pct}%`}>
        <div className="cult-progress-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <div className="cult-card-footer">
        <span>{progress.done}/{progress.total} {t.tasksComplete}</span>
        {session.status === "active" && overdue > 0 && (
          <span className="cult-overdue-badge">{overdue} {t.overdueWarning}</span>
        )}
        <div className="cult-card-actions">
          {session.status === "active" && (
            <>
              <button className="cult-btn cult-btn-open" onClick={() => onOpen(session)}>
                {t.openSession}
              </button>
              <button
                className="cult-btn cult-btn-abandon"
                onClick={() => {
                  if (window.confirm(t.confirmAbandon)) onAbandon(session.id);
                }}
              >
                {t.abandonSession}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MyCultivationsList ────────────────────────────────────────────────────────
function MyCultivationsList({ sessions, loading, error, t, onStart, onOpen, onAbandon, lang }) {
  const active = sessions.filter(s => s.status === "active");

  if (loading) return <div className="guidance-empty"><p>{t.guidanceLoading}</p></div>;

  return (
    <div className="cult-list">
      <div className="cult-list-header">
        <div>
          <h2>{t.myCultivations}</h2>
          <p>{t.myCultivationsSub}</p>
        </div>
        <button className="guidance-generate-btn" style={{ width: "auto", marginTop: 0 }} onClick={onStart}>
          🌱 {t.startCultivation}
        </button>
      </div>
      {error && <div className="cult-error">⚠ {error}</div>}
      {active.length === 0 && !error && (
        <div className="cult-empty">{t.noCultivations}</div>
      )}
      {active.map(s => (
        <SessionCard key={s.id} session={s} t={t} onOpen={onOpen} onAbandon={onAbandon} lang={lang} />
      ))}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// ── StartCultivationForm ──────────────────────────────────────────────────────
function StartCultivationForm({ t, userId, onBack, onCreate, defaultCrop, existingCropData }) {
  const [cropList,         setCropList]         = useState([]);
  const [farms,            setFarms]            = useState([]);
  const [crop,             setCrop]             = useState(defaultCrop || "");
  const [date,             setDate]             = useState(todayStr());
  const [farmId,           setFarmId]           = useState(existingCropData?.farm_id ? String(existingCropData.farm_id) : "");
  const [guidanceDuration, setGuidanceDuration] = useState(120);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState("");
  const [farmDistrict,     setFarmDistrict]     = useState(null);

  useEffect(() => {
    fetch(`${ML_BASE_URL}/guidance`)
      .then(r => r.json())
      .then(d => setCropList(d.crops || []))
      .catch(() => {});
    getFarms().then(setFarms).catch(() => {});
  }, []);

  // Fix 4: fetch district for existing crop's farm upfront so it's ready at submit time
  useEffect(() => {
    if (!existingCropData?.farm_id) return;
    getFarm(String(existingCropData.farm_id))
      .then(f => setFarmDistrict(f?.district || null))
      .catch(() => setFarmDistrict(null));
  }, [existingCropData?.farm_id]);

  // Fetch crop-specific duration whenever the selected crop changes
  useEffect(() => {
    if (!crop) return;
    fetch(`${ML_BASE_URL}/guidance/${encodeURIComponent(crop)}`)
      .then(r => r.json())
      .then(d => {
        const stages = d.data?.stages || [];
        const maxDay = stages.reduce((m, s) => Math.max(m, s.day_end || 0), 0);
        setGuidanceDuration(maxDay > 0 ? maxDay : (d.data?.duration_days || 120));
      })
      .catch(() => setGuidanceDuration(120));
  }, [crop]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!crop || !date) return;
    if (!existingCropData && !farmId) return;
    setSaving(true);
    setError("");
    try {
      const resolvedFarmId = existingCropData ? String(existingCropData.farm_id || farmId) : farmId;
      const district       = existingCropData
        ? farmDistrict
        : (farms.find(f => String(f.id) === String(resolvedFarmId))?.district || null);
      const harvestDate    = addDays(date, guidanceDuration);

      let cropId = existingCropData ? String(existingCropData.id) : null;

      if (!existingCropData) {
        const newCrop = await createCrop({
          farm_id:               resolvedFarmId,
          crop_name:             crop,
          crop_type:             crop,
          category:              "General",
          growth_stage:          "Seed",
          planting_date:         date,
          expected_harvest_date: harvestDate,
          status:                "Active",
        });
        cropId = newCrop?.id ? String(newCrop.id) : null;
      }

      const session = await API.startCultivation(
        userId, crop, date, district, cropId, resolvedFarmId
      );
      onCreate(session);
    } catch (err) {
      setError(err.message || "Failed to start cultivation");
    } finally {
      setSaving(false);
    }
  }

  const farmSelectRequired = !existingCropData;

  // When crop is already known (launched from a crop card), show simplified date-only form
  if (existingCropData) {
    return (
      <form className="guidance-selector" onSubmit={handleSubmit}>
        <button type="button" className="guidance-back-btn" style={{ marginBottom: 16 }} onClick={onBack}>
          ← {t.backToList}
        </button>
        <div className="cult-start-known-crop">
          <div className="cult-start-known-icon">🌱</div>
          <div>
            <h2>{t.startCultivation}</h2>
            <p className="cult-start-known-name">{crop}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              {existingCropData.farm_name ? `📍 ${existingCropData.farm_name}` : ''}
            </p>
          </div>
        </div>
        <div className="guidance-selector-row guidance-selector-row--single">
          <div>
            <label>{t.plantingDate}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>
        {error && <div className="cult-error">{error}</div>}
        <button className="guidance-generate-btn" type="submit" disabled={!crop || !date || saving}>
          {saving ? "⏳ " + t.creating : "🌱 " + t.startCultivation}
        </button>
      </form>
    );
  }

  const selectedFarm    = farms.find(f => String(f.id) === farmId);
  const plannedForFarm  = selectedFarm?.cultivated_crops
    ? selectedFarm.cultivated_crops.split(",").map(c => c.trim()).filter(Boolean)
    : [];
  const filteredCrops   = farmId && plannedForFarm.length > 0
    ? cropList.filter(c => plannedForFarm.some(p => p.toLowerCase() === c.toLowerCase()))
    : farmId
      ? []
      : cropList;
  const noPlannedCrops  = farmId && filteredCrops.length === 0;

  return (
    <form className="guidance-selector" onSubmit={handleSubmit}>
      <button type="button" className="guidance-back-btn" style={{ marginBottom: 16 }} onClick={onBack}>
        ← {t.backToList}
      </button>
      <h2>🌱 {t.startCultivation}</h2>
      <p>{t.startCultivationSub}</p>
      <div className="guidance-selector-row cult-form-three-col">
        <div>
          <label>Farm</label>
          <CustomSelect name="farmId" value={farmId} onChange={e => { setFarmId(e.target.value); setCrop(""); }}>
            <option value="">Select a farm…</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.farm_name}</option>
            ))}
          </CustomSelect>
        </div>
        <div>
          <label>{t.selectCrop}</label>
          {noPlannedCrops ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "8px 0 0" }}>
              No crops are planned for this farm. Add planned crops in Farm Details first.
            </p>
          ) : (
            <CustomSelect name="crop" value={crop} onChange={e => setCrop(e.target.value)} disabled={!farmId}>
              <option value="">{farmId ? t.selectCropPh : "Select a farm first…"}</option>
              {filteredCrops.map(c => <option key={c} value={c}>{c}</option>)}
            </CustomSelect>
          )}
        </div>
        <div>
          <label>{t.plantingDate}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
      </div>
      {error && <div className="cult-error">{error}</div>}
      <button className="guidance-generate-btn" type="submit" disabled={!crop || !farmId || saving || noPlannedCrops}>
        {saving ? "⏳ " + t.creating : "🌱 " + t.startCultivation}
      </button>
    </form>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CultivationTracker({ t, userId, initialSessionId, initialView, initialCrop, existingCropData, onExternalBack }) {
  const API_BASE = ML_BASE_URL;
  const { lang } = useApp();

  const [view, setView]               = useState(initialView || "list");  // list | start | dashboard
  const [sessions, setSessions]       = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [guidanceData, setGuidanceData]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await API.listCultivations(userId);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || "Cannot reach server");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Auto-open a specific session when launched from My Crops
  const initialOpenDone = useRef(false);
  useEffect(() => {
    if (!initialSessionId || initialOpenDone.current || loading || !sessions.length || view !== "list") return;
    const target = sessions.find(s => s.id === initialSessionId);
    if (target) {
      initialOpenDone.current = true;
      openSession(target);
    }
  }, [sessions, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(session) {
    setSessions(prev => [session, ...prev]);
    await openSession(session);
  }

  async function openSession(session) {
    setActiveSession(session);
    // Fetch guidance data for the stage progress bar
    try {
      const r = await fetch(`${API_BASE}/guidance/${encodeURIComponent(session.crop)}`);
      const d = await r.json();
      setGuidanceData(d.data || null);
    } catch {
      setGuidanceData(null);
    }
    setView("dashboard");
  }

  async function handleUpdateTask(sessionId, taskId, status) {
    try {
      const updated = await API.updateTask(userId, sessionId, taskId, status);
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        return { ...s, tasks: { ...s.tasks, [taskId]: updated } };
      }));
      setActiveSession(prev =>
        prev?.id === sessionId
          ? { ...prev, tasks: { ...prev.tasks, [taskId]: updated } }
          : prev
      );
    } catch (err) {
      alert(err.message || "Update failed");
    }
  }

  async function handleAbandon(sessionId) {
    try {
      const session = sessions.find(s => s.id === sessionId);
      await API.abandonCultivation(userId, sessionId);
      if (session?.crop_id) {
        try { await deleteCrop(session.crop_id); } catch {}
      }
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setActiveSession(null);
      setView("list");
      if (onExternalBack) onExternalBack();
    } catch (err) {
      alert(err.message || "Failed to abandon session");
    }
  }

  if (view === "start") {
    return (
      <StartCultivationForm
        t={t}
        userId={userId}
        onBack={onExternalBack || (() => setView("list"))}
        onCreate={handleCreate}
        defaultCrop={initialCrop}
        existingCropData={existingCropData}
      />
    );
  }

  if (view === "dashboard" && activeSession) {
    return (
      <CultivationDashboard
        session={activeSession}
        guidanceData={guidanceData}
        t={t}
        lang={lang}
        onBack={onExternalBack || (() => { setView("list"); setActiveSession(null); })}
        onUpdateTask={handleUpdateTask}
        onAbandon={handleAbandon}
      />
    );
  }

  return (
    <MyCultivationsList
      sessions={sessions}
      loading={loading}
      error={error}
      t={t}
      lang={lang}
      onStart={() => setView("start")}
      onOpen={openSession}
      onAbandon={handleAbandon}
    />
  );
}
