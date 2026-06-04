import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';
import { fmt, MONTHS_SHORT } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const today = () => new Date().toISOString().split('T')[0];

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed)}` } },
  },
};

const inpStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--accent)',
  borderRadius: 8,
  padding: '6px 10px',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  flex: 1,
  minWidth: 0,
};

export default function Overview() {
  const { transactions, categories, viewYear, viewMonth, addTransaction } = useApp();
  const [activeCat, setActiveCat]   = useState(null);
  const [quickAmt, setQuickAmt]     = useState('');
  const [chartView, setChartView]   = useState('daily');
  const [chartType, setChartType]   = useState('expense'); // 'expense' | 'income'

  const monthTxs = useMemo(() =>
    transactions.filter(t => {
      const [ty, tm] = t.date.split('-').map(Number);
      return ty === viewYear && (tm - 1) === viewMonth;
    }),
    [transactions, viewYear, viewMonth]
  );

  // ── Datos por tipo seleccionado ──────────────────────
  const spending = {};
  monthTxs.filter(t => t.type === chartType).forEach(t => {
    spending[t.cat] = (spending[t.cat] || 0) + t.amount;
  });
  const totalExpense = monthTxs
    .filter(t => t.type === chartType)
    .reduce((s, t) => s + t.amount, 0);

  const catList = [...categories]
    .filter(c => chartType === 'income' ? c.type === 'income' : c.type !== 'income')
    .sort((a, b) => (spending[b.name] || 0) - (spending[a.name] || 0));
  const withSpending = catList.filter(c => spending[c.name] > 0);

  // ── Dona ────────────────────────────────────────────
  const donutData = {
    labels: withSpending.map(c => c.name),
    datasets: [{
      data: withSpending.map(c => spending[c.name]),
      backgroundColor: withSpending.map(c => c.color),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  // ── Barras apiladas por categoría ────────────────────
  const { barData, barOpts, chartCats } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const tickOpts = { color: '#8b90a7', font: { size: 8 } };
    const amountTick = v => v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : v > 0 ? '$' + v : '';

    // ── Income view: one bar per category ───────────────
    if (chartType === 'income') {
      const incomeCats = categories.filter(c => c.type === 'income');
      const labels  = incomeCats.map(c => c.name);
      const data    = incomeCats.map(c => spending[c.name] || 0);
      const colors  = incomeCats.map(c => c.color || '#10b981');
      return {
        barData: {
          labels,
          datasets: [{ label: 'Ingresos', data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }],
        },
        barOpts: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: tickOpts },
            y: { grid: { color: '#2e324840' }, ticks: { ...tickOpts, callback: amountTick },
                 beginAtZero: true },
          },
        },
        chartCats: incomeCats.filter((_, i) => data[i] > 0),
      };
    }

    // ── Expense view: stacked by category (daily/weekly) ─
    const activeCats = categories.filter(cat => cat.type !== 'income' && spending[cat.name] > 0);
    const stackOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.parsed.y > 0 ? ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` : null } },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { ...tickOpts, maxTicksLimit: chartView === 'daily' ? 10 : 4 } },
        y: { stacked: true, grid: { color: '#2e324840' }, ticks: { ...tickOpts, callback: amountTick } },
      },
    };

    if (chartView === 'daily') {
      const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const datasets = activeCats.length > 0
        ? activeCats.map(cat => ({
            label: cat.name,
            data: labels.map((_, di) =>
              monthTxs.filter(t => t.type === 'expense' && t.cat === cat.name && parseInt(t.date.split('-')[2]) - 1 === di)
                .reduce((s, t) => s + t.amount, 0)
            ),
            backgroundColor: cat.color, borderRadius: 2, borderSkipped: false, stack: 'total',
          }))
        : [{ label: '', data: new Array(daysInMonth).fill(0), backgroundColor: 'transparent', stack: 'total' }];
      return { barData: { labels, datasets }, barOpts: stackOpts, chartCats: activeCats };
    }

    const weekLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const datasets = activeCats.length > 0
      ? activeCats.map(cat => ({
          label: cat.name,
          data: [0,1,2,3].map(w => {
            const start = w * 7 + 1, end = Math.min(start + 7, daysInMonth + 1);
            return monthTxs.filter(t => t.type === 'expense' && t.cat === cat.name)
              .filter(t => { const d = parseInt(t.date.split('-')[2]); return d >= start && d < end; })
              .reduce((s, t) => s + t.amount, 0);
          }),
          backgroundColor: cat.color, borderRadius: 4, borderSkipped: false, stack: 'total',
        }))
      : [{ label: '', data: [0,0,0,0], backgroundColor: 'transparent', stack: 'total' }];
    return { barData: { labels: weekLabels, datasets }, barOpts: stackOpts, chartCats: activeCats };
  }, [monthTxs, categories, spending, viewYear, viewMonth, chartView, chartType]);

  // ── Gasto rápido por categoría ───────────────────────
  // Detail section: fixed expense order, or income categories
  const EXPENSE_ORDER = [
    'Alimentación', 'Deudas', 'Entretenimiento', 'Restaurantes',
    'Salud', 'Servicios', 'Compras', 'Transporte', 'Vivienda',
  ];
  const detailCats = chartType === 'expense'
    ? EXPENSE_ORDER
        .map(name => categories.find(c => c.name === name))
        .filter(Boolean)
        .sort((a, b) => (spending[b.name] || 0) - (spending[a.name] || 0))
    : categories
        .filter(c => c.type === 'income')
        .sort((a, b) => (spending[b.name] || 0) - (spending[a.name] || 0));

  async function handleQuickAdd(e, cat) {
    e.preventDefault();
    const amt = parseFloat(quickAmt);
    if (isNaN(amt) || amt <= 0) return;
    try {
      await addTransaction({
        desc:   cat.name,
        amount: amt,
        type:   chartType,
        cat:    cat.name,
        date:   today(),
        status: 'done',
      });
      setActiveCat(null);
      setQuickAmt('');
    } catch (error) {
      alert('Error al guardar: ' + (error?.message || 'Intenta de nuevo.'));
    }
  }

  function toggleCat(id) {
    if (activeCat === id) { setActiveCat(null); setQuickAmt(''); }
    else { setActiveCat(id); setQuickAmt(''); }
  }

  const isExpense = chartType === 'expense';
  const typeColor = isExpense ? 'var(--red)' : 'var(--green)';

  return (
    <div>
      {/* ── Toggle Gastos / Ingresos ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'var(--surface2)', borderRadius: 12, padding: 3 }}>
        {[
          { id: 'expense', label: 'Gastos' },
          { id: 'income',  label: 'Ingresos' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => { setChartType(opt.id); setActiveCat(null); setQuickAmt(''); }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s',
              background: chartType === opt.id ? 'var(--surface)' : 'transparent',
              color: chartType === opt.id
                ? (opt.id === 'expense' ? 'var(--red)' : 'var(--green)')
                : 'var(--muted)',
              boxShadow: chartType === opt.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Panel: dona | barras ── */}
      <div className="panel">
        <div className="panel-title">Análisis</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Izquierda: dona + porcentajes compactos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              <div style={{ width: 108, height: 108, flexShrink: 0 }}>
                {withSpending.length > 0 ? (
                  <Doughnut data={donutData} options={DONUT_OPTS} />
                ) : (
                  <div style={{
                    width: 108, height: 108, borderRadius: '50%',
                    background: 'var(--surface2)', border: '2px dashed var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: 'var(--muted)', textAlign: 'center', padding: 14,
                  }}>
                    Sin gastos
                  </div>
                )}
              </div>

              {/* Lista compacta: punto + nombre + % juntos */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', borderLeft: '1px solid var(--border)', marginLeft: 12, paddingLeft: 12 }}>
                {withSpending.length === 0 ? (
                  <p style={{ fontSize: 10, color: 'var(--muted)' }}>Sin gastos este mes</p>
                ) : (
                  withSpending.map(cat => {
                    const pct = Math.round((spending[cat.name] / totalExpense) * 100);
                    return (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.icon} {cat.name}{' '}
                          <span style={{ fontWeight: 700, color: cat.color }}>{pct}%</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Derecha: selector + barras apiladas + leyenda */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Selector Diario / Semanal — solo en vista de Gastos */}
            {isExpense && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {['daily', 'weekly'].map(v => (
                  <button
                    key={v}
                    onClick={() => setChartView(v)}
                    style={{
                      padding: '3px 10px', fontSize: 10, fontWeight: 600,
                      border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
                      background: chartView === v ? 'var(--accent)' : 'var(--surface2)',
                      color: chartView === v ? '#fff' : 'var(--muted)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {v === 'daily' ? 'Diario' : 'Semanal'}
                  </button>
                ))}
              </div>
            )}

            {/* Gráfica */}
            <div style={{ height: 120 }}>
              <Bar data={barData} options={barOpts} />
            </div>

          </div>

        </div>
      </div>

      {/* ── Detalle completo: TODAS las categorías ── */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 4px' }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>
            {isExpense ? 'Detalle de gastos' : 'Detalle de ingresos'}
            {totalExpense > 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
                {fmt(totalExpense)} total
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            Toca el ícono de una categoría para registrar un gasto rápido
          </p>

        </div>

        {detailCats.map((cat, index) => {
          const spent    = spending[cat.name] || 0;
          const pct      = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;
          const isActive = activeCat === cat.id;
          const txCount  = monthTxs.filter(t => t.type === 'expense' && t.cat === cat.name).length;
          const isLast   = index === detailCats.length - 1;

          return (
            <div
              key={cat.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                borderBottom: isLast ? 'none' : '1px solid var(--border)66',
                background: index % 2 !== 0 ? 'var(--surface2)33' : 'transparent',
              }}
            >
              {/* Ícono circular */}
              <button
                onClick={() => toggleCat(cat.id)}
                title="Gasto rápido"
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? cat.color : `${cat.color}28`,
                  border: `2px solid ${isActive ? cat.color : cat.color + '66'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, cursor: 'pointer',
                  transition: 'background 0.15s',
                  boxShadow: isActive ? `0 2px 8px ${cat.color}44` : 'none',
                }}
              >
                {cat.icon}
              </button>

              {/* Contenido: nombre + barra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isActive ? (
                  <form onSubmit={e => handleQuickAdd(e, cat)}
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{cat.name}</span>
                    <input type="number" value={quickAmt} onChange={e => setQuickAmt(e.target.value)}
                      autoFocus placeholder="$0.00" step="0.01" min="0" style={inpStyle} />
                    <button type="submit" style={{ background: 'var(--red)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</button>
                    <button type="button" onClick={() => { setActiveCat(null); setQuickAmt(''); }}
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--muted)', cursor: 'pointer', padding: '6px 8px', fontSize: 12, flexShrink: 0 }}>✗</button>
                  </form>
                ) : (
                  <>
                    {/* Nombre con contador */}
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      {cat.name}
                      {txCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 5 }}>
                          ({txCount})
                        </span>
                      )}
                    </div>
                    {/* Fila: % | barra | monto */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pct > 0 ? cat.color : 'var(--border)', flexShrink: 0, minWidth: 28 }}>
                        {pct > 0 ? `${Math.round(pct)}%` : '0%'}
                      </span>
                      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: spent > 0 ? cat.color : 'var(--muted)', flexShrink: 0, minWidth: 68, textAlign: 'right', letterSpacing: '-0.2px' }}>
                        {fmt(spent)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer so the last item scrolls above the floating FABs */}
      <div style={{ height: 120 }} />
    </div>
  );
}
