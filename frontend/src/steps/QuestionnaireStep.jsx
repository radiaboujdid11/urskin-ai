import { useState } from 'react';
import { I18N } from '../i18n';
import StepTabs from './StepTabs';
import './QuestionnaireStep.css';

const SEVERITY_LABELS = {
  FR: { Level_0: 'légère', Level_1: 'modérée', Level_2: 'sévère' },
  EN: { Level_0: 'mild',   Level_1: 'moderate', Level_2: 'severe' },
};

const QUESTION_KEYS_BY_GROUP = [
  ['is_female', 'period_correlation', 'cycle_irregular', 'dairy_intake', 'sugar_intake'],
  ['sleep_hours', 'stress_level'],
  ['changed_products', 'touches_face', 'phone_contact', 'same_pillowcase', 'medications'],
];

const QUESTION_META = {
  is_female:          { icon: 'wc',            showIf: null },
  period_correlation: { icon: 'calendar_month', showIf: a => a.is_female },
  cycle_irregular:    { icon: 'autorenew',      showIf: a => a.is_female },
  dairy_intake:       { icon: 'egg',            showIf: null },
  sugar_intake:       { icon: 'cake',           showIf: null },
  sleep_hours:        { icon: 'hotel',          showIf: null, type: 'scale', min: 4, max: 10 },
  stress_level:       { icon: 'psychology',     showIf: null, type: 'scale', min: 1, max: 5 },
  changed_products:   { icon: 'spa',            showIf: null },
  touches_face:       { icon: 'back_hand',      showIf: null },
  phone_contact:      { icon: 'smartphone',     showIf: null },
  same_pillowcase:    { icon: 'bedroom',        showIf: null },
  medications:        { icon: 'medication',     showIf: null },
};

function HeaderBar({ lang, onLangToggle, darkMode, onDarkToggle, t }) {
  return (
    <header className="qs-header">
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined">spa</span>
        UrSkin
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="qs-header-label" onClick={onLangToggle}>{t.langToggle}</button>
        <button className="qs-header-label" onClick={onDarkToggle} title="Toggle dark mode">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </header>
  );
}

export default function QuestionnaireStep({ prediction, activeIdx, stepLabels, lang = 'FR', onLangToggle, darkMode, onDarkToggle, onSubmit, onBack }) {
  const t = I18N[lang];
  const severity = SEVERITY_LABELS[lang][prediction?.condition] || '';
  const [answers, setAnswers] = useState({ stress_level: 2, sleep_hours: 7 });
  const [currentStep, setCurrentStep] = useState(0);

  function set(key, val) { setAnswers(prev => ({ ...prev, [key]: val })); }

  const groupKeys = QUESTION_KEYS_BY_GROUP[currentStep];
  const group = t.stepGroups[currentStep];
  const visibleQ = groupKeys
    .map(key => ({ key, ...QUESTION_META[key], ...t.questions[key] }))
    .filter(q => !q.showIf || q.showIf(answers));

  function next() {
    if (currentStep < 2) setCurrentStep(s => s + 1);
    else onSubmit(answers);
  }
  function prev() {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else onBack();
  }

  const scaleLabel = (key, val) => {
    if (key === 'stress_level') return t.scaleLabels.stress_level[(val ?? 1) - 1];
    return t.scaleLabels.sleep_hours(val ?? 4);
  };

  return (
    <div className="qs-page">
      <HeaderBar lang={lang} onLangToggle={onLangToggle} darkMode={darkMode} onDarkToggle={onDarkToggle} t={t} />

      {/* Progress bar */}
      <div className="qs-progress-wrap">
        <div className="qs-progress-track">
          <div className="qs-progress-fill" style={{ width: `${((currentStep + 1) / 3) * 100}%` }} />
        </div>
        <span className="qs-progress-label">
          {lang === 'FR' ? `Étape ${currentStep + 1} sur 3` : `Step ${currentStep + 1} of 3`}
        </span>
      </div>

      <main className="qs-main">
        <div className="qs-content">
          <StepTabs labels={stepLabels} activeIdx={activeIdx} />

          <div className="qs-step-eyebrow">
            <span className="material-symbols-outlined">{group.stepIcon}</span>
            {group.stepLabel}
          </div>

          <h1 className="qs-title serif">
            {t.helpUsFind}<br />
            <em style={{ color: 'var(--primary)' }}>{t.theCause}</em>
          </h1>
          {severity && <p className="qs-sub">{t.qSub(severity)}</p>}

          <div className="qs-questions">
            {visibleQ.map(q => (
              <div key={q.key} className="qs-question-card">
                <div className="qs-question-top">
                  <span className="material-symbols-outlined qs-q-icon">{q.icon}</span>
                  <div>
                    <div className="qs-q-label">{q.label}</div>
                    <div className="qs-q-hint">{q.hint}</div>
                  </div>
                </div>

                {q.type === 'scale' ? (
                  <div className="qs-scale-wrap">
                    <input
                      type="range" className="qs-range"
                      min={q.min} max={q.max}
                      value={answers[q.key] ?? q.min}
                      onChange={e => set(q.key, Number(e.target.value))}
                    />
                    <div className="qs-scale-display">
                      <span className="material-symbols-outlined">{q.icon}</span>
                      <span className="qs-scale-val">{scaleLabel(q.key, answers[q.key])}</span>
                    </div>
                  </div>
                ) : (
                  <div className="qs-bool-group">
                    {[true, false].map(v => (
                      <label key={String(v)} className={`qs-radio-card ${answers[q.key] === v ? 'qs-radio-card-active' : ''}`}>
                        <input type="radio" name={q.key} hidden checked={answers[q.key] === v} onChange={() => set(q.key, v)} />
                        <span className="material-symbols-outlined qs-radio-icon">
                          {v ? 'check_circle' : 'cancel'}
                        </span>
                        <span className="qs-radio-label">{v ? t.yes : t.no}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="qs-nav">
            <button className="btn btn-ghost qs-back-btn" onClick={prev}>
              <span className="material-symbols-outlined">arrow_back</span>
              {t.back}
            </button>
            <button className="btn btn-primary qs-next-btn" onClick={next}>
              {currentStep < 2 ? (
                <>{t.continue} <span className="material-symbols-outlined">arrow_forward</span></>
              ) : (
                <>{t.generateReport} <span className="material-symbols-outlined">auto_awesome</span></>
              )}
            </button>
          </div>
        </div>

        <aside className="qs-aside">
          <div className="qs-aside-avatar">
            <span className="material-symbols-outlined qs-aside-icon">face</span>
          </div>
          <div>
            <p className="qs-aside-title serif">{t.aiAnalyzing}</p>
            <p className="qs-aside-desc">{t.aiQuote}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
