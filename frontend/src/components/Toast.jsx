import { useEffect } from 'react';

const AUTO_CLOSE_MS = 4500;

export default function Toast({ type = 'success', message, onClose }) {
  // A confirmation should not sit on the page until someone clicks it away.
  // Errors stay a little longer so there is time to read them.
  useEffect(() => {
    if (!message || !onClose) return undefined;
    const timer = setTimeout(onClose, type === 'error' ? AUTO_CLOSE_MS * 2 : AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [message, type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) {
    return null;
  }

  return (
    <div className={`toast toast--${type}`} role={type === 'error' ? 'alert' : 'status'} onClick={onClose}>
      <span>{message}</span>
      <button className="toast__close" type="button" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
