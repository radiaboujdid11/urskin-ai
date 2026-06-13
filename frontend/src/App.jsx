import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './LandingPage';
import AnalyzingStep from './steps/AnalyzingStep';
import ResultStep from './steps/ResultStep';
import QuestionnaireStep from './steps/QuestionnaireStep';
import ReportStep from './steps/ReportStep';
import GlowRoutinePage from './steps/GlowRoutinePage';
import SkinHistory from './steps/SkinHistory';
import { analyzeImage } from './api';
import { I18N } from './i18n';
import './App.css';

const STEPS = { UPLOAD: 0, ANALYZING: 1, RESULT: 2, QUESTIONNAIRE: 3, REPORT: 4, GLOW: 5 };

const STEP_LABELS = {
  FR: [
    { num: 1, label: 'Capture' },
    { num: 2, label: 'Résultats' },
    { num: 3, label: 'Votre profil' },
    { num: 4, label: 'Rapport' },
  ],
  EN: [
    { num: 1, label: 'Capture' },
    { num: 2, label: 'Results' },
    { num: 3, label: 'About you' },
    { num: 4, label: 'Report' },
  ],
};

function stepIndex(step) {
  if (step === STEPS.UPLOAD || step === STEPS.ANALYZING) return 0;
  if (step === STEPS.RESULT) return 1;
  if (step === STEPS.QUESTIONNAIRE) return 2;
  return 3;
}

function saveToHistory(result) {
  const entry = {
    date: new Date().toISOString(),
    condition: result.condition,
    confidence: Math.round(result.confidence),
    causes: result.causes?.slice(0, 3) || [],
  };
  const existing = JSON.parse(localStorage.getItem('skinHistory') || '[]');
  existing.push(entry);
  localStorage.setItem('skinHistory', JSON.stringify(existing.slice(-50)));
}

export default function App() {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('urskin_user') || 'null'); }
    catch { return null; }
  });

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem('urskin_user', JSON.stringify(userData));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('urskin_user');
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Global lang + dark mode ─────────────────────────────────────────────
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'FR');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  function toggleLang() { setLang(l => l === 'FR' ? 'EN' : 'FR'); }
  function toggleDark() { setDarkMode(d => !d); }

  const t = I18N[lang];
  const stepLabels = STEP_LABELS[lang];
  // ────────────────────────────────────────────────────────────────────────

  async function handleUpload(f) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setStep(STEPS.ANALYZING);
    try {
      const result = await analyzeImage(f, {});
      if (result.warning && /visage|face/i.test(result.warning)) {
        setError(lang === 'FR'
          ? 'Aucun visage détecté. Assurez-vous que votre visage est bien visible et centré.'
          : 'No face detected. Make sure your face is clearly visible and centered.');
        setFile(null); setPreview(null); setStep(STEPS.UPLOAD);
        return;
      }
      setPrediction(result);
      setStep(STEPS.RESULT);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || (lang === 'FR' ? 'Erreur serveur.' : 'Server error.'));
      setStep(STEPS.UPLOAD);
    }
  }

  async function handleQuestionnaire(answers) {
    setStep(STEPS.ANALYZING);
    try {
      const result = await analyzeImage(file, answers);
      setReport(result);
      saveToHistory(result);
      setStep(STEPS.REPORT);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || (lang === 'FR' ? 'Erreur serveur.' : 'Server error.'));
      setStep(STEPS.RESULT);
    }
  }

  function reset() {
    setStep(STEPS.UPLOAD); setFile(null); setPreview(null);
    setPrediction(null); setReport(null); setError(null);
  }

  const activeIdx = stepIndex(step);
  const historyCount = JSON.parse(localStorage.getItem('skinHistory') || '[]').length;

  return (
    <div className="app">
      {/* Nav shown only on non-landing steps */}
      {step !== STEPS.UPLOAD && step !== STEPS.GLOW && (
        <nav className="nav">
          <a className="nav-logo" href="#" onClick={e => { e.preventDefault(); reset(); }}>
            UrSkin
          </a>
          <div className="nav-actions">
            {historyCount > 0 && (
              <button className="btn btn-ghost nav-history" onClick={() => setShowHistory(true)}>
                {t.history} <span className="nav-history-badge">{historyCount}</span>
              </button>
            )}
            <button className="btn btn-ghost" onClick={toggleLang}>{t.langToggle}</button>
            <button className="btn btn-ghost nav-dark-btn" onClick={toggleDark} title="Toggle dark mode">
              <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {user && (
              <span className="nav-user">
                <span className="nav-user-avatar">{user.name[0].toUpperCase()}</span>
                <span className="nav-user-name">{user.name}</span>
              </span>
            )}
            <button className="btn btn-ghost nav-reset" onClick={reset}>{t.newAnalysis}</button>
          </div>
        </nav>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="main">
        {step === STEPS.UPLOAD && (
          <LandingPage
            onUpload={handleUpload}
            onGlowRoutine={() => setStep(STEPS.GLOW)}
            historyCount={historyCount}
            onShowHistory={() => setShowHistory(true)}
            lang={lang}
            onLangToggle={toggleLang}
            darkMode={darkMode}
            onDarkToggle={toggleDark}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        )}

        {step === STEPS.ANALYZING && <AnalyzingStep lang={lang} />}

        {step === STEPS.RESULT && (
          <ResultStep
            prediction={prediction}
            preview={preview}
            activeIdx={activeIdx}
            stepLabels={stepLabels}
            lang={lang}
            onLangToggle={toggleLang}
            darkMode={darkMode}
            onDarkToggle={toggleDark}
            onContinue={() => setStep(STEPS.QUESTIONNAIRE)}
            onReset={reset}
          />
        )}

        {step === STEPS.QUESTIONNAIRE && (
          <QuestionnaireStep
            prediction={prediction}
            activeIdx={activeIdx}
            stepLabels={stepLabels}
            lang={lang}
            onLangToggle={toggleLang}
            darkMode={darkMode}
            onDarkToggle={toggleDark}
            onSubmit={handleQuestionnaire}
            onBack={() => setStep(STEPS.RESULT)}
          />
        )}

        {step === STEPS.REPORT && (
          <ReportStep
            report={report}
            preview={preview}
            activeIdx={activeIdx}
            stepLabels={stepLabels}
            lang={lang}
            onLangToggle={toggleLang}
            darkMode={darkMode}
            onDarkToggle={toggleDark}
            onReset={reset}
          />
        )}
        {step === STEPS.GLOW && (
          <GlowRoutinePage lang={lang} onReset={reset} />
        )}
      </main>

      <AnimatePresence>
        {showHistory && <SkinHistory onClose={() => setShowHistory(false)} />}
      </AnimatePresence>
    </div>
  );
}
