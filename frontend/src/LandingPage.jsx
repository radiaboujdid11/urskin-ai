import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I18N } from './i18n';
import { registerUser, loginUser } from './api';
import './LandingPage.css';

const ease = [0.16, 1, 0.3, 1];

const TEXT = {
  FR: {
    badge: 'Dermatologie de précision',
    heroTitle: 'Votre peau, décodée par la',
    heroTitleAccent: 'science.',
    heroSub: 'UrSkin utilise l\'IA médicale pour analyser le profil unique de votre peau à partir d\'une seule photo.',
    uploadCard: 'Importer une photo',
    uploadSub: 'Depuis votre galerie',
    cameraCard: 'Prendre une photo',
    cameraSub: 'Ouvrir la caméra',
    badge1: 'Précision IA 80%',
    badge2: 'Données 100% locales',
    changeBtn: '← Changer',
    analyzeBtn: 'Analyser →',
    dropLabel: 'Déposez votre photo ici',
    dropHint: 'JPG · PNG · ou cliquez pour parcourir',
    cameraError: 'Caméra inaccessible — autorisez l\'accès.',
    retry: 'Réessayer',
    routineOr: 'ou',
    routineBtn: 'Construire ma routine',
    routineSub: 'Sans photo — accès direct',
    feature1Title: 'Standards cliniques',
    feature1Desc: 'Validé sur des benchmarks dermatologiques pour des résultats de niveau professionnel.',
    feature2Title: 'Routine personnalisée',
    feature2Desc: 'Transformez les résultats en une routine soins adaptée à votre profil cutané.',
    privacyTitle: 'Aucun envoi cloud. Jamais.',
    privacyDesc: 'Vos données sont traitées localement. Votre visage, vos données, votre vie privée — garantis.',
    privacyLink: 'Notre politique de données',
    navAbout: 'À propos', navCases: 'Cas', navContact: 'Contact',
    navSignup: "S'inscrire",
    loginBtn: 'Se connecter',
    logoutBtn: 'Déconnexion',
    aboutEyebrow: '— TECHNOLOGIE',
    aboutTitle: 'Cliniquement entraîné.',
    aboutDesc: 'MobileNetV2 fine-tuné sur 5 261 images cliniques. Détection de 6 conditions cutanées en moins d\'une seconde.',
    features: ['Détection de condition cutanée', 'Cartographie des zones du visage', 'Causes classées par score', 'Routine produits personnalisée'],
    casesEyebrow: '— CAS D\'USAGE',
    casesTitle: 'Conditions détectées.',
    statsLabels: ['Accuracy', 'Images d\'entraînement', 'Conditions', 'Par analyse'],
    footerNote: 'Outil informatif — ne remplace pas un avis médical.',
    chatGreeting: 'Bonjour ! Une question sur votre peau ou UrSkin ?',
    chatPlaceholder: 'Votre question…',
    modalLabel: '— REJOINDRE', modalTitle: 'Accès anticipé',
    modalSub: 'Soyez parmi les premiers à accéder aux fonctionnalités Pro.',
    modalBtn: "S'inscrire →",
    modalNote: 'Pas de spam. Désabonnement en 1 clic.',
    successTitle: 'Vous êtes inscrit !',
    successSub: 'On vous préviendra dès que les fonctionnalités Pro sont disponibles.',
    historyBtn: 'Suivi',
  },
  EN: {
    badge: 'Precision Dermatology',
    heroTitle: 'Your skin\'s future, decoded by',
    heroTitleAccent: 'science.',
    heroSub: 'UrSkin uses medical-grade AI to analyze your skin\'s unique profile from a single photo.',
    uploadCard: 'Upload Photo',
    uploadSub: 'Select from gallery',
    cameraCard: 'Take Photo',
    cameraSub: 'Open active camera',
    badge1: '80% Accuracy AI',
    badge2: 'Privacy First — 100% Local',
    changeBtn: '← Change',
    analyzeBtn: 'Analyze →',
    dropLabel: 'Drop your photo here',
    dropHint: 'JPG · PNG · or click to browse',
    cameraError: 'Camera unavailable — allow access.',
    retry: 'Retry',
    routineOr: 'or',
    routineBtn: 'Build my routine',
    routineSub: 'No photo needed — direct access',
    feature1Title: 'Clinical Standards',
    feature1Desc: 'Validated against dermatological benchmarks for professional-level results at your fingertips.',
    feature2Title: 'Personalized Routine',
    feature2Desc: 'Transform analysis results into a step-by-step skincare regimen tailored strictly to you.',
    privacyTitle: 'No cloud uploads. Ever.',
    privacyDesc: 'We process your data locally on your device. Your face, your data, your privacy — guaranteed.',
    privacyLink: 'Read our Data Policy',
    navAbout: 'About', navCases: 'Cases', navContact: 'Contact',
    navSignup: 'Sign up',
    loginBtn: 'Log in',
    logoutBtn: 'Log out',
    aboutEyebrow: '— TECHNOLOGY',
    aboutTitle: 'Clinically trained.',
    aboutDesc: 'MobileNetV2 fine-tuned on 5,261 clinical images. Detection of 6 skin conditions in under a second.',
    features: ['Skin condition detection', 'Facial zone mapping', 'Causes ranked by score', 'Personalized product routine'],
    casesEyebrow: '— USE CASES',
    casesTitle: 'Conditions detected.',
    statsLabels: ['Accuracy', 'Training images', 'Conditions', 'Per analysis'],
    footerNote: 'Informational tool — not a substitute for medical advice.',
    chatGreeting: 'Hello! Any questions about your skin or UrSkin?',
    chatPlaceholder: 'Your question…',
    modalLabel: '— JOIN', modalTitle: 'Early access',
    modalSub: 'Be among the first to access Pro features.',
    modalBtn: 'Sign up →',
    modalNote: 'No spam. Unsubscribe in one click.',
    successTitle: "You're in!",
    successSub: "We'll notify you as soon as Pro features are available.",
    historyBtn: 'History',
  },
};

