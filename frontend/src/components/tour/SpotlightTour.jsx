import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
    // Re-measure a few more times as the step settles: catches the page's own
    // ~280ms entrance transition, smooth-scrolling still in flight, and any
    // target whose layout shifts once async content (SWR data, a prediction
    // result) finishes loading in after the step already mounted.
    const settleTimers = [100, 250, 400, 700, 1100, 1600].map(ms => setTimeout(recompute, ms));
    return () => { cancelAnimationFrame(raf); settleTimers.forEach(clearTimeout); };
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
  //
  // Portaled straight to <body> rather than rendered in place: every page
  // wraps its content in a `.page-transition` div that runs a ~280ms
  // transform-based entrance animation, and a CSS animation touching
  // `transform` makes that element a containing block for any
  // `position: fixed` descendant for as long as it's active (same mechanism
  // documented on `.navbar`'s backdrop-filter in styles.css). Without the
  // portal, the tour's "fixed" hole/tooltip would briefly anchor to that
  // animating wrapper instead of the viewport on every auto-open — exactly
  // the flash-in-the-wrong-place bug this fixes.
  return createPortal(
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
    </div>,
    document.body
  );
}
