import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import '../styles/motion.css';
import '../styles/forms-motion.css';
import '../styles/tools-motion.css';
import '../styles/app-motion.css';

// Card-like blocks that get an entrance animation. Matching is by naming
// convention ("...card", "...-stat", "...panel", section wrappers) so pages
// don't each have to opt in.
const REVEAL_SELECTOR = [
  '[class*="card"]',
  '[class*="-stat"]:not([class*="__"])',
  '[class*="-panel"]',
  '.detail-section',
  '.about-section',
  '.wx-section',
].join(',');

// Never animate these: overlays manage their own entrance, and hiding
// something inside them would leave a dialog with invisible content.
const SKIP_INSIDE = '[role="dialog"], .modal-panel, [class*="dropdown"], [class*="popover"], [class*="tour"], [class*="toast"], [class*="profile-panel"], [class*="notif"], header, nav, aside, footer';

const CASCADE_WINDOW_MS = 1400; // how long after a route change in-view blocks still cascade in
const STAGGER_MS = 55;
const MAX_STAGGER_MS = 330;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function finish(el) {
  el.setAttribute('data-fx', 'in');
  const done = () => { el.removeAttribute('data-fx'); el.style.removeProperty('--fx-delay'); el.dataset.fxDone = '1'; };
  // transitionend can be missed (tab hidden, element removed) — the timer is the guarantee.
  setTimeout(done, 1100);
}

/**
 * Mounted once inside the router. Adds:
 *  - an entrance cascade for blocks in view right after a route change, and a
 *    scroll reveal for the ones below the fold
 *  - a progress bar across the top on every navigation
 *  - a soft light that follows the cursor
 *  - the pointer position as --fx-x/--fx-y, which the theme-switch animation
 *    in motion.css grows from
 */
export default function MotionLayer() {
  const { pathname } = useLocation();
  const progressRef = useRef(null);
  const auraRef = useRef(null);

  // ── Entrance cascade + scroll reveal ────────────────────────────────────
  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return undefined;

    const routeStart = performance.now();
    let inViewIndex = 0;

    const io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        entry.target.style.setProperty('--fx-delay', `${Math.min(i++ * STAGGER_MS, MAX_STAGGER_MS)}ms`);
        finish(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });

    function scan() {
      const root = document.querySelector('main') || document.body;
      const viewportH = window.innerHeight;
      const cascading = performance.now() - routeStart < CASCADE_WINDOW_MS;

      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.fxDone || el.hasAttribute('data-fx')) return;
        if (el.closest(SKIP_INSIDE)) { el.dataset.fxDone = '1'; return; }
        // One animation per visual block: don't also animate what's nested in a block that is still hidden.
        if (el.parentElement?.closest('[data-fx="hide"]')) { el.dataset.fxDone = '1'; return; }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return; // not laid out yet — try again on the next scan

        if (rect.top >= viewportH * 0.94) {
          el.setAttribute('data-fx', 'hide');
          io.observe(el);
        } else if (cascading && rect.bottom > 0) {
          el.setAttribute('data-fx', 'hide');
          el.style.setProperty('--fx-delay', `${Math.min(inViewIndex++ * STAGGER_MS, MAX_STAGGER_MS)}ms`);
          // Two frames so the hidden state is painted before the transition starts.
          requestAnimationFrame(() => requestAnimationFrame(() => finish(el)));
        } else {
          el.dataset.fxDone = '1';
        }
      });
    }

    let queued = 0;
    const queueScan = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; scan(); });
    };

    queueScan();
    const mo = new MutationObserver(queueScan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      if (queued) cancelAnimationFrame(queued);
      // Nothing may be left hidden by an observer that no longer exists.
      document.querySelectorAll('[data-fx]').forEach((el) => el.removeAttribute('data-fx'));
    };
  }, [pathname]);

  // ── Route-change progress bar ───────────────────────────────────────────
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    bar.classList.remove('fx-progress--run');
    void bar.offsetWidth; // restart the animation
    bar.classList.add('fx-progress--run');
  }, [pathname]);

  // ── Cursor aura + pointer position for the theme-switch reveal ──────────
  useEffect(() => {
    const aura = auraRef.current;
    const root = document.documentElement;
    let frame = 0;
    let x = 0;
    let y = 0;

    const onDown = (e) => {
      root.style.setProperty('--fx-x', `${e.clientX}px`);
      root.style.setProperty('--fx-y', `${e.clientY}px`);
    };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (frame || !aura) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        aura.style.setProperty('--fx-aura-x', `${x}px`);
        aura.style.setProperty('--fx-aura-y', `${y}px`);
        aura.classList.add('fx-aura--on');
      });
    };
    const onLeave = () => aura?.classList.remove('fx-aura--on');

    window.addEventListener('pointerdown', onDown, { passive: true });
    if (!reducedMotion()) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
    }
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={progressRef} className="fx-progress" aria-hidden="true" />
      <div ref={auraRef} className="fx-aura" aria-hidden="true" />
    </>
  );
}
