import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { fmt, MONTHS } from '../utils/format';

const btnStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--surface2)', color: 'var(--text)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

function DeltaBadge({ curr, prev, invertColor }) {
  if (prev === 0 && curr === 0) return <span style={{ fontSize: 11, color: 'var(--muted)' }}>Sin datos</span>;
  if (prev === 0) return <span style={{ fontSize: 11, color: 'var(--green)' }}>Nuevo</span>;
  const pct = ((curr - prev) / prev) * 100;
  const up = pct >= 0;
  // invertColor: for expenses, up is bad (red); for income, up is good (green)
  const color = invertColor
    ? (up ? 'var(--red)' : 'var(--green)')
    : (up ? 'var(--green)' : 'var(--red)');
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function SummaryRow({ label, current, previous, invertColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)44' }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmt(current)}</span>
      <span style={{ minWidth: 80, textAlign: 'right', marginLeft: 12 }}>
        <DeltaBadge curr={current} prev={previous} invertColor={invertColor} />
      </span>
    </div>
  );
}

// ── Print styles injected once ────────────────────────
const PRINT_CSS = `
@media print {
  body > *:not(.rpt-portal) { display: none !important; }
  .rpt-controls { display: none !important; }
  .rpt-portal { position: static !important; overflow: visible !important; background: white !important; }
  .rpt-page { box-shadow: none !important; margin: 0 !important; padding: 24px !important; }
  .rpt-page * { color: black !important; border-color: #bbb !important; background: transparent !important; }
  .rpt-green { color: #0a6640 !important; }
  .rpt-red   { color: #b02030 !important; }
  .rpt-accent{ color: #3a3a9e !important; }
  .rpt-muted { color: #555 !important; }
  .rpt-bar   { background: #ccc !important; }
  .rpt-bar-fill { background: #444 !important; }
}
`;

