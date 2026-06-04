export const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export const MONTHS_SHORT = [
  'ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic',
];

// Income defaults
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', icon: '💰', color: '#10b981', isDefault: true, type: 'income' },
];

// Expense defaults (alphabetical)
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentación',    icon: '🛒', color: '#22d3a5', isDefault: true, type: 'expense' },
  { name: 'Compras',         icon: '🛍️', color: '#f472b6', isDefault: true, type: 'expense' },
  { name: 'Deudas',          icon: '💳', color: '#ef4444', isDefault: true, type: 'expense' },
  { name: 'Entretenimiento', icon: '🎭', color: '#a78bfa', isDefault: true, type: 'expense' },
  { name: 'Restaurantes',    icon: '🍽️', color: '#f59e0b', isDefault: true, type: 'expense' },
  { name: 'Salud',           icon: '🏥', color: '#f45b7a', isDefault: true, type: 'expense' },
  { name: 'Servicios',       icon: '💡', color: '#f5c842', isDefault: true, type: 'expense' },
  { name: 'Transporte',      icon: '🚗', color: '#3b82f6', isDefault: true, type: 'expense' },
  { name: 'Vivienda',        icon: '🏠', color: '#6c63ff', isDefault: true, type: 'expense' },
];

export const DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

export const DEFAULT_CAT_NAMES = new Set(DEFAULT_CATEGORIES.map(c => c.name));

export function getCatInfo(categories, name) {
  return categories.find(c => c.name === name) || { icon: '📦', color: '#8b90a7' };
}

export function fmt(n) {
  return '$' + n.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
}
