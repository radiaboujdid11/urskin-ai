export default function StepTabs({ labels, activeIdx }) {
  return (
    <div className="step-tabs">
      {labels.map((l, i) => (
        <div key={l.label} className={`step-tab ${i === activeIdx ? 'active' : i < activeIdx ? 'done' : 'pending'}`}>
          <span className="step-tab-num">{i < activeIdx ? '✓' : l.num}</span>
          {l.label}
        </div>
      ))}
    </div>
  );
}
