import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFarms } from '../../services/farmService';
import { getCrops } from '../../services/cropService';
import { getAuthSession, ML_BASE_URL } from '../../services/api';
import { listCultivations } from '../../utils/cultivationApi';
import { CROP_EMOJI, getCropLabel } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { LAND_T, SEA_LABELS, IRR_LABELS, GROWTH_STAGE_LABELS, CROP_STATUS_LABELS, DISTRICT_LABELS } from '../../data/translations';
import { getSoilLabel } from '../../data/cropData';

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}
function harvestProgress(planting, harvest) {
  const total = daysBetween(planting, harvest);
  if (total <= 0) return 100;
  const elapsed = daysBetween(planting, new Date().toISOString().slice(0, 10));
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
function daysUntil(dateStr) {
  return daysBetween(new Date().toISOString().slice(0, 10), dateStr);
}

const STAGE_ORDER = ['Seed', 'Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'];

const NOTIF_COLORS = {
  danger:  { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '🚨' },
  warning: { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: '⚠️' },
  risk:    { bg: '#fef9c3', border: '#fde047', color: '#713f12', icon: '🔶' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ️' },
  action:  { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
  task:    { bg: '#f5f3ff', border: '#c4b5fd', color: '#4c1d95', icon: '📅' },
};

function NotifCard({ type, icon, title, detail, onDismiss, onClick, viewTasksLabel }) {
  const c = NOTIF_COLORS[type] || NOTIF_COLORS.info;
  return (
    <div
      className={`dash-notif-card dash-notif-card--${type || 'info'}${onClick ? ' dash-notif-card--clickable' : ''}`}
      onClick={onClick}
    >
      <span className="dash-notif-icon">{icon || c.icon}</span>
      <div className="dash-notif-body">
        <strong className="dash-notif-strong">{title}</strong>
        <p>{detail}</p>
        {onClick && <span className="dash-notif-action-hint">{viewTasksLabel}</span>}
      </div>
      {onDismiss && (
        <button
          className="dash-notif-dismiss"
          type="button"
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          title="Dismiss"
        >✕</button>
      )}
    </div>
  );
}

async function fetchWeatherAdvice(district, lang = "en") {
  try {
    const res = await fetch(`${ML_BASE_URL}/weather?district=${encodeURIComponent(district)}&lang=${lang}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.advice || []).filter(a => a.type !== 'info');
  } catch {
    return [];
  }
}

function buildTaskNotifications(sessions, lt, getLang) {
  const today = new Date().toISOString().slice(0, 10);
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const notifs = [];

  for (const session of sessions) {
    if (session.status !== 'active') continue;
    const tasks = Object.values(session.tasks || {});
    const cropLabel = getCropLabel(session.crop, getLang);

    // Overdue tasks
    const overdue = tasks.filter(t =>
      t.status !== 'done' && t.status !== 'skipped' && t.scheduled_date < today
    );
    if (overdue.length > 0) {
      notifs.push({
        id: `overdue-${session.id}`,
        type: 'danger',
        icon: '🚨',
        title: lt.overdueTasks(overdue.length, cropLabel),
        detail: overdue.slice(0, 3).map(t => t.title).join(', ') + (overdue.length > 3 ? ` +${overdue.length - 3} more` : ''),
        href: '/landowner/cultivations',
        sessionId: session.id,
      });
    }

    // Upcoming tasks in the next 7 days
    const upcoming = tasks.filter(t =>
      t.status === 'pending' && t.scheduled_date >= today && t.scheduled_date <= in7
    );
    if (upcoming.length > 0) {
      const next = upcoming.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
      const daysLeft = daysUntil(next.scheduled_date);
      notifs.push({
        id: `upcoming-${session.id}-${next.id}`,
        type: 'task',
        icon: '📅',
        title: daysLeft === 0
          ? lt.upcomingTaskToday(cropLabel, next.title)
          : lt.upcomingTaskInDays(cropLabel, next.title, daysLeft),
        detail: lt.upcomingTaskDetail(upcoming.length) + (next.description ? ' ' + next.description : ''),
        href: '/landowner/cultivations',
        sessionId: session.id,
      });
    }
  }
  return notifs;
}

export default function LandOwnerDashboard() {
  const { lang }   = useApp();
  const t          = LAND_T[lang] || LAND_T.en;
  const { user }   = getAuthSession();
  const userId     = user?.id ? String(user.id) : null;
  const navigate   = useNavigate();

  const [farms,     setFarms]     = useState([]);
  const [crops,     setCrops]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notifs,    setNotifs]    = useState([]);
  const [notifOpen, setNotifOpen] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sa_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });

  const dismissNotif = id => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('sa_dismissed_notifs', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    async function load() {
      const [f, c] = await Promise.all([
        getFarms().catch(() => []),
        getCrops().catch(() => []),
      ]);
      setFarms(f);
      setCrops(c);
      setLoading(false);

      // ── Build notifications ──────────────────────────────────────────────
      const allNotifs = [];

      // Task-based notifications from cultivation sessions
      const lt = LAND_T[lang] || LAND_T.en;
      if (userId) {
        try {
          const cultData = await listCultivations(userId);
          const sessions = cultData.sessions || [];
          allNotifs.push(...buildTaskNotifications(sessions, lt, lang));
        } catch { /* ignore */ }
      }

      // Harvest approaching within 3 days
      const now3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      c.filter(cr => cr.status === 'Active' && cr.expected_harvest_date >= today && cr.expected_harvest_date <= now3)
        .forEach(cr => {
          const d = daysUntil(cr.expected_harvest_date);
          const cropLabel = getCropLabel(cr.crop_name, lang);
          allNotifs.push({
            id: `harvest-${cr.id}`,
            type: 'warning',
            icon: '🧺',
            title: d === 0 ? lt.harvestTodayMsg(cropLabel) : lt.harvestInDaysMsg(d, cropLabel),
            detail: lt.harvestDetailMsg(new Date(cr.expected_harvest_date).toLocaleDateString(lang === 'si' ? 'si-LK' : lang === 'ta' ? 'ta-LK' : 'en-GB')),
          });
        });

      // Weather notifications for unique active-crop farm districts
      const activeFarmIds = new Set(c.filter(cr => cr.status === 'Active').map(cr => cr.farm_id));
      const districts = [...new Set(
        f.filter(farm => activeFarmIds.has(farm.id) && farm.district).map(farm => farm.district)
      )].slice(0, 3); // cap at 3 districts

      for (const district of districts) {
        const advice = await fetchWeatherAdvice(district, lang);
        advice.forEach((a, i) => {
          allNotifs.push({
            id: `wx-${district}-${i}`,
            type: a.type,
            icon: a.icon,
            title: `${DISTRICT_LABELS[lang]?.[district] || district}: ${a.title}`,
            detail: a.detail,
          });
        });
      }

      setNotifs(allNotifs);
    }
    load();
  }, [userId, lang]);

  const visibleNotifs = notifs.filter(n => !dismissed.has(n.id));

  const active    = crops.filter(c => c.status === 'Active');
  const completed = crops.filter(c => c.status === 'Completed');
  const now       = new Date().toISOString().slice(0, 10);
  const in30      = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const upcoming  = crops.filter(c => c.expected_harvest_date >= now && c.expected_harvest_date <= in30);
  const overdue   = active.filter(c => c.expected_harvest_date < now);

  const cropCountByFarm = crops.reduce((acc, c) => {
    acc[c.farm_id] = (acc[c.farm_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="lo-dash">

      {/* Stats */}
      <div className="lo-dash__stats">
        <div className="lo-dash-stat">
          <span className="lo-dash-stat__icon">🌾</span>
          <span className="lo-dash-stat__val">{loading ? '—' : farms.length}</span>
          <span className="lo-dash-stat__lbl">{t.statFarms}</span>
          {!loading && farms.length === 0 && (
            <Link className="lo-dash-stat__hint" to="/landowner/farms/add">{t.addFirstFarmHint}</Link>
          )}
        </div>
        <div className="lo-dash-stat">
          <span className="lo-dash-stat__icon">🌱</span>
          <span className="lo-dash-stat__val">{loading ? '—' : active.length}</span>
          <span className="lo-dash-stat__lbl">{t.statActiveCrops}</span>
          {!loading && active.length === 0 && farms.length > 0 && (
            <Link className="lo-dash-stat__hint" to="/landowner/cultivations">{t.startGrowingHint}</Link>
          )}
        </div>
        <div className="lo-dash-stat lo-dash-stat--warn">
          <span className="lo-dash-stat__icon">🧺</span>
          <span className="lo-dash-stat__val">{loading ? '—' : upcoming.length}</span>
          <span className="lo-dash-stat__lbl">{t.statHarvestSoon}</span>
          {!loading && upcoming.length === 0 && (
            <span className="lo-dash-stat__hint">{t.nothingDue}</span>
          )}
        </div>
        <div className="lo-dash-stat">
          <span className="lo-dash-stat__icon">✅</span>
          <span className="lo-dash-stat__val">{loading ? '—' : completed.length}</span>
          <span className="lo-dash-stat__lbl">{t.statCompleted}</span>
          {!loading && completed.length === 0 && (
            <span className="lo-dash-stat__hint">{t.completedCropsHint}</span>
          )}
        </div>
        {overdue.length > 0 && (
          <div className="lo-dash-stat lo-dash-stat--danger">
            <span className="lo-dash-stat__icon">⚠️</span>
            <span className="lo-dash-stat__val">{overdue.length}</span>
            <span className="lo-dash-stat__lbl">{t.statOverdue}</span>
          </div>
        )}
      </div>

      {/* ── Notification panel ─────────────────────────────────────────── */}
      {!loading && (
        <section className="lo-dash__section dash-notif-section">
          <div
            className="lo-dash__section-header dash-notif-header"
            style={{ cursor: 'pointer' }}
            onClick={() => setNotifOpen(o => !o)}
          >
            <h2>
              {t.notificationsHeader}
              {visibleNotifs.length > 0 && (
                <span className="dash-notif-badge">{visibleNotifs.length}</span>
              )}
            </h2>
            <span className="dash-notif-toggle">{notifOpen ? '▲' : '▼'}</span>
          </div>

          {notifOpen && (
            visibleNotifs.length === 0 ? (
              <div className="dash-notif-empty">
                <span>✅</span>
                <span>{t.noAlerts}</span>
              </div>
            ) : (
              <div className="dash-notif-list">
                {visibleNotifs.map(n => (
                  <NotifCard
                    key={n.id}
                    type={n.type}
                    icon={n.icon}
                    title={n.title}
                    detail={n.detail}
                    onDismiss={() => dismissNotif(n.id)}
                    onClick={n.href ? () => navigate(n.href, { state: { sessionId: n.sessionId } }) : undefined}
                    viewTasksLabel={t.viewTasksArrow}
                  />
                ))}
              </div>
            )
          )}
        </section>
      )}

      {/* ── My Farms ───────────────────────────────────────────────────── */}
      <section className="lo-dash__section">
        <div className="lo-dash__section-header">
          <h2>{t.myFarms}</h2>
          <Link className="lo-dash__see-all" to="/landowner/farms">{t.seeAll}</Link>
        </div>

        {loading ? (
          <p className="lo-dash__empty">{t.loading}</p>
        ) : farms.length === 0 ? (
          <div className="lo-dash__empty-block">
            <p>{t.noFarmsRegistered}</p>
            <Link className="button button--primary" to="/landowner/farms/add">{t.addFirstFarm}</Link>
          </div>
        ) : (
          <div className="lo-dash__farm-grid">
            {farms.map(farm => (
              <Link key={farm.id} className="lo-dash-farm-card" to={`/landowner/farms/${farm.id}`}>
                <div className="lo-dash-farm-card__photo">
                  {farm.image_data
                    ? <img src={farm.image_data} alt={farm.farm_name} />
                    : <span className="lo-dash-farm-card__placeholder">🌾</span>
                  }
                  {farm.district && (
                    <span className="lo-dash-farm-card__district">{farm.district}</span>
                  )}
                </div>
                <div className="lo-dash-farm-card__body">
                  <strong className="lo-dash-farm-card__name">{farm.farm_name}</strong>
                  <div className="lo-dash-farm-card__meta">
                    <span>{farm.farm_size} {farm.size_unit}</span>
                    <span>{getSoilLabel(farm.soil_type, lang)}</span>
                    <span>{SEA_LABELS[lang]?.[farm.season] || farm.season}</span>
                  </div>
                  <div className="lo-dash-farm-card__footer">
                    <span className="lo-dash-farm-card__crop-count">
                      🌱 {t.cropCount(cropCountByFarm[farm.id] || 0)}
                    </span>
                    {farm.irrigation_type && (
                      <span className="lo-dash-farm-card__irr">{IRR_LABELS[lang]?.[farm.irrigation_type] || farm.irrigation_type}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <Link className="lo-dash-farm-card lo-dash-farm-card--add" to="/landowner/farms/add">
              <span className="lo-dash-farm-card__add-icon">+</span>
              <span>{t.addFarmCard}</span>
            </Link>
          </div>
        )}
      </section>

      {/* ── My Cultivations ────────────────────────────────────────────── */}
      <section className="lo-dash__section">
        <div className="lo-dash__section-header">
          <h2>{t.dashMyCultivations}</h2>
          <Link className="lo-dash__see-all" to="/landowner/cultivations">{t.seeAll}</Link>
        </div>

        {loading ? (
          <p className="lo-dash__empty">{t.loading}</p>
        ) : crops.length === 0 ? (
          <div className="lo-dash__empty-block">
            <p>{t.noCultivationsYet}</p>
          </div>
        ) : (
          <div className="lo-dash__cult-list">
            {crops.map(crop => {
              const pct       = harvestProgress(crop.planting_date, crop.expected_harvest_date);
              const daysLeft  = daysUntil(crop.expected_harvest_date);
              const daysSince = daysBetween(crop.planting_date, new Date().toISOString().slice(0, 10));
              const stageIdx  = STAGE_ORDER.indexOf(crop.growth_stage);
              const isOverdue = crop.status === 'Active' && daysLeft < 0;

              return (
                <Link key={crop.id} className="lo-dash-cult-card" to={`/landowner/crops/${crop.id}`}>
                  <div className="lo-dash-cult-card__left">
                    <span className="lo-dash-cult-card__emoji">{CROP_EMOJI[crop.crop_name] || '🌱'}</span>
                  </div>
                  <div className="lo-dash-cult-card__body">
                    <div className="lo-dash-cult-card__top">
                      <strong className="lo-dash-cult-card__name">{getCropLabel(crop.crop_name, lang)}</strong>
                      <span className="lo-dash-cult-card__farm">{crop.farm_name}</span>
                    </div>
                    <div className="lo-dash-cult-card__tags">
                      <span className="lo-dash-cult-card__stage">{GROWTH_STAGE_LABELS[lang]?.[crop.growth_stage] || crop.growth_stage}</span>
                      {stageIdx >= 0 && (
                        <div className="lo-dash-cult-card__stage-dots">
                          {STAGE_ORDER.map((s, i) => (
                            <span
                              key={s}
                              className={`lo-dash-cult-card__dot${i <= stageIdx ? ' lo-dash-cult-card__dot--active' : ''}`}
                              title={s}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="lo-dash-cult-card__bar-row">
                      <div className="lo-dash-cult-card__bar">
                        <div
                          className="lo-dash-cult-card__fill"
                          style={{ width: `${pct}%`, background: isOverdue ? 'var(--danger)' : undefined }}
                        />
                      </div>
                      <span className="lo-dash-cult-card__pct">{pct}%</span>
                    </div>
                    <div className="lo-dash-cult-card__dates">
                      <span>{t.dayPrefix} {daysSince < 0 ? 0 : daysSince}</span>
                      {isOverdue
                        ? <span className="lo-dash-cult-card__overdue">⚠ {Math.abs(daysLeft)}{t.daysOverdue}</span>
                        : <span>{daysLeft}{t.daysToHarvest}</span>
                      }
                    </div>
                  </div>
                  <span className={`lo-dash-cult-card__status status--${(crop.status || '').toLowerCase()}`}>
                    {CROP_STATUS_LABELS[lang]?.[crop.status] || crop.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
