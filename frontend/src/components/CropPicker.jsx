import { useState } from 'react';
import { ALL_CROPS, CROP_EMOJI } from '../data/cropData';
import { useApp } from '../context/AppContext';
import { LAND_T } from '../data/translations';

export default function CropPicker({ selected = [], onChange }) {
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_CROPS.filter(c => c.toLowerCase().includes(search.trim().toLowerCase()))
    : ALL_CROPS;

  const toggle = (crop) => {
    if (selected.includes(crop)) {
      onChange(selected.filter(c => c !== crop));
    } else {
      onChange([...selected, crop]);
    }
  };

  const remove = (crop) => onChange(selected.filter(c => c !== crop));

  return (
    <div className="crop-picker">
      {selected.length > 0 && (
        <div className="crop-picker__tags">
          {selected.map(crop => (
            <span key={crop} className="crop-picker__tag">
              {CROP_EMOJI[crop] || '🌱'} {crop}
              <button type="button" className="crop-picker__tag-remove" onClick={() => remove(crop)}>✕</button>
            </span>
          ))}
        </div>
      )}

      <input
        className="crop-picker__search"
        type="text"
        placeholder={t.cropPickerSearchPh}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="crop-picker__list">
        {filtered.map(crop => {
          const active = selected.includes(crop);
          return (
            <button
              key={crop}
              type="button"
              className={`crop-picker__item${active ? ' crop-picker__item--active' : ''}`}
              onClick={() => toggle(crop)}
            >
              <span className="crop-picker__item-emoji">{CROP_EMOJI[crop] || '🌱'}</span>
              <span className="crop-picker__item-name">{crop}</span>
              {active && <span className="crop-picker__item-check">✓</span>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="crop-picker__empty">{t.cropPickerEmpty(search)}</p>
        )}
      </div>
    </div>
  );
}
