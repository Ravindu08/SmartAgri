import { useCallback, useEffect, useRef, useState } from 'react';

function getVisibleTarget(target) {
  const els = document.querySelectorAll(`[data-tour="${target}"]`);
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

// Shared spotlight-tour engine, reused for every tour instance in the app.
// Holds no copy of its own — steps/labels are passed in already localized,
// so switching language mid-tour just re-renders the same step with new text.
export default function SpotlightTour({ steps, open, onClose, storageKey, labels }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  const step = open ? steps[stepIndex] : null;

  // Marked "seen" as soon as the tour is shown, not only when it closes
  // cleanly — a step can target a real nav link, and clicking through to
  // navigate unmounts this component before close() would ever run.
  useEffect(() => {
    if (!open) return;
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
  }, [open, storageKey]);

  const close = useCallback(() => {
    setStepIndex(0);
    onClose();
  }, [onClose]);

  const recompute = useCallback(() => {
    if (!step) { setRect(null); return; }
    const el = getVisibleTarget(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!open || !step) return;
    const el = getVisibleTarget(step.target);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const raf = requestAnimationFrame(recompute);
    const settled = setTimeout(recompute, 350);
    return () => { cancelAnimationFrame(raf); clearTimeout(settled); };
  }, [open, stepIndex, step, recompute]);

  useEffect(() => {
    if (!open) return;
    const onReflow = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recompute);
    };
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, recompute]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !step) return null;

  const total = steps.length;
  const isLast = stepIndex === total - 1;
  const margin = 16;
  const tooltipWidth = 320;

  const holeStyle = rect ? {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
  } : null;

  let tooltipStyle;
  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const placeBelow = spaceBelow > 200 || rect.top < 200;
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - tooltipWidth - margin);
    tooltipStyle = placeBelow
      ? { top: rect.top + rect.height + margin, left }
      : { bottom: window.innerHeight - rect.top + margin, left };
  } else {
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  // The layer has pointer-events:none (see CSS) so clicks pass straight
  // through to the page below — including the highlighted element itself,
  // which is what makes it genuinely clickable instead of swallowed by the
  // scrim. There's no backdrop-click-to-close: Escape/Skip/Done are the
  // only ways out, since a scrim built to frame a moving/scrolling target
  // is an easy accidental-dismiss trap otherwise.
  return (
    <div className="tour-layer">
      {holeStyle && <div className="tour-hole" style={holeStyle} />}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tooltip__dots">
          {steps.map((_, i) => (
            <span key={i} className={`tour-tooltip__dot${i === stepIndex ? ' tour-tooltip__dot--active' : ''}`} />
          ))}
        </div>
        <div className="tour-tooltip__title">{step.title}</div>
        <div className="tour-tooltip__body">{step.body}</div>
        <div className="tour-tooltip__actions">
          <button type="button" className="tour-tooltip__skip" onClick={close}>{labels.skip}</button>
          <div className="tour-tooltip__nav">
            {stepIndex > 0 && (
              <button type="button" className="tour-tooltip__back" onClick={() => setStepIndex(i => i - 1)}>{labels.back}</button>
            )}
            <button type="button" className="tour-tooltip__next" onClick={() => (isLast ? close() : setStepIndex(i => i + 1))}>
              {isLast ? labels.done : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
