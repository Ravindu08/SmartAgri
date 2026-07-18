import { getCropLabel, CROP_EMOJI } from "../data/cropData";

export default function CompareCard({ top3, lang, t }) {
  if (!top3 || top3.length < 2) return null;

  const rankCls = ["rank-1", "rank-2", "rank-3"];
  const confCls = c => c >= 0.7 ? "cp-hi" : c >= 0.4 ? "cp-md" : "cp-lo";

  return (
    <div className="cmp-card" data-tour="cr-compare-card">
      <div className="cmp-inner">
        <div className="cmp-hdr">
          <div className="cmp-title">⚖️ {t.compareTitle}</div>
          <div className="cmp-sub">{t.compareSub}</div>
        </div>
        <div className="cmp-body">
          <table className="cmp-table">
            <thead>
              <tr>
                {/* cropLabel is now translated — was previously hardcoded "Crop" in English */}
                <th>{t.cropLabel}</th>
                <th>{t.confidence}</th>
                <th>{t.duration}</th>
                <th>{t.water}</th>
                <th>{t.phRange}</th>
                <th>{t.tempRange}</th>
              </tr>
            </thead>
            <tbody>
              {top3.map((item, i) => {
                const ci = item.crop_info;
                return (
                  <tr key={item.crop}>
                    <td>
                      <div className="cmp-crop-name">
                        <span className={`cmp-rank ${rankCls[i]}`}>{i + 1}</span>
                        {CROP_EMOJI[item.crop] || "🌿"} {getCropLabel(item.crop, lang)}
                      </div>
                    </td>
                    <td>
                      <span className={`conf-pill ${confCls(item.confidence)}`}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </td>
                    <td>{ci ? `${ci.crop_duration_min}–${ci.crop_duration_max} ${t.days}` : "—"}</td>
                    <td>{ci ? `${ci.water_required_min}–${ci.water_required_max} mm` : "—"}</td>
                    <td>{ci ? `${ci.ph_min}–${ci.ph_max}` : "—"}</td>
                    <td>{ci ? `${ci.temp_min}–${ci.temp_max} °C` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
