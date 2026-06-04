import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Data mappers (DB snake_case ↔ JS camelCase) ─────

export function dbToTx(row) {
  return {
    id:     row.id,
    userId: row.user_id,
    desc:   row.description,
    amount: Number(row.amount),
    type:   row.type,
    cat:    row.cat,
    date:   row.date,
    status: row.status,
    method: row.method || '',
  };
}

export function txToDb(tx, userId) {
  return {
    user_id: userId,
    description: tx.desc,
    amount:  tx.amount,
    type:    tx.type,
    cat:     tx.cat,
    date:    tx.date,
    status:  tx.status || 'done',
    method:  tx.method || null,
  };
}

export function dbToCat(row) {
  return {
    id:        row.id,
    userId:    row.user_id,
    name:      row.name,
    icon:      row.icon,
    color:     row.color,
    budget:    Number(row.budget || 0),
    type:      row.type || 'expense',
    isDefault: row.is_default || false,
  };
}

export function catToDb(cat, userId) {
  return {
    user_id:    userId,
    name:       cat.name,
    icon:       cat.icon,
    color:      cat.color,
    budget:     cat.budget || 0,
    type:       cat.type || 'expense',
    is_default: cat.isDefault || false,
  };
}
