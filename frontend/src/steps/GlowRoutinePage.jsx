import GlowRoutine from './GlowRoutine';
import { I18N } from '../i18n';
import './GlowRoutinePage.css';

const HERO = {
  FR: {
    eyebrow: '— ROUTINE IA',
    title: 'Ta routine beauté,',
    accent: 'personnalisée.',
    sub: 'Sélectionne tes objectifs et ton profil cutané — notre IA choisit les produits les mieux adaptés à ta peau.',
  },
  EN: {
    eyebrow: '— AI ROUTINE',
    title: 'Your beauty routine,',
    accent: 'personalized.',
    sub: 'Select your goals and skin profile — our AI picks the best-matched products for your unique skin.',
  },
};

export default function GlowRoutinePage({ lang = 'FR', onReset }) {
  const h = HERO[lang];
  const t = I18N[lang];

  return (
    <div className="grp-page">
      <nav className="grp-nav">
        <button className="grp-back" onClick={onReset}>
          ← {lang === 'FR' ? 'Accueil' : 'Home'}
        </button>
        <span className="grp-nav-logo">UrSkin</span>
        <span />
      </nav>

      <div className="grp-hero">
        <span className="grp-eyebrow">{h.eyebrow}</span>
        <h1 className="grp-title serif">
          {h.title}<br />
          <em className="grp-accent">{h.accent}</em>
        </h1>
        <p className="grp-sub">{h.sub}</p>
      </div>

      <div className="grp-content">
        <GlowRoutine report={null} lang={lang} standalone />
      </div>
    </div>
  );
}
