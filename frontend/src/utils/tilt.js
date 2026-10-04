// Pointer handlers for cards that tilt toward the cursor and light up under
// it. They only write CSS variables (--rx, --ry, --px, --py); the element's
// stylesheet decides what to do with them, so nothing re-renders on move.
export function tiltHandlers(maxDeg = 6) {
  return {
    onPointerMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(x - 0.5) * 2 * maxDeg}deg`);
      el.style.setProperty('--rx', `${(0.5 - y) * 2 * maxDeg}deg`);
      el.style.setProperty('--px', `${x * 100}%`);
      el.style.setProperty('--py', `${y * 100}%`);
    },
    onPointerLeave(e) {
      e.currentTarget.style.setProperty('--rx', '0deg');
      e.currentTarget.style.setProperty('--ry', '0deg');
    },
  };
}