const FAQ = {
  FR: [
    { q: "Qu'analyse UrSkin ?", a: "Notre IA détecte 6 conditions : acné légère, modérée, sévère, eczéma, rosacée et peau saine." },
    { q: "Mes photos sont stockées ?", a: "Non. Les images sont traitées en temps réel et jamais conservées." },
    { q: "Quelle précision ?", a: "80.18% d'accuracy, F1-score 0.80, mesuré sur 797 images de test." },
    { q: "Ça remplace un dermatologue ?", a: "Non — UrSkin est un outil d'aide. Pour tout diagnostic, consultez un dermatologue." },
  ],
  EN: [
    { q: "What does UrSkin analyze?", a: "Our AI detects 6 conditions: mild, moderate and severe acne, eczema, rosacea and healthy skin." },
    { q: "Are my photos stored?", a: "No. Images are processed in real time and never saved." },
    { q: "How accurate is it?", a: "80.18% accuracy, F1-score 0.80, measured on 797 test images." },
    { q: "Does it replace a dermatologist?", a: "No — UrSkin is an informational tool. For any diagnosis, consult a dermatologist." },
  ],
};

const CASES = {
  FR: [
    { num: '01', label: 'Acné hormonale', tag: 'Acné modérée', zone: 'Mâchoire & Menton', cause: 'Cause principale : Hormonale' },
    { num: '02', label: 'Eczéma détecté', tag: 'Eczéma', zone: 'Joues', cause: 'Cause principale : Cosmétiques' },
    { num: '03', label: 'Peau saine', tag: 'Normale', zone: 'Toutes zones', cause: 'Aucune intervention nécessaire' },
  ],
  EN: [
    { num: '01', label: 'Hormonal acne', tag: 'Moderate acne', zone: 'Jaw & Chin', cause: 'Main cause: Hormonal' },
    { num: '02', label: 'Eczema detected', tag: 'Eczema', zone: 'Cheeks', cause: 'Main cause: Cosmetics' },
    { num: '03', label: 'Healthy skin', tag: 'Normal', zone: 'All zones', cause: 'No intervention needed' },
  ],
};

const STAT_VALUES = ['80%', '5 261', '6', '<1s'];

