import { useEffect, useRef, useState } from 'react';

// Animates a number from its previous value to `target` with ease-out timing.
// Used for dashboard stat cards so numbers feel alive instead of snapping in.
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  const firstRun = useRef(true);

  useEffect(() => {
    const to = Number(target) || 0;
    // Skip the animation on first mount if the value starts at 0 (nothing to count from)
    const from = firstRun.current ? 0 : prevTarget.current;
    firstRun.current = false;

    if (from === to) { setValue(to); prevTarget.current = to; return; }

    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
