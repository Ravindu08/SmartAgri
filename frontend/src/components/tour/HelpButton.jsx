import { HelpCircle } from 'lucide-react';

// Fixed bottom-right pill that (re)opens a page's guided tour. Replaces the
// old bare '?' circle — icon + label reads as "help" at a glance instead of
// needing a tooltip to explain itself.
export default function HelpButton({ label, ariaLabel, onClick }) {
  return (
    <button type="button" className="tour-help-btn" aria-label={ariaLabel || label} onClick={onClick}>
      <HelpCircle size={18} strokeWidth={2.25} />
      <span className="tour-help-btn__label">{label}</span>
    </button>
  );
}
