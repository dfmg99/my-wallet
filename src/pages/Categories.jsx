import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CategoryModal from '../components/CategoryModal';
import { fmt } from '../utils/format';

// ── Per-card action menu (Editar / Eliminar) ───────────
function CatMenu({ onClose, onEdit, onDelete }) {
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const item = (label, color, onClick) => (
    <button
      onClick={() => { onClose(); onClick(); }}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '10px 14px', background: 'none', border: 'none',
        color: color || 'var(--text)', fontSize: 13, cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 60,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, minWidth: 140, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {item('✏️  Editar',   null,          onEdit)}
      <div style={{ height: 1, background: 'var(--border)' }} />
      {item('🗑  Eliminar', 'var(--red)', onDelete)}
    </div>
  );
}

// ── Single category card ───────────────────────────────
function CatCard({ cat, spent, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef();

  return (
    <div className="cat-grid-item" style={{ cursor: 'default' }}>
      {/* ··· trigger + dropdown wrapper */}
      <div style={{ position: 'absolute', top: 6, right: 6 }} ref={triggerRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }}
          className="cat-menu-btn"
          title="Opciones"
        >
          ···
        </button>
        {menuOpen && (
          <CatMenu
            onClose={() => setMenuOpen(false)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>

      <div className="cat-circle" style={{ background: `${cat.color}25` }}>
        {cat.icon}
      </div>
      <div className="cat-name">{cat.name}</div>
      {cat.budget > 0 && (
        <div style={{ fontSize: 9, color: 'var(--muted)' }}>Presup: {fmt(cat.budget)}</div>
      )}
      <div className="cat-amount" style={{ color: spent > 0 ? 'var(--red)' : 'var(--muted)' }}>
        {spent > 0 ? fmt(spent) : '$0.00'}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function Categories() {
  const { categories, transactions, viewYear, viewMonth, addCategory, updateCategory, deleteCategory } = useApp();
  // null = closed | {} = new category | cat object = editing
  const [modalTarget, setModalTarget] = useState(null);

  const spending = useMemo(() => {
    const s = {};
    transactions.filter(t => {
      const [ty, tm] = t.date.split('-').map(Number);
      return ty === viewYear && (tm - 1) === viewMonth && t.type === 'expense';
    }).forEach(t => { s[t.cat] = (s[t.cat] || 0) + t.amount; });
    return s;
  }, [transactions, viewYear, viewMonth]);

  // Income: defaults first (alpha), then custom (alpha)
  const incomeCategories = useMemo(() => [
    ...categories.filter(c => c.type === 'income' && c.isDefault).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    ...categories.filter(c => c.type === 'income' && !c.isDefault).sort((a, b) => a.name.localeCompare(b.name, 'es')),
  ], [categories]);

  // Expense: defaults first (alpha), then custom (alpha)
  const expenseCategories = useMemo(() => [
    ...categories.filter(c => c.type !== 'income' && c.isDefault).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    ...categories.filter(c => c.type !== 'income' && !c.isDefault).sort((a, b) => a.name.localeCompare(b.name, 'es')),
  ], [categories]);

  async function handleSave(data) {
    if (modalTarget?.id) {
      await updateCategory(modalTarget.id, data);
    } else {
      await addCategory(data);
    }
    setModalTarget(null);
  }

  async function handleDelete(cat) {
    if (!confirm(`¿Eliminar "${cat.name}"? Las transacciones existentes mantendrán su nombre.`)) return;
    await deleteCategory(cat.id);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Categorías</h2>
        <button className="add-btn" onClick={() => setModalTarget({})}>+ Nueva</button>
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <p>Sin categorías. ¡Crea una!</p>
        </div>
      ) : (
        <>
          {/* Ingresos */}
          {incomeCategories.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>💚 Ingresos</span>
                <div style={{ flex: 1, height: 1, background: 'var(--green)33' }} />
              </div>
              <div className="cat-grid">
                {incomeCategories.map(cat => (
                  <CatCard key={cat.id} cat={cat} spent={spending[cat.name] || 0}
                    onEdit={() => setModalTarget(cat)} onDelete={() => handleDelete(cat)} />
                ))}
              </div>
            </div>
          )}

          {/* Gastos */}
          {expenseCategories.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>🔴 Gastos</span>
                <div style={{ flex: 1, height: 1, background: 'var(--red)33' }} />
              </div>
              <div className="cat-grid">
                {expenseCategories.map(cat => (
                  <CatCard key={cat.id} cat={cat} spent={spending[cat.name] || 0}
                    onEdit={() => setModalTarget(cat)} onDelete={() => handleDelete(cat)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalTarget !== null && (
        <CategoryModal
          initial={modalTarget?.id ? modalTarget : null}
          onSave={handleSave}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
