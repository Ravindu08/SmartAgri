// A short confetti burst for the moments worth marking: a payment going
// through, an order completed, a cultivation finished. Dependency-free canvas;
// does nothing under prefers-reduced-motion.

const COLORS = ['#2E7D32', '#7cc576', '#FBC02D', '#F9A825', '#86efac', '#ffffff'];
const DURATION_MS = 1900;
const PARTICLES = 130;

let running = false;

export function celebrate() {
  if (typeof window === 'undefined' || running) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  running = true;

  const canvas = document.createElement('canvas');
  canvas.className = 'fx-confetti';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Two cannons, one from each lower corner, firing toward the middle.
  const particles = Array.from({ length: PARTICLES }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const angle = (fromLeft ? -Math.PI / 3 : (-2 * Math.PI) / 3) + (Math.random() - 0.5) * 0.9;
    const speed = 9 + Math.random() * 11;
    return {
      x: fromLeft ? 0 : w,
      y: h * 0.82,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.35,
      round: Math.random() < 0.3,
    };
  });

  const start = performance.now();
  function frame(now) {
    const t = (now - start) / DURATION_MS;
    ctx.clearRect(0, 0, w, h);
    if (t >= 1) {
      canvas.remove();
      running = false;
      return;
    }
    ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    particles.forEach((p) => {
      p.vy += 0.32;          // gravity
      p.vx *= 0.985;         // air drag
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.spin += p.spinSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scaling one axis by the spin makes the rectangle read as a tumbling piece of paper.
        ctx.scale(1, Math.cos(p.spin * 2));
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      }
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
