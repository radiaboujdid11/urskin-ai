import { useState } from 'react';
import { fetchGlowRoutine } from '../api';
import { I18N } from '../i18n';
import './GlowRoutine.css';

export default function GlowRoutine({ report, lang = 'FR' }) {
  const t = I18N[lang];
  const [step,        setStep]        = useState(0); // 0=goals, 1=profile
  const [goals,       setGoals]       = useState([]);
  const [skinType,    setSkinType]    = useState('combination');
  const [budget,      setBudget]      = useState('low');
  const [sensitivity, setSensitivity] = useState('low');
  const [climate,     setClimate]     = useState('hot');
  const [experience,  setExperience]  = useState('beginner');
  const [routine,     setRoutine]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const causes = (report?.causes || []).slice(0, 3).map(c => c.cause);

  function toggleGoal(value) {
    setGoals(g => g.includes(value) ? g.filter(v => v !== value) : [...g, value]);
  }

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGlowRoutine({
        skinType, budget,
        condition: report?.condition || '',
        causes, sensitivity, climate, experience, goals,
      });
      setRoutine(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || t.serverError);
    } finally {
      setLoading(false);
    }
  }

  function resetProfile() { setRoutine(null); setError(''); }
  function resetAll()     { setRoutine(null); setError(''); setStep(0); setGoals([]); }

  return (
    <div className="glow-section">
      <div className="glow-header">
        <span className="glow-header-icon">✨</span>
        <div>
          <h3 className="glow-title serif">{t.glowTitle}</h3>
          <p className="glow-sub">{t.glowDesc}</p>
        </div>
      </div>

      <div className="glow-philosophy">
        <span className="glow-philosophy-icon">🌱</span>
        <p>{t.glowPhilosophy}</p>
      </div>

      {/* ── STEP 0: GOALS ─────────────────────────────────────────────── */}
      {!routine && step === 0 && (
        <div className="glow-form">
          <div className="glow-step-header">
            <div className="glow-step-badge">1 / 2</div>
            <div>
              <div className="glow-field-label">{t.goalsTitle}</div>
              <p className="glow-step-sub">{t.goalsSub}</p>
            </div>
          </div>

          <div className="glow-goals-grid">
            {t.goals.map(g => (
              <button key={g.value} type="button"
                className={`glow-goal-chip ${goals.includes(g.value) ? 'glow-goal-chip-active' : ''}`}
                onClick={() => toggleGoal(g.value)}>
                <span className="glow-goal-emoji">{g.emoji}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>

          <button className="btn btn-primary" type="button"
            onClick={() => setStep(1)}
            disabled={goals.length === 0}>
            {t.goalsNext}
          </button>
        </div>
      )}

      {/* ── STEP 1: PROFILE ───────────────────────────────────────────── */}
      {!routine && step === 1 && (
        <div className="glow-form">
          <div className="glow-step-header">
            <div className="glow-step-badge">2 / 2</div>
            <div>
              <div className="glow-field-label">{t.profileTitle}</div>
              <p className="glow-step-sub">{t.profileSub}</p>
            </div>
          </div>

          {/* Selected goals summary */}
          <div className="glow-goals-summary">
            {goals.map(v => {
              const g = t.goals.find(x => x.value === v);
              return g ? (
                <span key={v} className="glow-goal-tag">{g.emoji} {g.label}</span>
              ) : null;
            })}
          </div>

          <div className="glow-field">
            <div className="glow-field-label">{t.skinTypeLabel}</div>
            <div className="glow-options">
              {t.skinTypes.map(s => (
                <button key={s.value} type="button"
                  className={`glow-opt ${skinType === s.value ? 'glow-opt-active' : ''}`}
                  onClick={() => setSkinType(s.value)}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glow-field">
            <div className="glow-field-label">{t.budgetLabel}</div>
            <div className="glow-options">
              {t.budgets.map(b => (
                <button key={b.value} type="button"
                  className={`glow-opt ${budget === b.value ? 'glow-opt-active' : ''}`}
                  onClick={() => setBudget(b.value)}>
                  {b.label} <span className="glow-opt-sub">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glow-field">
            <div className="glow-field-label">{t.sensitivityLabel}</div>
            <div className="glow-options">
              {t.sensitivities.map(s => (
                <button key={s.value} type="button"
                  className={`glow-opt ${sensitivity === s.value ? 'glow-opt-active' : ''}`}
                  onClick={() => setSensitivity(s.value)}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glow-field">
            <div className="glow-field-label">{t.climateLabel}</div>
            <div className="glow-options">
              {t.climates.map(c => (
                <button key={c.value} type="button"
                  className={`glow-opt ${climate === c.value ? 'glow-opt-active' : ''}`}
                  onClick={() => setClimate(c.value)}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glow-field">
            <div className="glow-field-label">{t.experienceLabel}</div>
            <div className="glow-options">
              {t.experiences.map(e => (
                <button key={e.value} type="button"
                  className={`glow-opt ${experience === e.value ? 'glow-opt-active' : ''}`}
                  onClick={() => setExperience(e.value)}>
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="glow-error-inline">{error}</p>}

          <div className="glow-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              ← {t.back}
            </button>
            <button className="btn btn-primary" type="button" onClick={generate} disabled={loading}>
              {loading ? t.glowGenerating : t.glowGenerate}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────────── */}
      {routine && (
        <div className="glow-result">
          <div className="glow-steps">
            {routine.routine.map((step, i) => (
              <div key={step.step} className="glow-step-card">
                <div className="glow-step-left">
                  <span className="glow-step-emoji">{step.emoji}</span>
                  <span className="glow-step-num">{i + 1}</span>
                </div>
                <div className="glow-step-body">
                  <div className="glow-step-meta">
                    <span className="glow-step-label">{step.label}</span>
                    <span className="glow-step-timing">{step.timing}</span>
                  </div>
                  <div className="glow-product-name">{step.product.brand} — {step.product.name}</div>
                  <div className="glow-product-why">{step.product.why}</div>
                  <div className="glow-product-price">{step.product.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="glow-result-footer">
            <p className="glow-result-note">{t.glowTip}</p>
            <div className="glow-form-actions">
              <button type="button" className="btn btn-ghost" onClick={resetAll}>
                ← {t.back}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetProfile}>
                {t.glowModify}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
