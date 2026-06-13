import { I18N } from '../i18n';
import StepTabs from './StepTabs';
import './ResultStep.css';

const CONDITION_META = {
  FR: {
    Level_0: { label: 'Acné légère',    color: '#845145', bg: '#ffdad2' },
    Level_1: { label: 'Acné modérée',   color: '#a0624e', bg: '#ffdad2' },
    Level_2: { label: 'Acné sévère',    color: '#ba1a1a', bg: '#ffdad6' },
    Eczema:  { label: 'Eczéma',         color: '#4d635f', bg: '#cde5e0' },
    Rosacea: { label: 'Rosacée',        color: '#845145', bg: '#ffdad2' },
    Normal:  { label: 'Peau saine',     color: '#4d635f', bg: '#cde5e0' },
  },
  EN: {
    Level_0: { label: 'Mild Acne',     color: '#845145', bg: '#ffdad2' },
    Level_1: { label: 'Moderate Acne', color: '#a0624e', bg: '#ffdad2' },
    Level_2: { label: 'Severe Acne',   color: '#ba1a1a', bg: '#ffdad6' },
    Eczema:  { label: 'Eczema',        color: '#4d635f', bg: '#cde5e0' },
    Rosacea: { label: 'Rosacea',       color: '#845145', bg: '#ffdad2' },
    Normal:  { label: 'Healthy Skin',  color: '#4d635f', bg: '#cde5e0' },
  },
};

const ZONE_LABELS = {
  FR: {
    hairline_temples: 'Tempes',
    t_zone:           'Zone T',
    cheeks:           'Joues',
    jawline_chin:     'Mâchoire',
    nose:             'Nez',
  },
  EN: {
    hairline_temples: 'Hairline',
    t_zone:           'T-zone',
    cheeks:           'Cheeks',
    jawline_chin:     'Jawline',
    nose:             'Nose',
  },
};

const ZONE_POSITIONS = {
  hairline_temples: { top: '8%',  left: '50%' },
  t_zone:           { top: '30%', left: '70%' },
  nose:             { top: '50%', left: '72%' },
  cheeks:           { top: '58%', left: '18%' },
  jawline_chin:     { top: '80%', left: '50%' },
};

export default function ResultStep({ prediction, preview, activeIdx, stepLabels, lang = 'FR', onLangToggle, darkMode, onDarkToggle, onContinue, onReset }) {
  const t = I18N[lang];
  const condMap = CONDITION_META[lang];
  const zoneMap = ZONE_LABELS[lang];
  const meta = condMap[prediction.condition] || { label: prediction.condition, color: '#845145', bg: '#ffdad2' };
  const zones = prediction.zones || [];
  const affectedZones = zones.filter(z => z.affected);
  const hasWarning = prediction.warning || prediction.low_confidence;

  const confBars = [
    { label: t.modelConfidence,  value: Math.round(prediction.confidence) },
    { label: lang === 'FR' ? 'Zones mappées'   : 'Zones Mapped',    value: zones.length > 0 ? Math.min(100, zones.length * 20) : 60 },
    { label: lang === 'FR' ? 'Zones affectées' : 'Affected Zones',  value: affectedZones.length > 0 ? Math.round((affectedZones.length / Math.max(zones.length, 1)) * 100) : 0 },
  ];

  return (
    <div className="rs-page">
      <header className="rs-top-bar">
        <div className="rs-logo">
          <span className="material-symbols-outlined">spa</span>
          UrSkin
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="rs-lang-btn" onClick={onLangToggle}>{t.langToggle}</button>
          <button className="rs-lang-btn" onClick={onDarkToggle} title="Toggle dark mode">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <main className="rs-main">
        <StepTabs labels={stepLabels} activeIdx={activeIdx} />

        {hasWarning && (
          <div className="rs-warning">
            <span className="material-symbols-outlined">warning</span>
            {prediction.warning || t.lowConfidence}
          </div>
        )}

        <div className="rs-grid">
          {/* ── Left: annotated photo ────────────────────────────────────── */}
          <div className="rs-photo-col">
            <div className="rs-photo-wrap">
              <img src={preview} alt="skin" className="rs-photo-img" />
              <div className="rs-scanner" />
              {zones.map(z => (
                <div
                  key={z.zone}
                  className={`rs-zone-node ${z.affected ? 'rs-zone-affected' : 'rs-zone-clear'}`}
                  style={ZONE_POSITIONS[z.zone]}
                >
                  <div className="rs-node-dot" />
                  <div className="rs-node-label">
                    {zoneMap[z.zone] || z.zone}{z.affected ? '' : ` : ${lang === 'FR' ? 'saine' : 'clear'}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: results panel ─────────────────────────────────────── */}
          <div className="rs-panel">
            <div className="rs-glass rs-assessment">
              <div className="rs-assessment-tag">
                <span className="material-symbols-outlined">biotech</span>
                {t.aiComplete}
              </div>
              <h2 className="rs-assessment-title serif">{t.analysisResults}</h2>
              <div className="rs-condition-block">
                <div className="rs-condition-row">
                  <div>
                    <p className="rs-condition-hint">{t.detectedCondition}</p>
                    <p className="rs-condition-label">{meta.label}</p>
                  </div>
                  <span className="material-symbols-outlined rs-condition-icon">
                    {prediction.condition === 'Normal' ? 'check_circle' : 'warning'}
                  </span>
                </div>
                <div className="rs-confidence-row">
                  <div>
                    <p className="rs-condition-hint">{t.modelConfidence}</p>
                    <p className="rs-condition-label">{prediction.confidence.toFixed(1)}%</p>
                  </div>
                  <div className="rs-conf-dots">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`rs-conf-dot ${i < Math.round(prediction.confidence / 20) ? 'rs-conf-dot-active' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rs-glass rs-bars">
              <h3 className="rs-bars-title">{t.aiConfidenceIndex}</h3>
              <div className="rs-bars-list">
                {confBars.map(b => (
                  <div key={b.label} className="rs-bar-row">
                    <div className="rs-bar-meta"><span>{b.label}</span><span>{b.value}%</span></div>
                    <div className="rs-bar-track"><div className="rs-bar-fill" style={{ width: `${b.value}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {prediction.all_probs && (
              <div className="rs-glass rs-bars">
                <h3 className="rs-bars-title">{t.allConditions}</h3>
                <div className="rs-bars-list">
                  {Object.entries(prediction.all_probs)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, pct]) => {
                      const m = condMap[cls] || { label: cls, color: '#845145' };
                      return (
                        <div key={cls} className="rs-bar-row">
                          <div className="rs-bar-meta"><span>{m.label}</span><span>{pct.toFixed(0)}%</span></div>
                          <div className="rs-bar-track"><div className="rs-bar-fill" style={{ width: `${pct}%`, background: m.color }} /></div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="rs-insight">
              <p>{t.insightNote(zones.length)}</p>
            </div>

            <div className="rs-actions">
              {prediction.is_acne ? (
                <button className="btn btn-primary rs-cta" onClick={onContinue}>
                  {t.continueQuestionnaire}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <div className="rs-healthy-msg">
                  <span className="material-symbols-outlined">check_circle</span>
                  {t.noAcne(meta.label)}
                </div>
              )}
              <button className="btn btn-ghost" onClick={onReset}>{t.tryAnother}</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
