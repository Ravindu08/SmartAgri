// Pointer handlers for cards that tilt toward the cursor and light up under
// it. They only write CSS variables (--rx, --ry, --px, --py); the element's
// stylesheet decides what to do with them, so nothing re-renders on move.
export function tiltHandlers(maxDeg = 6) {
  const reset = (el) => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return {
    onPointerMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const el = e.currentTarget;
      // React bubbles events out of a portal, so a dialog opened from this
      // card reports its own pointer moves here. Those are not over the card:
      // lay it flat instead of tilting it toward a point far outside itself.
      if (!el.contains(e.target)) { reset(el); return; }
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.style.setProperty('--ry', `${(x - 0.5) * 2 * maxDeg}deg`);
      el.style.setProperty('--rx', `${(0.5 - y) * 2 * maxDeg}deg`);
      el.style.setProperty('--px', `${x * 100}%`);
      el.style.setProperty('--py', `${y * 100}%`);
    },
    onPointerLeave(e) {
      reset(e.currentTarget);
    },
  };
}
