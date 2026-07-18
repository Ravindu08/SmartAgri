import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCrops, deleteCrop } from '../../services/cropService';
import { listCultivations, abandonCultivation } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { CROP_EMOJI, getCropLabel } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { T, LAND_T } from '../../data/translations';
import CultivationTracker from '../../components/CultivationTracker';
import Toast from '../../components/Toast';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import HelpButton      from '../../components/tour/HelpButton';

const MCV_TOUR_T = {
  en: {
    steps: [
      { target: 'cult-start-btn', title: 'Start tracking a cultivation', body: 'Follow a crop stage-by-stage — tasks, photos, and progress all in one place.' },
      { target: 'cult-crop-card', title: 'Your active crops', body: 'Each card shows planting/harvest dates and live tracking progress if you’ve started one.' },
      { target: 'cult-progress', title: 'Track your progress', body: 'See how many tasks are done, and get an overdue warning if anything’s behind schedule.' },
      { target: 'cult-export-pdf', title: 'Export a PDF report', body: 'Download the full task list and progress as a PDF — handy for record-keeping or sharing.' },
      { target: 'cult-open-track-btn', title: 'Open or start tracking', body: 'Click here to open an existing tracker, or start a new one for this crop.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'cult-start-btn', title: 'වගාවක් ලුහුබැඳීම ආරම්භ කරන්න', body: 'බෝගයක් අදියරෙන් අදියර අනුගමනය කරන්න — කාර්යයන්, ඡායාරූප සහ ප්‍රගතිය සියල්ල එකම තැනක.' },
      { target: 'cult-crop-card', title: 'ඔබේ ක්‍රියාකාරී බෝග', body: 'සෑම කාඩ්පතක්ම රෝපණය/අස්වනු දින සහ ඔබ එකක් ආරම්භ කර ඇත්නම් සජීවී ලුහුබැඳීමේ ප්‍රගතිය පෙන්වයි.' },
      { target: 'cult-progress', title: 'ඔබේ ප්‍රගතිය නිරීක්ෂණය කරන්න', body: 'කී කාර්යයන් අවසන් වී ඇත්දැයි බලන්න, කාලසටහනට පසුබට වී ඇත්නම් ප්‍රමාද ඇඟවීමක් ලැබේ.' },
      { target: 'cult-export-pdf', title: 'PDF වාර්තාවක් නිර්යාත කරන්න', body: 'සම්පූර්ණ කාර්ය ලැයිස්තුව සහ ප්‍රගතිය PDF ලෙස බාගන්න — වාර්තා තබා ගැනීමට හෝ බෙදාගැනීමට පහසුයි.' },
      { target: 'cult-open-track-btn', title: 'විවෘත කරන්න හෝ ලුහුබැඳීම ආරම්භ කරන්න', body: 'පවතින ලුහුබැඳීමක් විවෘත කිරීමට, හෝ මෙම බෝගය සඳහා නව එකක් ආරම්භ කිරීමට මෙහි ක්ලික් කරන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'cult-start-btn', title: 'ஒரு சாகுபடியைக் கண்காணிக்கத் தொடங்குங்கள்', body: 'ஒரு பயிரை நிலைவாரியாகப் பின்பற்றுங்கள் — பணிகள், புகைப்படங்கள் மற்றும் முன்னேற்றம் அனைத்தும் ஒரே இடத்தில்.' },
      { target: 'cult-crop-card', title: 'உங்கள் செயலில் உள்ள பயிர்கள்', body: 'ஒவ்வொரு அட்டையும் நடவு/அறுவடை தேதிகள் மற்றும் நீங்கள் தொடங்கியிருந்தால் நேரடி கண்காணிப்பு முன்னேற்றத்தையும் காட்டுகிறது.' },
      { target: 'cult-progress', title: 'உங்கள் முன்னேற்றத்தைக் கண்காணிக்கவும்', body: 'எத்தனை பணிகள் முடிந்துள்ளன என்பதைப் பாருங்கள், அட்டவணையை விட பின்தங்கியிருந்தால் தாமத எச்சரிக்கை கிடைக்கும்.' },
      { target: 'cult-export-pdf', title: 'PDF அறிக்கையை ஏற்றுமதி செய்யுங்கள்', body: 'முழு பணிப் பட்டியல் மற்றும் முன்னேற்றத்தை PDF ஆக பதிவிறக்கவும் — பதிவு வைத்திருக்க அல்லது பகிர வசதியானது.' },
      { target: 'cult-open-track-btn', title: 'திறக்க அல்லது கண்காணிப்பைத் தொடங்குங்கள்', body: 'ஏற்கனவே உள்ள கண்காணிப்பாளரைத் திறக்க, அல்லது இந்த பயிருக்கு புதிதாகத் தொடங்க இங்கே கிளிக் செய்யுங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

async function exportSessionPDF(session, cropLabel) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const tasks = Object.values(session.tasks || {}).sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''));
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20); doc.setTextColor(26, 122, 74);
  doc.text('SmartAgri — Cultivation Report', 14, 18);
  doc.setFontSize(12); doc.setTextColor(60, 60, 60);
  doc.text(`Crop: ${cropLabel}`, 14, 28);
  doc.text(`Planting Date: ${session.planting_date || '—'}`, 14, 35);
  doc.text(`Status: ${session.status || '—'}`, 14, 42);
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 49);

  // Divider
  doc.setDrawColor(200); doc.line(14, 53, pageW - 14, 53);

  // Tasks table
  let y = 60;
  doc.setFontSize(10); doc.setTextColor(100);
  doc.text('#', 14, y); doc.text('Task', 22, y); doc.text('Scheduled', 110, y); doc.text('Status', 150, y);
  y += 4; doc.line(14, y, pageW - 14, y); y += 5;

  doc.setTextColor(40);
  tasks.forEach((t, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const statusColor = t.status === 'done' ? [26, 122, 74] : t.status === 'skipped' ? [150, 100, 0] : [80, 80, 80];
    doc.setTextColor(40);
    doc.text(String(i + 1), 14, y);
    doc.text(doc.splitTextToSize(t.title || '', 80).join(' '), 22, y);
    doc.text(t.scheduled_date || '—', 110, y);
    doc.setTextColor(...statusColor);
    doc.text((t.status || '—').toUpperCase(), 150, y);
    y += 7;
  });

  doc.save(`cultivation-${cropLabel.replace(/\s+/g, '_')}-${session.id?.slice(-6) || 'report'}.pdf`);
}

function sessionProgress(session) {
  const tasks = Object.values(session.tasks || {});
  if (!tasks.length) return { done: 0, total: 0, pct: 0, overdue: 0, elapsed: null };
  const today   = new Date().toISOString().slice(0, 10);
  const done    = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t =>
    t.status !== 'done' && t.status !== 'skipped' && t.scheduled_date < today
  ).length;
  const elapsed = session.planting_date
    ? Math.floor((Date.now() - new Date(session.planting_date).getTime()) / 86400000)
    : null;
  return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100), overdue, elapsed };
}

