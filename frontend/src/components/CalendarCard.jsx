import { monthName } from "../data/cropData";
import { SEA_LABELS } from "../data/translations";

/** Builds an inclusive month array wrapping around December → January. */
function monthRange(start, end) {
  const months = [];
  let m = start;
  while (true) {
    months.push(m);
    if (m === end) break;
    m = (m % 12) + 1;
    // Safety: never loop more than 12 months
    if (months.length > 12) break;
  }
  return months;
}

export default function CalendarCard({ cal, season, lang, t }) {
  if (!cal) return null;

  const isYearRound = cal.plant_start === 1 && cal.plant_end === 12;
  const yearRoundLbl = SEA_LABELS[lang]?.["Year-round"] || SEA_LABELS.en["Year-round"];

  return (
    <div className="cal-card" data-tour="cr-calendar-card">
      <div className="cal-inner">
        <div className="cal-hdr">
          <div className="cal-title">
            📅 {t.calTitle} — {SEA_LABELS[lang][season] || season}
          </div>
        </div>
        <div className="cal-body">
          {isYearRound ? (
            <div style={{ fontSize: 13, color: "var(--bark)", opacity: .75, padding: "4px 0" }}>
              🌿 {yearRoundLbl}
            </div>
          ) : (
            <>
              <div className="cal-row">
                <div className="cal-rowlbl">{t.calPlant}</div>
                <div className="cal-months">
                  {monthRange(cal.plant_start, cal.plant_end).map(m => (
                    <span key={m} className="cal-chip cal-plant">{monthName(m, lang)}</span>
                  ))}
                </div>
              </div>
              <div className="cal-row">
                <div className="cal-rowlbl">{t.calHarvest}</div>
                <div className="cal-months">
                  {monthRange(cal.harvest_start, cal.harvest_end).map(m => (
                    <span key={m} className="cal-chip cal-harvest">{monthName(m, lang)}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
