import { useEffect, useRef } from 'react';

let openDialogs = 0;

/**
 * Standard dialog behaviour: Escape closes it, and the page behind it does not
 * scroll while it is open. Call it with whether the dialog is showing.
 */
export default function useDialogDismiss(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);

    // Counted, so a dialog opened from another dialog doesn't unlock the page early.
    openDialogs += 1;
    const previous = document.body.style.overflow;
    if (openDialogs === 1) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = previous === 'hidden' ? '' : previous;
    };
  }, [open]);
}
