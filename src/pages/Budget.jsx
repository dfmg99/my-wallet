import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { fmt } from '../utils/format';

function barColor(pct) {
  return pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';
}

// ── Inline budget editor modal ─────────────────────────
function BudgetEditModal({ cat, currentBudget, onSave, onClose }) {
  const [val, setVal] = useState(currentBudget > 0 ? String(currentBudget) : '');

  function save() {
    const n = parseFloat(val);
    onSave(isNaN(n) || n < 0 ? 0 : n);
  }

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 320 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {cat.icon}
          </span>
          {cat.name}
        </h2>
        <div className="form-group">
          <label>Límite mensual ($) <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(0 = sin límite)</span></label>
          <input
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose(); }}
            placeholder="Sin límite"
            min="0"
            step="0.01"
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── Budgeted category row ──────────────────────────────
function BudgetedRow({ cat, spent, onEdit }) {
  const budget = cat.budget || 0;
  const pct    = Math.min((spent / budget) * 100, 100);
  const rawPct = (spent / budget) * 100;
  const color  = barColor(rawPct);
  const over   = spent > budget ? spent - budget : 0;

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)44' }}>

      {/* Línea 1: ícono + nombre + % */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `${cat.color}22`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 17,
        }}>
          {cat.icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cat.name}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
          {Math.round(rawPct)}%
        </span>
      </div>

      {/* Línea 2: barra de progreso full width */}
      <div style={{ height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease, background-color 0.3s ease' }} />
      </div>

      {/* Línea 3: Disponible alineado a la izquierda */}
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: over > 0 ? 'var(--red)' : 'var(--green)' }}>
          {over > 0 ? `Excedido: ${fmt(over)}` : `Disponible: ${fmt(budget - spent)}`}
        </span>
      </div>

      {/* Línea 4: gastado (izq) | límite + lápiz (der) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{fmt(spent)} gastado</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>límite {fmt(budget)}</span>
          <button
            onClick={onEdit}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 5, lineHeight: 1 }}
            title="Editar presupuesto"
          >
            ✏️
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function Budget() {
  const { categories, transactions, viewYear, viewMonth, updateCategory } = useApp();
  const [editingCat, setEditingCat] = useState(null);

  const spending = useMemo(() => {
    const s = {};
    transactions.filter(t => {
      const [ty, tm] = t.date.split('-').map(Number);
      return ty === viewYear && (tm - 1) === viewMonth && t.type === 'expense';
    }).forEach(t => { s[t.cat] = (s[t.cat] || 0) + t.amount; });
    return s;
  }, [transactions, viewYear, viewMonth]);

  const expenseCats = categories.filter(c => c.type !== 'income');
  const budgeted    = expenseCats.filter(c => (c.budget || 0) > 0).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const unbudgeted  = expenseCats.filter(c => !(c.budget > 0)).sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const totalBudget  = budgeted.reduce((s, c) => s + c.budget, 0);
  const totalSpent   = budgeted.reduce((s, c) => s + (spending[c.name] || 0), 0);
  const totalPct     = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const rawTotalPct  = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const tColor       = barColor(rawTotalPct);
  const remaining    = totalBudget - totalSpent;

  async function handleSaveBudget(n) {
    await updateCategory(editingCat.id, { budget: n });
    setEditingCat(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Presupuesto</h2>
      </div>

      {/* ── Summary card ── */}
      <div className="budget-summary-card" style={{ marginBottom: 20 }}>
        {/* Title row: "Presupuesto de gastos" + "Disponible: $X" */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Presupuesto de gastos
          </div>
          {totalBudget > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disponible</span>
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: remaining >= 0 ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>
                {remaining >= 0 ? fmt(remaining) : '-' + fmt(Math.abs(remaining))}
              </span>
            </div>
          )}
        </div>

        {totalBudget > 0 ? (
          <>
            {/* Gastado | Presupuesto */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Gastado</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: tColor }}>{fmt(totalSpent)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Presupuesto</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{fmt(totalBudget)}</div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${totalPct}%`, background: tColor, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: tColor, fontWeight: 600 }}>{Math.round(rawTotalPct)}% usado</span>
              {rawTotalPct >= 100 && <span style={{ color: 'var(--red)' }}>⚠️ Límite superado</span>}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Asigna límites a tus categorías para ver el progreso del presupuesto mensual.
          </p>
        )}
      </div>

      {/* ── Categorías presupuestadas ── */}
      {budgeted.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-title">Categorías presupuestadas</div>
          {budgeted.map((cat, i) => (
            <div key={cat.id} style={{ borderBottom: i === budgeted.length - 1 ? 'none' : undefined }}>
              <BudgetedRow
                cat={cat}
                spent={spending[cat.name] || 0}
                onEdit={() => setEditingCat(cat)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Sin presupuesto ── */}
      {unbudgeted.length > 0 && (
        <div className="panel">
          <div className="panel-title">Sin presupuesto</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {unbudgeted.map(cat => {
              const spent = spending[cat.name] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setEditingCat(cat)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 12px', background: 'var(--surface2)',
                    border: '1px dashed var(--border)', borderRadius: 14,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    minWidth: 72,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  title={`Asignar presupuesto a ${cat.name}`}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)', textAlign: 'center', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: 10, color: spent > 0 ? 'var(--red)' : 'var(--muted)', fontWeight: 600 }}>
                    {spent > 0 ? fmt(spent) : '$0.00'}
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
            Toca una categoría para asignarle un límite mensual
          </p>
        </div>
      )}

      <div style={{ height: 120 }} />

      {editingCat && (
        <BudgetEditModal
          cat={editingCat}
          currentBudget={editingCat.budget || 0}
          onSave={handleSaveBudget}
          onClose={() => setEditingCat(null)}
        />
      )}
    </div>
  );
}
