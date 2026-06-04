import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCatInfo, fmt, MONTHS } from '../utils/format';

// ── Helpers ────────────────────────────────────────────
function groupByDate(txs) {
  const groups = {};
  txs.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function dateLabel(dateStr) {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getRange(period) {
  const now   = new Date();
  const today = isoDate(now);
  if (period === 'today')     return { from: today, to: today };
  if (period === 'yesterday') { const s = isoDate(new Date(+now - 86400000)); return { from: s, to: s }; }
  if (period === 'week')      { const day = now.getDay(); const diff = day === 0 ? 6 : day - 1; return { from: isoDate(new Date(+now - diff * 86400000)), to: today }; }
  if (period === 'month')     return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
  return null;
}

const PERIODS = [
  { id: 'today',     label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'week',      label: 'Esta semana' },
  { id: 'month',     label: 'Este mes' },
  { id: 'custom',    label: 'Rango' },
];

// ── Actions dropdown ───────────────────────────────────
function TxMenu({ onClose, onEdit, onChangeDate, onDelete }) {
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const menuItem = (label, color, onClick) => (
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
      position: 'absolute', right: 0, top: '110%',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, minWidth: 150, zIndex: 60,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)', overflow: 'hidden',
    }}>
      {menuItem('✏️  Editar',        null,         onEdit)}
      {menuItem('📅  Cambiar fecha', null,         onChangeDate)}
      <div style={{ height: 1, background: 'var(--border)' }} />
      {menuItem('🗑  Eliminar',      'var(--red)', onDelete)}
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────
function EditModal({ tx, onClose }) {
  const { updateTransaction, categories } = useApp();
  const [form, setForm] = useState({
    desc:   tx.desc,
    amount: tx.amount,
    type:   tx.type,
    cat:    tx.cat,
    date:   tx.date,
    method: tx.method || '',
  });

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function save() {
    const desc   = form.desc.trim();
    const amount = parseFloat(form.amount);
    if (!desc || !amount || amount <= 0 || !form.date) return;
    await updateTransaction(tx.id, { desc, amount, type: form.type, cat: form.cat, date: form.date, method: form.method });
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Editar transacción</h2>
        <div className="form-group">
          <label>Descripción</label>
          <input type="text" value={form.desc} onChange={e => set('desc', e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Monto ($)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Método de pago <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <select value={form.method} onChange={e => set('method', e.target.value)}>
            <option value="">— Seleccionar —</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta débito">Tarjeta débito</option>
            <option value="Tarjeta crédito">Tarjeta crédito</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function Transactions() {
  const { transactions, categories, deleteTransaction } = useApp();
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [datePeriod, setDatePeriod] = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [openMenuId, setOpenMenuId]   = useState(null);
  const [editTx, setEditTx]           = useState(null);
  const [changeDateId, setChangeDateId] = useState(null);

  const filtered = useMemo(() => {
    const range = datePeriod && datePeriod !== 'custom' ? getRange(datePeriod) : null;

    return transactions.filter(t => {
      if (search     && !t.desc.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterCat  && t.cat  !== filterCat)  return false;
      if (range) {
        if (t.date < range.from || t.date > range.to) return false;
      } else if (datePeriod === 'custom') {
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo   && t.date > dateTo)   return false;
      }
      return true;
    });
  }, [transactions, search, filterType, filterCat, datePeriod, dateFrom, dateTo]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await deleteTransaction(id);
    setOpenMenuId(null);
  }

  function togglePeriod(id) {
    setDatePeriod(prev => prev === id ? '' : id);
    setDateFrom('');
    setDateTo('');
  }

  const pillStyle = active => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    border: '1px solid var(--border)', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--muted)',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Transacciones</h2>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} total</span>
      </div>

      {/* Search + type + category */}
      <div className="filters">
        <input className="filter-input" type="text" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..." />
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Categorías</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Date period pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => togglePeriod(p.id)} style={pillStyle(datePeriod === p.id)}>
            {p.label}
          </button>
        ))}
        {datePeriod && (
          <button onClick={() => { setDatePeriod(''); setDateFrom(''); setDateTo(''); }}
            style={{ ...pillStyle(false), color: 'var(--red)', borderColor: 'var(--red)' }}>
            ✕ Quitar
          </button>
        )}
      </div>

      {/* Custom range inputs */}
      {datePeriod === 'custom' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Desde</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-select" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Hasta</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-select" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <p>No hay transacciones que coincidan</p>
        </div>
      )}

      {/* Transaction groups */}
      {groups.map(([date, txs]) => {
        const dayTotal = txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
        return (
          <div key={date} className="tx-date-group">
            <div className="tx-date-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{dateLabel(date)}</span>
              <span style={{ color: dayTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {dayTotal >= 0 ? '+' : ''}{fmt(Math.abs(dayTotal))}
              </span>
            </div>

            {txs.map(t => {
              const { icon, color } = getCatInfo(categories, t.cat);
              return (
                <div key={t.id} className="tx-list-item">
                  <div className="tx-list-icon" style={{ background: `${color}22` }}>{icon}</div>
                  <div className="tx-list-info">
                    <div className="tx-list-desc">{t.desc}</div>
                    <div className="tx-list-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{t.cat}</span>
                      {changeDateId === t.id && (
                        <input
                          type="date"
                          defaultValue={t.date}
                          autoFocus
                          onChange={async e => {
                            if (e.target.value) {
                              await updateTransaction(t.id, { date: e.target.value });
                              setChangeDateId(null);
                            }
                          }}
                          onBlur={() => setChangeDateId(null)}
                          onKeyDown={e => { if (e.key === 'Escape') setChangeDateId(null); }}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--accent)',
                            borderRadius: 7, padding: '3px 8px', color: 'var(--text)',
                            fontSize: 12, outline: 'none',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="tx-list-right" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div className={`tx-list-amount ${t.type === 'income' ? 'pos' : 'neg'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenuId(prev => prev === t.id ? null : t.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 15, letterSpacing: 1, padding: '2px 4px', borderRadius: 5,
                          color: openMenuId === t.id ? 'var(--accent)' : 'var(--muted)',
                          lineHeight: 1, transition: 'color 0.15s',
                        }}
                        title="Acciones"
                      >
                        ···
                      </button>
                    </div>
                    {t.method && <span className="tx-method-pill">{t.method}</span>}
                    {openMenuId === t.id && (
                      <TxMenu
                        onClose={() => setOpenMenuId(null)}
                        onEdit={() => { setEditTx(t); setOpenMenuId(null); }}
                        onChangeDate={() => { setChangeDateId(t.id); setOpenMenuId(null); }}
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ height: 120 }} />

      {editTx && <EditModal tx={editTx} onClose={() => setEditTx(null)} />}
    </div>
  );
}
