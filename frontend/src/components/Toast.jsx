export default function Toast({ type = 'success', message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`toast toast--${type}`} role="status" onClick={onClose}>
      <span>{message}</span>
      <button className="toast__close" type="button" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
