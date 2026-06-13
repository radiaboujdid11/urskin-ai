import { I18N } from '../i18n';
import StepTabs from './StepTabs';
import './ReportStep.css';
import GlowRoutine from './GlowRoutine';

const CONDITION_META = {
  FR: {
    Level_0: { label: 'Acné légère',  color: '#845145' },
    Level_1: { label: 'Acné modérée', color: '#a0624e' },
    Level_2: { label: 'Acné sévère',  color: '#ba1a1a' },
    Eczema:  { label: 'Eczéma',       color: '#4d635f' },
    Rosacea: { label: 'Rosacée',      color: '#845145' },
    Normal:  { label: 'Peau saine',   color: '#4d635f' },
  },
  EN: {
    Level_0: { label: 'Mild Acne',     color: '#845145' },
    Level_1: { label: 'Moderate Acne', color: '#a0624e' },
    Level_2: { label: 'Severe Acne',   color: '#ba1a1a' },
    Eczema:  { label: 'Eczema',        color: '#4d635f' },
    Rosacea: { label: 'Rosacea',       color: '#845145' },
    Normal:  { label: 'Healthy Skin',  color: '#4d635f' },
  },
};

const ZONE_LABELS = {
  FR: {
    hairline_temples: 'Tempes & Fronton',
    t_zone:           'Zone T',
    cheeks:           'Joues',
    jawline_chin:     'Mâchoire & Menton',
    nose:             'Nez',
  },
  EN: {
    hairline_temples: 'Hairline & Temples',
    t_zone:           'T-Zone',
    cheeks:           'Cheeks',
    jawline_chin:     'Jawline & Chin',
    nose:             'Nose',
  },
};

const CAUSE_ICONS = {
  hormonal: 'psychology',
  diet:     'nutrition',
  stress:   'self_improvement',
  products: 'spa',
  friction: 'back_hand',
  hygiene:  'clean_hands',
};

export default function ReportStep({ report, preview, activeIdx, stepLabels, lang = 'FR', onLangToggle, darkMode, onDarkToggle, onReset }) {
  const t = I18N[lang];
  const condMap = CONDITION_META[lang];
  const zoneMap = ZONE_LABELS[lang];
  const condMeta = condMap[report.condition] || { label: report.condition, color: '#845145' };
  const causes = report.causes || [];
  const topCause = causes[0];
  const secondCause = causes[1];
  const affectedZones = (report.zones || []).filter(z => z.affected);

  return (
    <div className="rp-page">
      <header className="rp-top-bar">
        <div className="rp-logo">
          <span className="material-symbols-outlined">spa</span>
          UrSkin
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="rp-lang-btn" onClick={onLangToggle}>{t.langToggle}</button>
          <button className="rp-lang-btn" onClick={onDarkToggle} title="Toggle dark mode">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <main className="rp-main">
        <StepTabs labels={stepLabels} activeIdx={activeIdx} />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="rp-hero">
          <div className="rp-hero-text">
            <span className="rp-eyebrow">
              <span className="material-symbols-outlined">verified</span>
              {t.analysisComplete}
            </span>
            <h1 className="rp-hero-title serif">
              {topCause
                ? <>{t.topCausePrefix} <em style={{ color: condMeta.color }}>{topCause.label.toLowerCase()}.</em></>
                : <>{t.analysisDone} <em style={{ color: 'var(--primary)' }}>{t.complete}</em></>
              }
            </h1>
            <p className="rp-hero-sub">{t.reportSub}</p>
          </div>
          <div className="rp-hero-badge-wrap">
            <span className="material-symbols-outlined rp-hero-badge-icon">verified</span>
            <span className="rp-hero-badge-label">{t.clinicallyValidated}</span>
          </div>
        </section>

        {/* Affected zones chips */}
        {affectedZones.length > 0 && (
          <div className="rp-zones-row">
            <span className="rp-zones-label">{t.affectedZones}</span>
            <div className="rp-zones-chips">
              {affectedZones.map(z => (
                <span key={z.zone} className="rp-zone-chip">
                  <span className="material-symbols-outlined">location_on</span>
                  {zoneMap[z.zone] || z.zone}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Causes bento grid ─────────────────────────────────────────── */}
        {causes.length > 0 && (
          <section className="rp-causes-section">
            <div className="rp-causes-grid">
              {topCause && (
                <div className="rp-cause-large">
                  <div className="rp-cause-large-inner">
                    <div className="rp-cause-rank-badge">
                      <span>{t.rankLabel(1)}</span>
                      <span className="rp-cause-score">{t.impactScore(Math.round(topCause.score))}</span>
                    </div>
                    <h2 className="rp-cause-title serif">{topCause.label}</h2>
                    <p className="rp-cause-desc">{topCause.description}</p>
                    <div className="rp-advice-list">
                      {topCause.advice?.slice(0, 3).map((tip, j) => (
                        <div key={j} className="rp-advice-row">
                          <span className="material-symbols-outlined rp-advice-icon">
                            {CAUSE_ICONS[topCause.cause] || 'tips_and_updates'}
                          </span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rp-cause-large-deco">
                    <span className="material-symbols-outlined">
                      {CAUSE_ICONS[topCause.cause] || 'psychology'}
                    </span>
                  </div>
                </div>
              )}

              {secondCause && (
                <div className="rp-cause-sm">
                  <div className="rp-cause-sm-top">
                    <span className="rp-cause-sm-rank">{t.rankLabel(2)}</span>
                    <span className="material-symbols-outlined rp-cause-sm-icon">
                      {CAUSE_ICONS[secondCause.cause] || 'tips_and_updates'}
                    </span>
                  </div>
                  <h3 className="rp-cause-sm-title serif">{secondCause.label}</h3>
                  <p className="rp-cause-sm-desc">{secondCause.description}</p>
                  <div className="rp-cause-sm-tag">{t.score(Math.round(secondCause.score))}</div>
                </div>
              )}
            </div>

            {causes.slice(2).length > 0 && (
              <div className="rp-causes-rest">
                {causes.slice(2).map((c, i) => (
                  <div key={c.cause} className="rp-cause-minor">
                    <span className="rp-cause-minor-num">#{i + 3}</span>
                    <span className="material-symbols-outlined rp-cause-minor-icon">
                      {CAUSE_ICONS[c.cause] || 'info'}
                    </span>
                    <div className="rp-cause-minor-text">
                      <span className="rp-cause-minor-label">{c.label}</span>
                      <span className="rp-cause-minor-score">{Math.round(c.score)}%</span>
                    </div>
                    <div className="rp-cause-minor-track">
                      <div className="rp-cause-minor-fill" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="rp-divider" />

        {/* ── Glow Routine ─────────────────────────────────────────────── */}
        <GlowRoutine report={report} lang={lang} />

        {/* ── Insight note ─────────────────────────────────────────────── */}
        <div className="rp-insight-note">
          <div className="rp-insight-icon">
            <span className="material-symbols-outlined">lightbulb</span>
          </div>
          <p>{t.consistentUse}</p>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="rp-footer">
          <p className="rp-disclaimer">
            <span className="material-symbols-outlined">info</span>
            {t.disclaimer}
          </p>
          <button className="btn btn-primary" onClick={onReset}>
            <span className="material-symbols-outlined">refresh</span>
            {t.analyzeAnother}
          </button>
        </div>
      </main>
    </div>
  );
}
