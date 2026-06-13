import { I18N } from '../i18n';
import './AnalyzingStep.css';

export default function AnalyzingStep({ lang = 'FR' }) {
  const t = I18N[lang];
  return (
    <div className="analyzing-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="analyzing-inner">
        <div className="pulse-ring">
          <div className="pulse-dot" />
        </div>
        <h2 className="serif analyzing-title">
          {t.analyzingTitle}
        </h2>
        <div className="analyzing-steps">
          {t.analyzingSteps.map((s, i) => (
            <div key={i} className="astep" style={{ animationDelay: `${i * 0.7}s` }}>
              <span className="astep-dot" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