/* ── Upload / Camera card ─────────────────────────────────────────────────── */
function UploadCard({ onUpload, t }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState(null); // null | 'upload' | 'camera'
  const [dragging, setDragging] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const inputRef  = useRef();
  const videoRef  = useRef();
  const streamRef = useRef(null);

  function pick(f) { if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); setMode('upload'); }
  function clear() { setFile(null); setPreview(null); setMode(null); }

  function stopStream() {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false); setCameraError(null);
  }

  async function openCamera() {
    setCameraError(null); setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch { setCameraError(t.cameraError); }
  }

  useEffect(() => {
    if (mode === 'camera') openCamera();
    else stopStream();
  }, [mode]); // eslint-disable-line
  useEffect(() => () => stopStream(), []);

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      stopStream();
      setFile(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
      setPreview(URL.createObjectURL(blob));
      setMode('upload');
    }, 'image/jpeg', 0.95);
  }

  /* Default state: two action cards */
  if (!mode && !preview) {
    return (
      <div className="uc-action-cards">
        <motion.button
          className="uc-action-card"
          whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(132,81,69,.14)' }}
          onClick={() => { setMode('upload'); setTimeout(() => inputRef.current?.click(), 50); }}
        >
          <div className="uc-action-icon uc-action-icon-primary">
            <span className="material-symbols-outlined">cloud_upload</span>
          </div>
          <span className="uc-action-label">{t.uploadCard}</span>
          <span className="uc-action-sub">{t.uploadSub}</span>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => pick(e.target.files[0])} />
        </motion.button>
        <motion.button
          className="uc-action-card"
          whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(77,99,95,.14)' }}
          onClick={() => setMode('camera')}
        >
          <div className="uc-action-icon uc-action-icon-secondary">
            <span className="material-symbols-outlined">photo_camera</span>
          </div>
          <span className="uc-action-label">{t.cameraCard}</span>
          <span className="uc-action-sub">{t.cameraSub}</span>
        </motion.button>
      </div>
    );
  }

  /* Preview state */
  if (preview) {
    return (
      <motion.div className="uc-preview-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <img src={preview} alt="Preview" className="uc-preview-img" />
        <div className="uc-preview-actions">
          <button className="btn btn-ghost" onClick={clear}>{t.changeBtn}</button>
          <button className="btn btn-primary" onClick={() => onUpload(file)}>{t.analyzeBtn}</button>
        </div>
      </motion.div>
    );
  }

  /* Upload drop zone */
  if (mode === 'upload') {
    return (
      <motion.div
        className={`uc-drop ${dragging ? 'dragging' : ''}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
      >
        <motion.span className="material-symbols-outlined uc-drop-icon"
          animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          upload_file
        </motion.span>
        <p className="uc-drop-label">{t.dropLabel}</p>
        <p className="uc-drop-hint">{t.dropHint}</p>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => pick(e.target.files[0])} />
        <button className="btn btn-ghost uc-back-btn" onClick={e => { e.stopPropagation(); clear(); }}>{t.changeBtn}</button>
      </motion.div>
    );
  }

  /* Camera view — video always stays in DOM so ref is always valid */
  return (
    <div className="uc-camera-wrap">
      <video ref={videoRef} className="uc-video" autoPlay playsInline muted
        style={{ display: cameraError ? 'none' : 'block' }}
        onCanPlay={() => setCameraReady(true)} />

      {cameraError && (
        <div className="uc-cam-error">
          <span className="material-symbols-outlined">videocam_off</span>
          <p>{cameraError}</p>
          <button className="btn btn-ghost" onClick={openCamera}>{t.retry}</button>
          <button className="btn btn-ghost uc-back-btn" onClick={clear}>{t.changeBtn}</button>
        </div>
      )}
      {!cameraError && !cameraReady && <div className="uc-cam-loading"><div className="uc-spinner" /></div>}
      {!cameraError && cameraReady && (
        <div className="uc-cam-controls">
          <button className="uc-capture" onClick={capture}><div className="uc-capture-inner" /></button>
        </div>
      )}
      <button className="uc-cam-back" onClick={clear}>{t.changeBtn}</button>
    </div>
  );
}

/* ── Floating chatbot ─────────────────────────────────────────────────────── */
function FloatingChat({ lang, t }) {
  const faq = FAQ[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef();

  useEffect(() => { setMessages([{ from: 'bot', text: t.chatGreeting }]); }, [lang, t.chatGreeting]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function findAnswer(q) {
    const lower = q.toLowerCase();
    for (const item of faq) {
      const kws = item.q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (kws.some(kw => lower.includes(kw))) return item.a;
    }
    return lang === 'FR'
      ? "Analysez votre peau gratuitement — c'est instantané !"
      : "Analyze your skin for free — it's instant!";
  }

  function send(text) {
    const msg = text.trim(); if (!msg) return;
    setMessages(m => [...m, { from: 'user', text: msg }]);
    setInput('');
    setTimeout(() => setMessages(m => [...m, { from: 'bot', text: findAnswer(msg) }]), 500);
  }

  return (
    <div className="fc-wrap">
      <AnimatePresence>
        {open && (
          <motion.div className="fc-panel"
            initial={{ opacity: 0, y: 20, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: .95 }} transition={{ duration: .25, ease }}>
            <div className="fc-header">
              <div>
                <p className="fc-header-name">UrSkin AI</p>
                <p className="fc-header-status">Online</p>
              </div>
              <button className="fc-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="fc-messages">
              {messages.map((m, i) => (
                <motion.div key={i} className={`fc-bubble fc-${m.from}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: .2 }}>
                  {m.text}
                </motion.div>
              ))}
              {messages.length <= 1 && faq.slice(0, 3).map(f => (
                <button key={f.q} className="fc-pill" onClick={() => send(f.q)}>{f.q}</button>
              ))}
              <div ref={endRef} />
            </div>
            <div className="fc-input-row">
              <input className="fc-input" placeholder={t.chatPlaceholder}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)} />
              <button className="fc-send" onClick={() => send(input)}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button className="fc-trigger" onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: .93 }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: .15 }} className="material-symbols-outlined">close</motion.span>
            : <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: .15 }} className="material-symbols-outlined">chat</motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

