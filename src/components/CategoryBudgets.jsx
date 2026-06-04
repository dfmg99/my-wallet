import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt } from '../utils/format';

function ProgressBar({ pct }) {
  const color = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s, background-color 0.3s',
        }}
      />
    </div>
  );
}

function BudgetItem({ cat, spent }) {
  const { updateCategory } = useApp();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const budget = cat.budget || 0;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const pctDisplay = budget > 0 ? Math.round(pct) : null;
  const barColor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)';

  async function save() {
    const n = parseFloat(val);
    await updateCategory(cat.id, { budget: isNaN(n) || n < 0 ? 0 : n });
    setEditing(false);
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'var(--surface2)',
        borderRadius: 12,
        border: pct >= 100 ? '1px solid #f45b7a44' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: `${cat.color}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {fmt(spent)}{budget > 0 ? ` / ${fmt(budget)}` : ' — sin límite'}
          </div>
        </div>
        {pctDisplay !== null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: barColor, flexShrink: 0 }}>
            {pctDisplay}%
          </span>
        )}
      </div>

      {budget > 0 && <ProgressBar pct={pct} />}

      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder="Límite mensual"
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={save}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              padding: '0 10px',
              fontSize: 13,
            }}
          >
            ✓
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setVal(budget || ''); setEditing(true); }}
          style={{
            background: 'none',
            border: '1px dashed var(--border)',
            borderRadius: 8,
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '4px 10px',
            width: '100%',
            textAlign: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          {budget > 0 ? '✏️ Editar límite' : '+ Establecer límite'}
        </button>
      )}
    </div>
  );
}

export default function CategoryBudgets({ monthTxs }) {
  const { categories } = useApp();

  const spending = {};
  monthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      spending[t.cat] = (spending[t.cat] || 0) + t.amount;
    });

  const totalBudget = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const totalSpent = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalColor = totalPct >= 100 ? 'var(--red)' : totalPct >= 80 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <div className="panel-title">
        Presupuesto mensual
        {totalBudget > 0 && (
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
            <span>{fmt(totalSpent)} / {fmt(totalBudget)}</span>
            <span style={{ fontWeight: 700, color: totalColor }}>{Math.round(totalPct)}%</span>
          </div>
        )}
      </div>

      {totalBudget > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(totalPct, 100)}%`,
                background: totalColor,
                borderRadius: 4,
                transition: 'width 0.4s, background-color 0.3s',
              }}
            />
          </div>
          {totalPct >= 100 && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>
              ⚠️ Has superado el presupuesto mensual total
            </p>
          )}
        </div>
      )}

      {categories.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          No hay categorías. Créalas en la sección de Categorías.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {categories.map(cat => (
            <BudgetItem key={cat.id} cat={cat} spent={spending[cat.name] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}