export default function MyCultivations() {
  const { lang }   = useApp();
  const t          = T[lang] || T.en;
  const lt         = LAND_T[lang] || LAND_T.en;
  const { user }   = getAuthSession();
  const userId     = user?.id ? String(user.id) : null;
  const location   = useLocation();

  const [view,              setView]              = useState('list');
  const [activeSessionId,   setActiveSessionId]   = useState(null);
  const [startCrop,         setStartCrop]         = useState('');
  const [startExistingCrop, setStartExistingCrop] = useState(null);
  const [crops,             setCrops]             = useState([]);
  const [sessions,          setSessions]          = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [abandonTarget,     setAbandonTarget]     = useState(null);
  const [isAbandoning,      setIsAbandoning]      = useState(false);
  const [toast,             setToast]             = useState({ type: 'success', message: '' });
  const mcvTourT = MCV_TOUR_T[lang] || MCV_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cropData, cultData] = await Promise.all([
        getCrops(),
        userId
          ? listCultivations(userId).catch(() => ({ sessions: [] }))
          : Promise.resolve({ sessions: [] }),
      ]);
      setCrops(cropData.filter(c => c.status === 'Active'));
      setSessions(cultData.sessions || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (location.state?.sessionId) {
      setActiveSessionId(location.state.sessionId);
      setView('tracker');
    }
  }, []);

  function getSession(crop) {
    return sessions.find(s =>
      (s.status === 'active') && (
        (crop.id && s.crop_id && s.crop_id === String(crop.id)) ||
        s.crop.toLowerCase() === crop.crop_name.toLowerCase()
      )
    ) || null;
  }

  function goBack() {
    setView('list');
    setActiveSessionId(null);
    setStartCrop('');
    setStartExistingCrop(null);
    loadData();
  }

  const confirmAbandon = async () => {
    if (!abandonTarget) return;
    setIsAbandoning(true);
    const { crop, session } = abandonTarget;
    try {
      if (session) await abandonCultivation(userId, session.id);
      await deleteCrop(crop.id);
      setToast({ type: 'success', message: lt.cropRemovedMsg(crop.crop_name) });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setAbandonTarget(null);
      setIsAbandoning(false);
    }
  };

  // ── Render in a stable section so the fadeInUp animation doesn't replay on view switch
  return (
    <section className="crop-page">
      {view === 'tracker' ? (
        <>
          <CultivationTracker
            key={activeSessionId || 'new-' + startCrop}
            t={t}
            userId={userId}
            initialSessionId={activeSessionId || undefined}
            initialView={activeSessionId ? undefined : 'start'}
            initialCrop={startCrop || undefined}
            existingCropData={startExistingCrop || undefined}
            onExternalBack={goBack}
          />
          <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        </>
      ) : (
        // ── Crop list view ──────────────────────────────────────────────────
        <>
      <div className="crop-page__header" style={{ marginBottom: 0 }}>
        <div>
          <p className="section__label">{lt.cultivationTracking}</p>
          <h1>{lt.myCultivationsTitle}</h1>
          <p className="section__copy">{lt.myCultivationsDesc}</p>
        </div>
        <div className="crop-actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => { setStartCrop(''); setActiveSessionId(null); setView('tracker'); }}
            data-tour="cult-start-btn"
          >
            {lt.startNewCultBtn}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="crop-loading">{lt.loading}</div>
      ) : crops.length === 0 ? (
        <div className="crop-empty">
          <p>{lt.noCultivationsYet}</p>
        </div>
      ) : (
        <div className="cult-crop-list">
          {crops.map((crop, i) => {
            const session = getSession(crop);
            const prog    = session ? sessionProgress(session) : null;
            const emoji   = CROP_EMOJI[crop.crop_name] || '🌱';

            return (
              <div key={crop.id} className="cult-crop-card" data-tour={i === 0 ? 'cult-crop-card' : undefined}>
                <div className="cult-crop-card__left">
                  <span className="cult-crop-card__emoji">{emoji}</span>
                </div>
                <div className="cult-crop-card__body">
                  <div className="cult-crop-card__top">
                    <div>
                      <span className="cult-crop-card__name">{getCropLabel(crop.crop_name, lang)}</span>
                      <span className="cult-crop-card__farm">📍 {crop.farm_name || '—'}</span>
                    </div>
                    <span className={`cult-status-badge status-${session ? 'active' : 'pending'}`}>
                      {session ? lt.trackingBadge : lt.noTrackingBadge}
                    </span>
                  </div>

                  <div className="cult-crop-card__meta">
                    {lt.startedLabel}: <strong>{new Date(crop.planting_date).toLocaleDateString()}</strong>
                    &nbsp;·&nbsp;
                    {lt.harvestCardLabel}: <strong>{new Date(crop.expected_harvest_date).toLocaleDateString()}</strong>
                    {prog?.elapsed !== null && prog?.elapsed !== undefined && (
                      <>&nbsp;·&nbsp;{lt.dayPrefix} <strong>{prog.elapsed}</strong></>
                    )}
                  </div>

                  {prog && (
                    <div className="cult-crop-card__progress" data-tour={i === 0 ? 'cult-progress' : undefined}>
                      <div className="cult-progress-bar">
                        <div className="cult-progress-fill" style={{ width: `${prog.pct}%` }} />
                      </div>
                      <span className="cult-crop-card__prog-label">
                        {prog.done}/{prog.total} {lt.tasksWord} · {prog.pct}%
                        {prog.overdue > 0 && (
                          <span className="cult-overdue-badge" style={{ marginLeft: 8 }}>⚠ {prog.overdue} {lt.statOverdue}</span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="cult-crop-card__actions">
                    {session ? (
                      <>
                        <button
                          className="cult-btn cult-btn-open"
                          type="button"
                          onClick={() => { setActiveSessionId(session.id); setView('tracker'); }}
                          data-tour={i === 0 ? 'cult-open-track-btn' : undefined}
                        >
                          {lt.openTrackingBtn}
                        </button>
                        <button
                          className="cult-btn cult-btn-open"
                          type="button"
                          style={{ background: 'var(--muted-bg, #e5e7eb)', color: 'var(--text)', fontSize: '14px' }}
                          onClick={() => exportSessionPDF(session, getCropLabel(crop.crop_name, lang))}
                          title="Export PDF report"
                          data-tour={i === 0 ? 'cult-export-pdf' : undefined}
                        >
                          📄 Export PDF
                        </button>
                      </>
                    ) : (
                      <button
                        className="cult-btn cult-btn-open"
                        type="button"
                        onClick={() => {
                          setStartCrop(crop.crop_name);
                          setStartExistingCrop(crop);
                          setActiveSessionId(null);
                          setView('tracker');
                        }}
                        data-tour={i === 0 ? 'cult-open-track-btn' : undefined}
                      >
                        {lt.startTrackingBtn}
                      </button>
                    )}
                    <button
                      className="cult-btn cult-btn-abandon"
                      type="button"
                      onClick={() => setAbandonTarget({ crop, session })}
                    >
                      {lt.abandonBtn}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {abandonTarget && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>{lt.abandonCultivationTitle}</h2>
            <p>
              {lt.abandonBtn} <strong>{getCropLabel(abandonTarget.crop.crop_name, lang)}</strong>? {abandonTarget.session ? lt.abandonCropMsg : lt.abandonCropOnlyMsg}
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setAbandonTarget(null)}>
                {lt.cancelBtn}
              </button>
              <button
                className="button button--danger"
                type="button"
                onClick={confirmAbandon}
                disabled={isAbandoning}
              >
                {isAbandoning ? lt.abandoningDots : lt.yesAbandonBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        </>
      )}

      <HelpButton label={mcvTourT.needHelp} ariaLabel={mcvTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={mcvTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: mcvTourT.next, back: mcvTourT.back, skip: mcvTourT.skip, done: mcvTourT.done }}
      />
    </section>
  );
}