/* ── Auth modal (Register + Login tabs) ───────────────────────────────────── */
const AUTH_COPY = {
  FR: {
    registerTab: "S'inscrire", loginTab: 'Se connecter',
    nameLabel: 'Prénom', emailLabel: 'Email',
    passLabel: 'Mot de passe', confirmLabel: 'Confirmer',
    skinLabel: 'Type de peau',
    registerBtn: 'Créer mon compte', loginBtn: 'Se connecter',
    sending: 'Chargement…',
    passShort: 'Mot de passe trop court (6 car. min).',
    passNoMatch: 'Les mots de passe ne correspondent pas.',
    welcomeBack: 'Bon retour,',
    welcomeNew: 'Bienvenue,',
    welcomeSub: 'Votre compte est prêt.',
  },
  EN: {
    registerTab: 'Sign up', loginTab: 'Log in',
    nameLabel: 'First name', emailLabel: 'Email',
    passLabel: 'Password', confirmLabel: 'Confirm',
    skinLabel: 'Skin type',
    registerBtn: 'Create account', loginBtn: 'Log in',
    sending: 'Loading…',
    passShort: 'Password must be at least 6 characters.',
    passNoMatch: 'Passwords do not match.',
    welcomeBack: 'Welcome back,',
    welcomeNew: 'Welcome,',
    welcomeSub: 'Your account is ready.',
  },
};

