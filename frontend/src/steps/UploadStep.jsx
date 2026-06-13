import { useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import './UploadStep.css';

const ease = [0.16, 1, 0.3, 1];

export default function UploadStep({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  /* ── 3D tilt ──────────────────────────────────────────────────────────── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-10, 10]);

  function onMouseMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  /* ── File helpers ─────────────────────────────────────────────────────── */
  function pick(f) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  function clear() { setFile(null); setPreview(null); }

  return (
    <div className="up-page">

      {/* Animated blobs */}
      <div className="up-bg" aria-hidden>
        <div className="up-blob up-blob-1" />
        <div className="up-blob up-blob-2" />
        <div className="up-blob up-blob-3" />
      </div>

      <div className="up-inner">

        {/* ── Hero text ──────────────────────────────────────────────── */}
        <motion.div
          className="up-hero"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <motion.div
            className="analyzer-label"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            — SKIN ANALYSIS
          </motion.div>

          <motion.h1
            className="up-title serif"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
          >
            Votre peau.<br />
            <em className="hero-accent">Comprise.</em>
          </motion.h1>

          <motion.p
            className="up-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease }}
          >
            Une photo — notre IA détecte la condition, cartographie les zones
            et identifie les causes probables.
          </motion.p>

          <motion.div
            className="up-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {['80% accuracy', '6 conditions', '< 1s'].map((b, i) => (
              <motion.span
                key={b}
                className="up-badge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08, ease }}
              >
                {b}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── 3D upload card ─────────────────────────────────────────── */}
        <motion.div
          className="up-card-wrap"
          style={{ rotateX, rotateY, transformPerspective: 900 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
        >
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="drop"
                className={`up-dropzone ${dragging ? 'up-dragging' : ''}`}
                onClick={() => inputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                whileHover={{ boxShadow: '0 24px 64px rgba(196,25,79,.15)' }}
              >
                <motion.div
                  className="up-drop-icon"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15V3m0 0L8.5 6.5M12 3l3.5 3.5"/>
                    <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4"/>
                  </svg>
                </motion.div>
                <p className="up-drop-label">Déposez votre photo ici</p>
                <p className="up-drop-hint">JPG · PNG · ou cliquez pour choisir</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => pick(e.target.files[0])}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                className="up-preview"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <img src={preview} alt="Aperçu" />
                <div className="up-preview-actions">
                  <button className="btn btn-ghost" onClick={clear}>← Changer</button>
                  <button className="btn btn-primary" onClick={() => onUpload(file)}>
                    ✦ Analyser
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