// ── Full report overlay (rendered via portal) ──────────
function FullReport({ onClose, data }) {
  const { currentUser } = useApp();
  const { label, income, expense, balance, incomeBreakdown, catBreakdown,
          monthTxs, categories, prevIncome, prevExpense, prevLabel } = data;

  const todayStr = new Date().toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const savingsPct = income > 0 ? Math.round((balance / income) * 100) : 0;
  const top5 = [...monthTxs].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const [expandedCats, setExpandedCats] = useState(new Set());
  function toggleCat(name) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'rpt-print-css';
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('rpt-print-css'); el?.remove(); };
  }, []);

  const h2 = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: 6, marginBottom: 12, marginTop: 24 };
  const cell = { padding: '9px 10px', borderBottom: '1px solid #eee', fontSize: 13 };
  const th = { padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', textAlign: 'left', borderBottom: '2px solid #e0e0e0' };

  const content = (
    <div className="rpt-portal" style={{ position: 'fixed', inset: 0, background: 'white', overflowY: 'auto', zIndex: 300, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Controls */}
      <div className="rpt-controls" style={{ position: 'sticky', top: 0, background: '#f5f5f5', borderBottom: '1px solid #ddd', padding: '10px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ marginRight: 'auto', fontSize: 14, fontWeight: 600, color: '#333' }}>Informe — {label}</span>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🖨️ Imprimir / Guardar PDF</button>
        <button onClick={onClose} style={{ padding: '8px 14px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕ Cerrar</button>
      </div>

      {/* Report page */}
      <div className="rpt-page" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px', color: '#111' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '3px solid #111', paddingBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>MY WALLET</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Informe Financiero — {label}</div>
          <div style={{ fontSize: 13, color: '#555', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span>Usuario: <strong>{currentUser?.name}</strong></span>
            <span>Generado: <strong>{todayStr}</strong></span>
          </div>
        </div>

        {/* ── Executive summary ── */}
        <h2 style={h2}>Resumen Ejecutivo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 8 }}>
          {[
            { label: 'Ingresos totales', value: fmt(income), cls: 'rpt-green' },
            { label: 'Gastos totales',   value: fmt(expense), cls: 'rpt-red' },
            { label: 'Disponible',       value: fmt(balance), cls: balance >= 0 ? 'rpt-green' : 'rpt-red' },
            { label: '% Ahorro',         value: `${savingsPct}%`, cls: savingsPct >= 0 ? 'rpt-green' : 'rpt-red' },
          ].map(({ label: l, value, cls }) => (
            <div key={l} style={{ padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
              <div className={cls} style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Income by category ── */}
        <h2 style={h2}>Ingresos por Categoría</h2>
        {incomeBreakdown.length === 0 ? <p style={{ color: '#888', fontSize: 13 }}>Sin ingresos registrados.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Categoría</th><th style={{ ...th, textAlign: 'right' }}>Monto</th><th style={{ ...th, textAlign: 'right' }}>%</th><th style={{ ...th, width: 120 }}>Proporción</th></tr></thead>
            <tbody>
              {incomeBreakdown.map(c => (
                <tr key={c.name}>
                  <td style={cell}><span style={{ marginRight: 8 }}>{c.icon}</span>{c.name}</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }} className="rpt-green">{fmt(c.amount)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#888' }}>{c.pct}%</td>
                  <td style={cell}><div className="rpt-bar" style={{ height: 5, background: '#eee', borderRadius: 3 }}><div className="rpt-bar-fill" style={{ height: '100%', width: `${c.pct}%`, background: c.color || '#22d3a5', borderRadius: 3 }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Expense by category ── */}
        <h2 style={h2}>Gastos por Categoría</h2>
        {catBreakdown.length === 0 ? <p style={{ color: '#888', fontSize: 13 }}>Sin gastos registrados.</p> : (
          <div>
            {catBreakdown.map(c => {
              const budget    = categories.find(cat => cat.name === c.name)?.budget || 0;
              const pctBudget = budget > 0 ? Math.round((c.spent / budget) * 100) : null;
              const isOpen    = expandedCats.has(c.name);
              const catTxs    = monthTxs.filter(t => t.type === 'expense' && t.cat === c.name)
                                        .sort((a, b) => b.date.localeCompare(a.date));
              return (
                <div key={c.name} style={{ borderBottom: '1px solid #eee' }}>
                  <div style={{ padding: '10px 0' }}>
                    {/* Line 1: icon + name + expand arrow + budget */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      {budget > 0 && (
                        <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>
                          presup. {fmt(budget)}{pctBudget !== null ? ` (${pctBudget}%)` : ''}
                        </span>
                      )}
                      <button onClick={() => toggleCat(c.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', padding: '2px 4px', flexShrink: 0 }}
                        title={isOpen ? 'Ocultar transacciones' : 'Ver transacciones'}>
                        {isOpen ? '▲' : '▼'}
                      </button>
                    </div>
                    {/* Line 2: monto + barra + % afuera */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="rpt-red" style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{fmt(c.spent)}</span>
                      <div className="rpt-bar" style={{ flex: 1, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                        <div className="rpt-bar-fill" style={{ height: '100%', width: `${c.pct}%`, background: c.color || '#f45b7a', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c.color || '#f45b7a', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
                        {c.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Expandable transactions list */}
                  {isOpen && (
                    <div style={{ background: '#fafafa', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
                      {catTxs.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#888', padding: '8px 12px', margin: 0 }}>Sin transacciones</p>
                      ) : catTxs.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ fontSize: 11, color: '#888', flexShrink: 0, whiteSpace: 'nowrap' }}>{t.date}</span>
                          <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</span>
                          <span className="rpt-red" style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>-{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Top 5 transactions ── */}
        <h2 style={h2}>Top 5 Transacciones del Mes</h2>
        {top5.length === 0 ? <p style={{ color: '#888', fontSize: 13 }}>Sin transacciones.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>#</th><th style={th}>Descripción</th><th style={th}>Categoría</th><th style={th}>Fecha</th><th style={{ ...th, textAlign: 'right' }}>Monto</th></tr></thead>
            <tbody>
              {top5.map((t, i) => {
                const cat = categories.find(c => c.name === t.cat);
                return (
                  <tr key={t.id}>
                    <td style={{ ...cell, color: '#888', width: 30 }}>{i + 1}</td>
                    <td style={cell}>{t.desc}</td>
                    <td style={cell}>{cat?.icon} {t.cat}</td>
                    <td style={{ ...cell, color: '#888', whiteSpace: 'nowrap' }}>{t.date}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }} className={t.type === 'income' ? 'rpt-green' : 'rpt-red'}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── Budget Summary ── */}
        {(() => {
          const budgetedCats = categories.filter(c => (c.budget || 0) > 0);
          if (budgetedCats.length === 0) return null;
          const totalBudget  = budgetedCats.reduce((s, c) => s + c.budget, 0);
          const spendingMap  = {};
          monthTxs.filter(t => t.type === 'expense').forEach(t => { spendingMap[t.cat] = (spendingMap[t.cat] || 0) + t.amount; });
          const totalSpent   = budgetedCats.reduce((s, c) => s + (spendingMap[c.name] || 0), 0);
          const available    = totalBudget - totalSpent;
          const exceeded     = budgetedCats.filter(c => (spendingMap[c.name] || 0) > c.budget);
          return (
            <>
              <h2 style={h2}>Resumen de Presupuesto</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Presupuesto total', value: fmt(totalBudget), color: '#111' },
                  { label: 'Total gastado',     value: fmt(totalSpent),  color: '#b02030' },
                  { label: 'Disponible',        value: fmt(available),   color: available >= 0 ? '#0a6640' : '#b02030' },
                ].map(({ label: l, value, color }) => (
                  <div key={l} style={{ padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>
              {exceeded.length > 0 && (
                <div style={{ background: '#fff0f0', border: '1px solid #f0c0c0', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#b02030', marginBottom: 6 }}>⚠️ Categorías que superaron su límite:</div>
                  {exceeded.map(c => {
                    const spent = spendingMap[c.name] || 0;
                    return (
                      <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                        <span>{c.icon} {c.name}</span>
                        <span style={{ color: '#b02030', fontWeight: 600 }}>{fmt(spent)} / límite {fmt(c.budget)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ── Month comparison ── */}
        <h2 style={h2}>Comparación con {prevLabel}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Concepto</th>
              <th style={{ ...th, textAlign: 'right' }}>{label}</th>
              <th style={{ ...th, textAlign: 'right' }}>{prevLabel}</th>
              <th style={{ ...th, textAlign: 'right' }}>Variación</th>
              <th style={{ ...th, textAlign: 'right' }}>Δ Monto</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Ingresos',   curr: income,  prev: prevIncome,  inv: false },
              { label: 'Gastos',     curr: expense, prev: prevExpense, inv: true },
              { label: 'Disponible', curr: balance, prev: prevIncome - prevExpense, inv: false },
            ].map(({ label: l, curr, prev, inv }) => {
              const diff = curr - prev;
              const pct  = prev !== 0 ? ((diff / prev) * 100).toFixed(1) : null;
              const up = diff >= 0;
              const color = inv ? (up ? '#b02030' : '#0a6640') : (up ? '#0a6640' : '#b02030');
              return (
                <tr key={l}>
                  <td style={cell}><strong>{l}</strong></td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{fmt(curr)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#888' }}>{fmt(prev)}</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color }}>{pct !== null ? `${up ? '+' : ''}${pct}%` : '—'}</td>
                  <td style={{ ...cell, textAlign: 'right', color }}>{diff >= 0 ? '+' : ''}{fmt(diff)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e0e0e0', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
          My Wallet — Informe generado el {todayStr} para {currentUser?.name}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

const PERIOD_OPTIONS = [
  { id: 'this_month',   label: 'Este mes' },
  { id: 'last_month',   label: 'Mes pasado' },
  { id: 'last_3months', label: 'Últimos 3 meses' },
  { id: 'this_year',    label: 'Este año' },
  { id: 'custom',       label: 'Rango personalizado' },
];

function buildRange(period, customFrom, customTo) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today = iso(now);

  switch (period) {
    case 'this_month': {
      const m = now.getMonth(), y = now.getFullYear();
      const pm = m === 0 ? 11 : m - 1, py = m === 0 ? y - 1 : y;
      return {
        from: `${y}-${pad(m+1)}-01`, to: today,
        label: `${MONTHS[m]} ${y}`,
        prevFrom: `${py}-${pad(pm+1)}-01`, prevTo: iso(new Date(y, m, 0)),
        prevLabel: `${MONTHS[pm]} ${py}`,
      };
    }
    case 'last_month': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return {
        from: iso(d), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        prevFrom: iso(p), prevTo: iso(new Date(d.getFullYear(), d.getMonth(), 0)),
        prevLabel: `${MONTHS[p.getMonth()]} ${p.getFullYear()}`,
      };
    }
    case 'last_3months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const ps    = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        from: iso(start), to: today, label: 'Últimos 3 meses',
        prevFrom: iso(ps), prevTo: iso(new Date(start.getFullYear(), start.getMonth(), 0)),
        prevLabel: '3 meses anteriores',
      };
    }
    case 'this_year': {
      const y = now.getFullYear();
      return {
        from: `${y}-01-01`, to: today, label: `Año ${y}`,
        prevFrom: `${y-1}-01-01`, prevTo: `${y-1}-12-31`,
        prevLabel: `Año ${y-1}`,
      };
    }
    case 'custom': {
      if (!customFrom || !customTo) return { from: '', to: '', label: 'Rango personalizado', prevFrom: '', prevTo: '', prevLabel: 'Período anterior' };
      const ms   = new Date(customTo) - new Date(customFrom);
      const days = Math.ceil(ms / 86400000) + 1;
      const prevTo   = new Date(new Date(customFrom) - 86400000);
      const prevFrom = new Date(+prevTo - (days - 1) * 86400000);
      return {
        from: customFrom, to: customTo, label: `${customFrom} — ${customTo}`,
        prevFrom: iso(prevFrom), prevTo: iso(prevTo), prevLabel: 'Período anterior',
      };
    }
    default: return { from: '', to: '', label: '', prevFrom: '', prevTo: '', prevLabel: '' };
  }
}

// ── Budget Report overlay ─────────────────────────────
function BudgetReport({ onClose, label, periodTxs, categories, currentUser }) {
  const todayStr = new Date().toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const spendingMap = {};
  periodTxs.filter(t => t.type === 'expense').forEach(t => {
    spendingMap[t.cat] = (spendingMap[t.cat] || 0) + t.amount;
  });

  const budgeted   = categories.filter(c => (c.budget || 0) > 0).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const unbudgeted = categories.filter(c => !(c.budget > 0)).sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const totalBudget = budgeted.reduce((s, c) => s + c.budget, 0);
  const totalSpent  = budgeted.reduce((s, c) => s + (spendingMap[c.name] || 0), 0);
  const available   = totalBudget - totalSpent;
  const totalPct    = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const rawTotalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const budgetBarColor = rawTotalPct >= 100 ? '#b02030' : rawTotalPct >= 80 ? '#b8960a' : '#0a6640';

  const h2 = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: 6, marginBottom: 12, marginTop: 24 };
  const initials = currentUser?.name?.slice(0, 2).toUpperCase() || '??';

  const content = (
    <div className="rpt-portal" style={{ position: 'fixed', inset: 0, background: 'white', overflowY: 'auto', zIndex: 300, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Controls */}
      <div className="rpt-controls" style={{ position: 'sticky', top: 0, background: '#f5f5f5', borderBottom: '1px solid #ddd', padding: '10px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ marginRight: 'auto', fontSize: 14, fontWeight: 600, color: '#333' }}>Reporte de Presupuesto — {label}</span>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🖨️ Imprimir / PDF</button>
        <button onClick={onClose} style={{ padding: '8px 14px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕ Cerrar</button>
      </div>

      <div className="rpt-page" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px', color: '#111' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '3px solid #111', paddingBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>MY WALLET</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Reporte de Presupuesto — {label}</div>
          <div style={{ fontSize: 13, color: '#555', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span>Usuario: <strong>{currentUser?.name}</strong></span>
            <span>Generado: <strong>{todayStr}</strong></span>
          </div>
        </div>

        {/* 1. Resumen general */}
        <h2 style={h2}>Resumen General</h2>
        {totalBudget === 0 ? (
          <p style={{ color: '#888', fontSize: 13 }}>No hay presupuestos configurados. Asigna límites en la sección Presupuesto.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Presupuesto total',  value: fmt(totalBudget), color: '#111' },
                { label: 'Total gastado',       value: fmt(totalSpent),  color: '#b02030' },
                { label: 'Disponible restante', value: fmt(available),   color: available >= 0 ? '#0a6640' : '#b02030' },
                { label: '% utilizado',         value: `${Math.round(rawTotalPct)}%`, color: budgetBarColor },
              ].map(({ label: l, value, color }) => (
                <div key={l} style={{ padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 12, background: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${totalPct}%`, background: budgetBarColor, borderRadius: 6, transition: 'width 0.4s' }} />
            </div>
            {rawTotalPct >= 100 && (
              <p style={{ fontSize: 12, color: '#b02030', fontWeight: 600 }}>⚠️ Has superado el presupuesto total del período.</p>
            )}
          </>
        )}

        {/* 2. Detalle por categoría */}
        {budgeted.length > 0 && (
          <>
            <h2 style={h2}>Detalle por Categoría</h2>
            <div>
              {budgeted.map(c => {
                const spent     = spendingMap[c.name] || 0;
                const avail     = c.budget - spent;
                const rawPct    = (spent / c.budget) * 100;
                const pct       = Math.min(rawPct, 100);
                const over      = spent > c.budget ? spent - c.budget : 0;
                const barColor  = rawPct >= 100 ? '#b02030' : rawPct >= 80 ? '#b8960a' : '#0a6640';
                const rowBg     = over > 0 ? '#fff5f5' : 'transparent';
                return (
                  <div key={c.name} style={{ padding: '12px 0', borderBottom: '1px solid #eee', background: rowBg }}>
                    {/* Row 1: icon + name + % */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{Math.round(rawPct)}%</span>
                      {over > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#b02030', background: '#ffe0e0', padding: '2px 6px', borderRadius: 4 }}>Excedido +{fmt(over)}</span>}
                    </div>
                    {/* Row 2: bar */}
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4 }} />
                    </div>
                    {/* Row 3: límite · gastado · disponible */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                      <span>Límite: <strong style={{ color: '#111' }}>{fmt(c.budget)}</strong></span>
                      <span>Gastado: <strong style={{ color: '#b02030' }}>{fmt(spent)}</strong></span>
                      <span>Disponible: <strong style={{ color: avail >= 0 ? '#0a6640' : '#b02030' }}>{fmt(Math.abs(avail))}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 3. Categorías sin presupuesto */}
        {unbudgeted.length > 0 && (
          <>
            <h2 style={h2}>Sin Presupuesto Asignado</h2>
            <div>
              {unbudgeted.map(c => {
                const spent = spendingMap[c.name] || 0;
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{c.icon}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: spent > 0 ? 700 : 400, color: spent > 0 ? '#b02030' : '#aaa' }}>
                      {spent > 0 ? fmt(spent) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e0e0e0', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
          My Wallet — Reporte de Presupuesto generado el {todayStr} para {currentUser?.name}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default function Report() {
  const { transactions, categories, currentUser } = useApp();
  const [showFull, setShowFull]         = useState(false);
  const [showBudget, setShowBudget]     = useState(false);
  const [period, setPeriod]           = useState('this_month');
  const [customFrom, setCustomFrom]   = useState('');
  const [customTo, setCustomTo]       = useState('');

  const { from, to, label, prevFrom, prevTo, prevLabel } = useMemo(
    () => buildRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const periodTxs = useMemo(() =>
    from && to ? transactions.filter(t => t.date >= from && t.date <= to) : [],
    [transactions, from, to]
  );

  const prevTxs = useMemo(() =>
    prevFrom && prevTo ? transactions.filter(t => t.date >= prevFrom && t.date <= prevTo) : [],
    [transactions, prevFrom, prevTo]
  );

  const income  = periodTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = periodTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const prevIncome  = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevBalance = prevIncome - prevExpense;

  const catBreakdown = useMemo(() => {
    const totals = {};
    periodTxs.filter(t => t.type === 'expense').forEach(t => {
      totals[t.cat] = (totals[t.cat] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([name, spent]) => {
        const cat = categories.find(c => c.name === name) || { icon: '📦', color: '#8b90a7' };
        return { name, spent, pct: expense > 0 ? Math.round((spent / expense) * 100) : 0, ...cat };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [periodTxs, categories, expense]);

  const incomeBreakdown = useMemo(() => {
    const totals = {};
    periodTxs.filter(t => t.type === 'income').forEach(t => {
      totals[t.cat] = (totals[t.cat] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([name, amount]) => {
        const cat = categories.find(c => c.name === name) || { icon: '📦', color: '#8b90a7' };
        return { name, amount, pct: income > 0 ? Math.round((amount / income) * 100) : 0, ...cat };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodTxs, categories, income]);

  function exportCSV() {
    const rows = [
      [`Informe financiero — ${label}`], [],
      ['Resumen'], ['Concepto', 'Monto'],
      ['Ingresos', income.toFixed(2)], ['Gastos', expense.toFixed(2)], ['Disponible', balance.toFixed(2)],
      [], ['Gastos por categoría'], ['Categoría', 'Monto', 'Porcentaje'],
      ...catBreakdown.map(c => [c.name, c.spent.toFixed(2), c.pct + '%']),
      [], [`Comparación vs ${prevLabel}`], ['Concepto', label, prevLabel, 'Variación'],
      ['Ingresos', income.toFixed(2), prevIncome.toFixed(2), prevIncome > 0 ? (((income - prevIncome) / prevIncome) * 100).toFixed(1) + '%' : '—'],
      ['Gastos',   expense.toFixed(2), prevExpense.toFixed(2), prevExpense > 0 ? (((expense - prevExpense) / prevExpense) * 100).toFixed(1) + '%' : '—'],
    ];
    const csv = '﻿' + rows.map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `informe-${label.replace(/\s/g, '-').toLowerCase()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const pillStyle = active => ({
    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    border: '1px solid var(--border)', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--muted)',
    transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
  });

  const balClass = balance >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Informe — {label}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle} onClick={exportCSV}>📥 CSV</button>
          <button
            onClick={() => setShowBudget(true)}
            style={{ ...btnStyle, background: '#0a6640', color: '#fff', border: 'none', fontWeight: 700 }}
          >
            💰 Reporte Presupuesto
          </button>
          <button
            onClick={() => setShowFull(true)}
            style={{ ...btnStyle, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700 }}
          >
            📋 Generar Informe
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: period === 'custom' ? 10 : 16 }}>
        {PERIOD_OPTIONS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={pillStyle(period === p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Desde</span>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="filter-select" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Hasta</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="filter-select" />
          </div>
        </div>
      )}

      {/* Compact summary line */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }}>
        <span style={{ color: 'var(--muted)' }}>Ingresos: <strong style={{ color: 'var(--green)' }}>{fmt(income)}</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ color: 'var(--muted)' }}>Gastos: <strong style={{ color: 'var(--red)' }}>{fmt(expense)}</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ color: 'var(--muted)' }}>Disponible: <strong style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(balance)}</strong></span>
      </div>

      {/* Income breakdown by category */}
      <div className="panel">
        <div className="panel-title">Ingresos por categoría</div>
        {incomeBreakdown.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin ingresos registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th style={{ width: 120 }}>Proporción</th>
              </tr>
            </thead>
            <tbody>
              {incomeBreakdown.map(cat => (
                <tr key={cat.name}>
                  <td>
                    <div className="tx-row">
                      <div className="tx-icon" style={{ background: `${cat.color}22`, fontSize: 16, marginRight: 10 }}>{cat.icon}</div>
                      <span className="tx-name">{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{fmt(cat.amount)}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>{cat.pct}%</td>
                  <td>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category breakdown */}
      <div className="panel">
        <div className="panel-title">Gastos por categoría</div>
        {catBreakdown.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin gastos registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th style={{ width: 120 }}>Proporción</th>
              </tr>
            </thead>
            <tbody>
              {catBreakdown.map(cat => (
                <tr key={cat.name}>
                  <td>
                    <div className="tx-row">
                      <div className="tx-icon" style={{ background: `${cat.color}22`, fontSize: 16, marginRight: 10 }}>
                        {cat.icon}
                      </div>
                      <span className="tx-name">{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>{fmt(cat.spent)}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>{cat.pct}%</td>
                  <td>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Month comparison */}
      <div className="panel">
        <div className="panel-title">
          Comparación con {prevLabel}
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', fontSize: 11, color: 'var(--muted)', padding: '0 0 8px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ flex: 1 }}>Concepto</span>
            <span style={{ minWidth: 90, textAlign: 'right' }}>{label}</span>
            <span style={{ minWidth: 80, textAlign: 'right', marginLeft: 12 }}>vs {prevLabel}</span>
          </div>
          <SummaryRow label="💚 Ingresos"   current={income}  previous={prevIncome}  invertColor={false} />
          <SummaryRow label="🔴 Gastos"     current={expense} previous={prevExpense} invertColor={true} />
          <SummaryRow label="✅ Disponible" current={balance} previous={prevBalance} invertColor={false} />
        </div>
        {prevTxs.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            No hay datos de {prevLabel} para comparar.
          </p>
        )}
      </div>

      <div style={{ height: 120 }} />

      {showFull && (
        <FullReport
          onClose={() => setShowFull(false)}
          data={{ label, income, expense, balance, incomeBreakdown, catBreakdown,
                  monthTxs: periodTxs, categories, prevIncome, prevExpense, prevLabel }}
        />
      )}

      {showBudget && (
        <BudgetReport
          onClose={() => setShowBudget(false)}
          label={label}
          periodTxs={periodTxs}
          categories={categories}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