function AuthModal({ onClose, lang = 'FR', onLogin }) {
  const c = AUTH_COPY[lang];
  const skinTypes = I18N[lang].skinTypes;
  const [tab,     setTab]     = useState('register'); // 'register' | 'login'
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '', skin: 'combination' });
  const [done,    setDone]    = useState(null);   // null | { name }
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function field(key) {
    return { value: form[key], onChange: e => { setForm(f => ({ ...f, [key]: e.target.value })); setError(''); } };
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password.length < 6)   { setError(c.passShort);   return; }
    if (form.password !== form.confirm) { setError(c.passNoMatch); return; }
    setLoading(true); setError('');
    try {
      const data = await registerUser({ name: form.name, email: form.email, password: form.password, skin: form.skin });
      onLogin({ name: data.name, email: data.email, skin: data.skin, token: data.token });
      setDone({ name: data.name, isNew: true });
    } catch (err) {
      setError(err?.response?.data?.detail || (lang === 'FR' ? 'Erreur serveur.' : 'Server error.'));
    } finally { setLoading(false); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await loginUser({ email: form.email, password: form.password });
      onLogin({ name: data.name, email: data.email, skin: data.skin, token: data.token });
      setDone({ name: data.name, isNew: false });
    } catch (err) {
      setError(err?.response?.data?.detail || (lang === 'FR' ? 'Email ou mot de passe incorrect.' : 'Incorrect email or password.'));
    } finally { setLoading(false); }
  }

  return (
    <motion.div className="mo-overlay" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mo-box" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: .95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: .3, ease }}>
        <button className="mo-close" onClick={onClose}>✕</button>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" className="mo-success"
              initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .3, ease }}>
              <div className="mo-check"><span className="material-symbols-outlined">check_circle</span></div>
              <h2 className="mo-title">{done.isNew ? c.welcomeNew : c.welcomeBack} {done.name} !</h2>
              <p className="mo-sub">{c.welcomeSub}</p>
              <button className="btn btn-primary mo-btn" onClick={onClose} style={{ marginTop: 8 }}>
                {lang === 'FR' ? 'Continuer →' : 'Continue →'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Tabs */}
              <div className="mo-tabs">
                <button className={`mo-tab ${tab === 'register' ? 'mo-tab-active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
                  {c.registerTab}
                </button>
                <button className={`mo-tab ${tab === 'login' ? 'mo-tab-active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
                  {c.loginTab}
                </button>
              </div>

              {/* Register form */}
              {tab === 'register' && (
                <form className="mo-form" onSubmit={handleRegister}>
                  <div className="mo-row">
                    <div className="mo-field">
                      <label>{c.nameLabel}</label>
                      <input required placeholder="Sophie" {...field('name')} />
                    </div>
                    <div className="mo-field">
                      <label>{c.emailLabel}</label>
                      <input required type="email" placeholder="sophie@email.com" {...field('email')} />
                    </div>
                  </div>
                  <div className="mo-row">
                    <div className="mo-field">
                      <label>{c.passLabel}</label>
                      <input required type="password" placeholder="••••••" {...field('password')} />
                    </div>
                    <div className="mo-field">
                      <label>{c.confirmLabel}</label>
                      <input required type="password" placeholder="••••••" {...field('confirm')} />
                    </div>
                  </div>
                  <div className="mo-field">
                    <label>{c.skinLabel}</label>
                    <select {...field('skin')}>
                      {skinTypes.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                    </select>
                  </div>
                  {error && <p className="mo-error">{error}</p>}
                  <button type="submit" className="btn btn-primary mo-btn" disabled={loading}>
                    {loading ? c.sending : c.registerBtn}
                  </button>
                </form>
              )}

              {/* Login form */}
              {tab === 'login' && (
                <form className="mo-form" onSubmit={handleLogin}>
                  <div className="mo-field">
                    <label>{c.emailLabel}</label>
                    <input required type="email" placeholder="sophie@email.com" {...field('email')} />
                  </div>
                  <div className="mo-field">
                    <label>{c.passLabel}</label>
                    <input required type="password" placeholder="••••••" {...field('password')} />
                  </div>
                  {error && <p className="mo-error">{error}</p>}
                  <button type="submit" className="btn btn-primary mo-btn" disabled={loading}>
                    {loading ? c.sending : c.loginBtn}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Landing page ─────────────────────────────────────────────────────────── */
export default function LandingPage({ onUpload, onGlowRoutine, historyCount, onShowHistory, lang = 'FR', onLangToggle, darkMode, onDarkToggle, user, onLogin, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroContentRef = useRef();
  const t = TEXT[lang];
  const cases = CASES[lang];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.lp-hero');
    const content = heroContentRef.current;
    if (!hero || !content) return;
    const handle = (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      content.style.transform = `perspective(1400px) rotateX(${y * -7}deg) rotateY(${x * 7}deg) translateZ(10px)`;
    };
    const reset = () => { content.style.transform = ''; };
    hero.addEventListener('mousemove', handle);
    hero.addEventListener('mouseleave', reset);
    return () => { hero.removeEventListener('mousemove', handle); hero.removeEventListener('mouseleave', reset); };
  }, []);

  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

  return (
    <div className="lp" id="top">

      {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
      <motion.header className={`lp-header ${scrolled ? 'lp-header-solid' : ''}`}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5, ease }}>
        <div className="lp-logo">
          <span className="material-symbols-outlined">spa</span>
          UrSkin
        </div>
        <nav className="lp-nav">
          {[['about', t.navAbout], ['cases', t.navCases], ['contact', t.navContact]].map(([id, label]) => (
            <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
          ))}
        </nav>
        <div className="lp-header-right">
          <button className="lp-lang-btn" onClick={onLangToggle}>
            {lang === 'FR' ? 'FR/EN' : 'EN/FR'}
          </button>
          <button className="lp-lang-btn" onClick={onDarkToggle} title="Toggle dark mode" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {historyCount > 0 && (
            <button className="btn btn-ghost" onClick={onShowHistory}>
              {t.historyBtn} <span className="lp-badge">{historyCount}</span>
            </button>
          )}
          {user ? (
            <div className="lp-user-nav">
              <span className="lp-user-avatar">{user.name[0].toUpperCase()}</span>
              <span className="lp-user-name">{user.name}</span>
              <button className="lp-lang-btn" onClick={onLogout}>{t.logoutBtn}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="lp-lang-btn" onClick={() => setShowModal(true)}>{t.loginBtn}</button>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t.navSignup}</button>
            </div>
          )}
        </div>
      </motion.header>

      {/* ══ HERO ═════════════════════════════════════════════════════════ */}
      <section className="lp-hero" id="analyser">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
        </div>
        <div className="lp-hero-split">
          <motion.div className="lp-hero-content" ref={heroContentRef}
            style={{ transition: 'transform 0.12s ease-out' }}
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: .7, ease }}>
            <span className="lp-hero-badge">
              <span className="material-symbols-outlined">verified</span>
              {t.badge}
            </span>
            <h1 className="lp-hero-title serif">
              {t.heroTitle}<br />
              <em className="lp-primary-text">{t.heroTitleAccent}</em>
            </h1>
            <p className="lp-hero-sub">{t.heroSub}</p>

            <UploadCard onUpload={onUpload} t={t} />

            <div className="lp-routine-alt">
              <div className="lp-or-divider"><span>{t.routineOr}</span></div>
              <button className="lp-routine-card" onClick={onGlowRoutine}>
                <img src="/routine-flatlay.jpg" alt="" className="lp-routine-card-img" />
                <div className="lp-routine-card-overlay" />
                <div className="lp-routine-card-content">
                  <span className="lp-routine-card-tag">
                    <span className="material-symbols-outlined">spa</span>
                    {t.routineSub}
                  </span>
                  <span className="lp-routine-card-title">{t.routineBtn}</span>
                  <span className="lp-routine-card-arrow">→</span>
                </div>
              </button>
            </div>

            <div className="lp-trust-badges">
              <div className="lp-trust-badge">
                <span className="material-symbols-outlined">verified</span>
                <span>{t.badge1}</span>
              </div>
              <div className="lp-trust-badge">
                <span className="material-symbols-outlined">lock</span>
                <span>{t.badge2}</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="lp-hero-visual"
            initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: .85, ease, delay: .15 }}>
            <div className="lp-hero-img-frame">
              <img src="/hero-model.jpg" alt="" className="lp-hero-model-img" />
              <div className="lp-hero-img-badge lp-hero-img-badge-1">
                <span className="material-symbols-outlined">auto_awesome</span>
                AI Analysis
              </div>
              <div className="lp-hero-img-badge lp-hero-img-badge-2">
                <span className="material-symbols-outlined">spa</span>
                Glow Routine
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BENTO FEATURES ═══════════════════════════════════════════════ */}
      <motion.section className="lp-bento" id="about"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }} transition={{ duration: .65, ease }}>
        <div className="lp-bento-grid">
          {/* Large feature card */}
          <div className="lp-bento-large">
            <img src="/products-gold.jpg" alt="" className="lp-bento-large-img" />
            <div className="lp-bento-large-overlay">
              <h3 className="lp-bento-large-title serif">Deep Texture Analysis</h3>
              <p className="lp-bento-large-desc">Our algorithm maps over 200 distinct facial landmarks to identify pores, hydration levels, and fine lines.</p>
            </div>
          </div>

          {/* Feature card 1 */}
          <div className="lp-bento-sm">
            <span className="material-symbols-outlined lp-bento-icon">biotech</span>
            <h4 className="lp-bento-sm-title">{t.feature1Title}</h4>
            <p className="lp-bento-sm-desc">{t.feature1Desc}</p>
          </div>

          {/* Feature card 2 */}
          <div className="lp-bento-sm lp-bento-sm-tinted">
            <span className="material-symbols-outlined lp-bento-icon">reorder</span>
            <h4 className="lp-bento-sm-title">{t.feature2Title}</h4>
            <p className="lp-bento-sm-desc">{t.feature2Desc}</p>
          </div>

          {/* Privacy card */}
          <div className="lp-bento-privacy">
            <div className="lp-bento-privacy-text">
              <h4 className="lp-bento-privacy-title">{t.privacyTitle}</h4>
              <p className="lp-bento-privacy-desc">{t.privacyDesc}</p>
              <button className="lp-bento-privacy-link">
                {t.privacyLink}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <div className="lp-bento-privacy-icon">
              <span className="material-symbols-outlined">shield_person</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══ ABOUT ════════════════════════════════════════════════════════ */}
      <motion.section className="lp-about"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: .65, ease }}>
        <div className="lp-about-grid">
          <div>
            <p className="analyzer-label">{t.aboutEyebrow}</p>
            <h2 className="lp-section-title serif">{t.aboutTitle}</h2>
            <p className="lp-about-desc">{t.aboutDesc}</p>
          </div>
          <div className="lp-features">
            {t.features.map((feat, i) => (
              <div key={feat} className="lp-feat-row">
                <span className="material-symbols-outlined lp-feat-icon">
                  {['search', 'map', 'analytics', 'spa'][i]}
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
          <div className="lp-about-img-wrap">
            <img src="/products-pastel.jpg" alt="" className="lp-about-img" />
          </div>
        </div>
      </motion.section>

      {/* ══ CASES ════════════════════════════════════════════════════════ */}
      <section className="lp-cases" id="cases">
        <motion.div className="lp-cases-header"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: .6, ease }}>
          <p className="analyzer-label">{t.casesEyebrow}</p>
          <h2 className="lp-section-title serif">{t.casesTitle}</h2>
        </motion.div>
        <div className="lp-cases-grid">
          {cases.map((c, i) => (
            <motion.div key={c.num} className="lp-case-card"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * .1, duration: .5, ease }}
              whileHover={{ y: -4 }}>
              <span className="lp-case-num">{c.num}</span>
              <div className="lp-case-divider" />
              <h3 className="lp-case-label">{c.label}</h3>
              <div className="lp-case-tag">{c.tag}</div>
              <p className="lp-case-zone">{c.zone}</p>
              <p className="lp-case-cause lp-primary-text">{c.cause}</p>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="lp-footer" id="contact">
        <div className="lp-footer-top">
          <div className="lp-logo">
            <span className="material-symbols-outlined">spa</span>
            UrSkin
          </div>
          <div className="lp-footer-links">
            {[['about', t.navAbout], ['cases', t.navCases], ['contact', t.navContact]].map(([id, label]) => (
              <button key={id} className="lp-footer-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t.navSignup}</button>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 UrSkin AI</span>
          <span className="lp-footer-note">{t.footerNote}</span>
        </div>
      </footer>

      <FloatingChat lang={lang} t={t} />


      <AnimatePresence>
        {showModal && (
          <AuthModal
            onClose={() => setShowModal(false)}
            lang={lang}
            onLogin={(userData) => { onLogin(userData); setShowModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
