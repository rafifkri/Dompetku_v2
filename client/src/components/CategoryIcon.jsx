import { CATEGORY_ICONS } from '../categoryIcons';

export default function CategoryIcon({ value, category }) {
  const src = CATEGORY_ICONS[category];
  return src ? <img className="category-icon category-icon-image" src={src} alt="" aria-hidden="true" /> : <span className="category-icon" aria-hidden="true">{value}</span>;
}
