import { Children, useEffect, useRef, useState } from 'react';

export default function CustomSelect({ name, value, onChange, disabled, children, className, style, ...rest }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = [];
  Children.forEach(children, child => {
    if (child?.type === 'option') {
      options.push({ value: child.props.value ?? '', label: child.props.children });
    }
  });

  const selected = options.find(o => String(o.value) === String(value ?? ''));
  const isEmpty = !selected || selected.value === '';

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = val => {
    onChange({ target: { name, value: val } });
    setOpen(false);
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
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <span className="csel__label">{selected?.label ?? ''}</span>
        <span className="csel__arrow">▾</span>
      </button>
      {open && (
        <div className="csel__list">
          {options.map((opt, i) => (
            <div
              key={i}
              className={`csel__opt${String(opt.value) === String(value ?? '') ? ' csel__opt--sel' : ''}${opt.value === '' ? ' csel__opt--ph' : ''}`}
              onMouseDown={() => pick(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
