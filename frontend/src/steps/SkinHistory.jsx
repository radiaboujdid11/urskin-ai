import { motion, AnimatePresence } from 'framer-motion';
import './SkinHistory.css';

const CONDITION_LABELS = {
  Level_0: 'Acné légère',
  Level_1: 'Acné modérée',
  Level_2: 'Acné sévère',
  Eczema: 'Eczéma',
  Rosacea: 'Rosacée',
  Normal: 'Peau saine',
};

const CONDITION_COLOR = {
  Level_0: '#F59E0B',
  Level_1: '#EF4444',
  Level_2: '#991B1B',
  Eczema:  '#8B5CF6',
  Rosacea: '#EC4899',
  Normal:  '#10B981',
};

const CAUSE_LABELS = {
  hormonal: 'Hormonal',
  diet:     'Alimentation',
  oily_skin:'Peau grasse',
  friction: 'Friction',
  products: 'Produits',
  stress:   'Stress',
};

const ease = [0.16, 1, 0.3, 1];

export default function SkinHistory({ onClose }) {
  const raw = JSON.parse(localStorage.getItem('skinHistory') || '[]');
  const entries = [...raw].reverse();

  return (
    <motion.div
      className="sh-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sh-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.45, ease }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sh-header">
          <div>
            <p className="sh-eyebrow">— HISTORIQUE</p>
            <h2 className="sh-title serif">Suivi de peau</h2>
          </div>
          <button className="sh-close" onClick={onClose}>✕</button>
        </div>

        {entries.length === 0 ? (
          <div className="sh-empty">
            <div className="sh-empty-icon">✦</div>
            <p>Aucune analyse enregistrée.</p>
            <p className="sh-empty-sub">Complétez votre première analyse pour voir votre évolution ici.</p>
          </div>
        ) : (
          <div className="sh-list">
            {entries.map((e, i) => {
              const color = CONDITION_COLOR[e.condition] || '#C4194F';
              const topCause = e.causes?.[0];
              return (
                <motion.div
                  key={e.date + i}
                  className="sh-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ease }}
                >
                  <div className="sh-card-accent" style={{ background: color }} />
                  <div className="sh-card-body">
                    <div className="sh-card-top">
                      <span className="sh-badge" style={{ background: color + '20', color }}>
                        {CONDITION_LABELS[e.condition] || e.condition}
                      </span>
                      <span className="sh-date">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="sh-card-stats">
                      <div className="sh-stat">
                        <span className="sh-stat-label">Confiance</span>
                        <div className="sh-bar-wrap">
                          <motion.div
                            className="sh-bar"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${e.confidence}%` }}
                            transition={{ duration: 0.6, delay: i * 0.06 + 0.2, ease }}
                          />
                        </div>
                        <span className="sh-stat-val">{e.confidence}%</span>
                      </div>
                      {topCause && (
                        <div className="sh-cause">
                          <span className="sh-cause-label">Cause principale</span>
                          <span className="sh-cause-val">{CAUSE_LABELS[topCause.cause] || topCause.cause}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {entries.length > 0 && (
          <div className="sh-footer">
            <button
              className="btn btn-ghost"
              onClick={() => { localStorage.removeItem('skinHistory'); onClose(); }}
            >
              Effacer l'historique
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
