import { useEffect, useState } from 'react';

// Auto-opens once per browser, gated by a localStorage flag. Doesn't persist
// the flag itself — the caller (SpotlightTour) marks it seen on close, so
// skipping counts the same as finishing.
export default function useAutoOpenOnce(storageKey, ready = true) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try { seen = Boolean(localStorage.getItem(storageKey)); } catch { /* ignore */ }
    if (!seen) setOpen(true);
  }, [ready, storageKey]);

  return [open, setOpen];
}
