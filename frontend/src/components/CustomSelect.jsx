import { Children, useEffect, useId, useRef, useState } from 'react';

function labelText(label) {
  if (label == null || typeof label === 'boolean') return '';
  if (Array.isArray(label)) return label.map(labelText).join('');
  if (typeof label === 'object') return labelText(label.props?.children);
  return String(label);
}

// What type-ahead matches against: the label without a leading emoji or symbol,
// so typing "tom" finds "🍅 Tomato".
function searchText(label) {
  return labelText(label).replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase();
}

export default function CustomSelect({ name, value, onChange, disabled, children, className, style, 'aria-label': ariaLabel, ...rest }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  const options = [];
  Children.forEach(children, child => {
    if (child?.type === 'option') {
      options.push({ value: child.props.value ?? '', label: child.props.children });
    }
  });

  const selectedIndex = options.findIndex(o => String(o.value) === String(value ?? ''));
  const selected = options[selectedIndex];
  const isEmpty = !selected || selected.value === '';

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keep the highlighted option in view while moving through a long list.
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const pick = val => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  // Type a few letters to jump to the option that starts with them, as a native select does.
  const typeAhead = key => {
    const now = Date.now();
    const text = (now - typed.current.at > 700 ? '' : typed.current.text) + key.toLowerCase();
    typed.current = { text, at: now };
    const match = options.findIndex(o => o.value !== '' && searchText(o.label).startsWith(text));
    if (match < 0) return;
    if (open) setActive(match);
    else pick(options[match].value);
  };

  const onKeyDown = e => {
    if (disabled) return;
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList(); else setActive(i => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList(); else setActive(i => Math.max(0, i - 1));
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActive(last); }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openList();
        else if (options[active]) pick(options[active].value);
        break;
      case 'Escape':
        if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
    }
  };

  return (
    <div
      ref={ref}
      className={`csel${open ? ' csel--open' : ''}${disabled ? ' csel--disabled' : ''}${className ? ' ' + className : ''}`}
      style={style}
      {...rest}
    >
      <button
        type="button"
        className={`csel__btn${isEmpty ? ' csel__btn--ph' : ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        <span className="csel__label">{selected?.label ?? ''}</span>
        <span className="csel__arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="csel__list" role="listbox" id={listId} ref={listRef}>
          {options.map((opt, i) => {
            const isSelected = i === selectedIndex;
            return (
              <div
                key={i}
                role="option"
                aria-selected={isSelected}
                className={`csel__opt${isSelected ? ' csel__opt--sel' : ''}${i === active ? ' csel__opt--active' : ''}${opt.value === '' ? ' csel__opt--ph' : ''}`}
                onMouseDown={() => pick(opt.value)}
                onMouseEnter={() => setActive(i)}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
