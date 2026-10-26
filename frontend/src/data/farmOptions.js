export { SOIL_TYPES } from './cropData';

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

export const IRRIGATION_TYPES = ['Rainfed', 'Irrigated', 'Supplemental'];

export const SEASONS = ['Maha', 'Yala', 'Year-round'];

export const SIZE_UNITS = ['acres', 'hectares', 'perches', 'sq. meters'];

const SIZE_UNIT_LABELS = {
  si: { acres: 'අක්කර', hectares: 'හෙක්ටයාර', perches: 'පර්චස්', 'sq. meters': 'වර්ග මීටර්' },
  ta: { acres: 'ஏக்கர்', hectares: 'ஹெக்டேர்', perches: 'பேர்ச்', 'sq. meters': 'சதுர மீட்டர்' },
};
/** Display label for a farm size unit (the stored value stays English). */
export const sizeUnitLabel = (u, lang) => (SIZE_UNIT_LABELS[lang] || {})[u] || u;
