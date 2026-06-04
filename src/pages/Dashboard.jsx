import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import DonutChart from '../components/DonutChart';
import TransactionRow from '../components/TransactionRow';
import TransactionModal from '../components/TransactionModal';
import CategoryBudgets from '../components/CategoryBudgets';
import { MONTHS, fmt } from '../utils/format';

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '7px 10px',
  color: 'var(--text)',
  fontSize: 12,
  outline: 'none',
  width: '100%',
};

function QuickStatCard({ label, value, valueClass, sub, type }) {
  const { categories, addTransaction } = useApp();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState(() => categories[0]?.name || '');

  const expenseCategories = categories;

  function handleToggle() {
    if (!open) {
      setCat(categories[0]?.name || '');
      setDesc('');
      setAmount('');
    }
    setOpen(prev => !prev);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!desc.trim() || !(parsedAmount > 0)) return;
    await addTransaction({
      type,
      desc: desc.trim(),
      amount: parsedAmount,
      cat: type === 'income' ? (categories[0]?.name || '') : cat,
      date: new Date().toISOString().split('T')[0],
      status: 'done',
    });
    setDesc('');
    setAmount('');
    setCat(categories[0]?.name || '');
    setOpen(false);
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="card-label" style={{ marginBottom: 0 }}>{label}</div>
        <button
          onClick={handleToggle}
          style={{
            width: 22,
            height: 22,
            background: open ? 'var(--surface2)' : 'var(--accent)',
            border: 'none',
            borderRadius: '50%',
            color: open ? 'var(--muted)' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}
          title={open ? 'Cerrar' : (type === 'income' ? 'Agregar ingreso rápido' : 'Agregar gasto rápido')}
        >
          {open ? '×' : (type === 'income' ? '+' : '−')}
        </button>
      </div>

      <div className={`card-value ${valueClass}`}>{value || '—'}</div>
      {!open && sub && <div className="card-sub">{sub}</div>}

      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          <input
            autoFocus
            type="text"
            placeholder="Descripción"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />
          {type === 'expense' && (
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              style={{ ...inputStyle }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            >
              {expenseCategories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0"
              style={{ ...inputStyle }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                padding: '0 12px',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ✓
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { transactions } = useApp();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [modalOpen, setModalOpen] = useState(false);

  function changeMonth(delta) {
    let m = month + delta, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m); setYear(y);
  }

  const monthTxs = useMemo(() =>
    transactions.filter(t => {
      const [ty, tm] = t.date.split('-').map(Number);
      return ty === year && (tm - 1) === month;
    }),
    [transactions, year, month]
  );

  const income  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const incCount = monthTxs.filter(t => t.type === 'income').length;
  const expCount = monthTxs.filter(t => t.type === 'expense').length;

  const badge = income > 0 ? {
    dir: balance >= 0 ? 'up' : 'down',
    pct: Math.abs(Math.round((balance / income) * 100)),
  } : null;

  // All-time balance
  const allIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const allTimeBalance = allIncome - allExpense;
  const allTimeValueClass = allTimeBalance > 0 ? 'green' : allTimeBalance < 0 ? 'red' : 'accent';

  const label = `${MONTHS[month]} ${year}`;

  return (
    <>
      <TopBar title="Dashboard" subtitle={label}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px 6px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 110, textAlign: 'center' }}>{label}</span>
          <button onClick={() => changeMonth(1)}  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>›</button>
        </div>
        <button className="add-btn" onClick={() => setModalOpen(true)}>+ Nueva transacción</button>
      </TopBar>

      <div className="cards">
        <div className="card">
          <div className="card-label">Saldo disponible</div>
          <div className={`card-value ${allTimeValueClass}`}>{fmt(allTimeBalance)}</div>
        </div>
        <QuickStatCard
          label="Ingresos del mes"
          value={income !== 0 ? fmt(income) : null}
          valueClass="green"
          sub={`${incCount} ${incCount === 1 ? 'transacción' : 'transacciones'}`}
          type="income"
        />
        <QuickStatCard
          label="Gastos del mes"
          value={expense !== 0 ? fmt(expense) : null}
          valueClass="red"
          sub={`${expCount} ${expCount === 1 ? 'transacción' : 'transacciones'}`}
          type="expense"
        />
        <StatCard
          label="Balance del mes"
          value={balance !== 0 ? fmt(balance) : null}
          valueClass="accent"
          badge={badge}
        />
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-title">Gastos por categoría</div>
          <DonutChart transactions={monthTxs} />
        </div>
        <div className="panel">
          <div className="panel-title">
            Transacciones recientes
            <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 400 }} onClick={() => onNavigate('transactions')}>
              Ver todas →
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthTxs.slice(0, 8).map(t => <TransactionRow key={t.id} tx={t} />)}
            </tbody>
          </table>
          {monthTxs.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Aún no hay transacciones. ¡Agrega una!
            </p>
          )}
        </div>
      </div>

      <CategoryBudgets monthTxs={monthTxs} />

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
