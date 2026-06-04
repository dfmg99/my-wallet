import { useApp } from '../context/AppContext';
import { MONTHS, fmt } from '../utils/format';

const circleBtn = (bg) => ({
  width: 26, height: 26, borderRadius: '50%',
  background: bg, border: 'none', color: '#fff',
  fontSize: 18, fontWeight: 400, lineHeight: 1,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'opacity 0.15s',
});

export default function AppHeader({ onQuickOpen }) {
  const {
    currentUser, logout, theme, toggleTheme,
    transactions, viewYear, viewMonth, changeMonth,
  } = useApp();

  const initials = currentUser?.name?.slice(0, 2).toUpperCase() || '??';
  const label = `${MONTHS[viewMonth]} ${viewYear}`;

  const monthTxs = transactions.filter(t => {
    const [ty, tm] = t.date.split('-').map(Number);
    return ty === viewYear && (tm - 1) === viewMonth;
  });

  const income  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // All-time balance for the big number
  const allIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = allIncome - allExpense;
  const balClass = totalBalance > 0 ? 'green' : totalBalance < 0 ? 'red' : 'accent';

  const balClass2 = balance > 0 ? 'green' : balance < 0 ? 'red' : 'accent';

  return (
    <header className="app-header">
      <div className="app-header-top">
        <div className="app-logo">My <span>Wallet</span></div>
        <div className="header-controls">
          <button className="theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="header-avatar" onClick={logout} title={`${currentUser?.name} — Cerrar sesión`}>
            {initials}
          </div>
        </div>
      </div>

      <div className="balance-section">
        <div className="balance-label">Saldo total</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button style={circleBtn('var(--red)')}   onClick={() => onQuickOpen('expense')} title="Gasto rápido">−</button>
          <div className={`balance-amount ${balClass}`}>{fmt(totalBalance)}</div>
          <button style={circleBtn('var(--green)')} onClick={() => onQuickOpen('income')} title="Ingreso rápido">+</button>
        </div>
      </div>

      <div className="month-nav">
        <button className="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
        <span className="month-nav-label">{label}</span>
        <button className="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
      </div>

      <div className="header-metrics">
        <div className="metric-item">
          <div className="metric-label">Gastos</div>
          <div className="metric-value red">{fmt(expense)}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Disponible</div>
          <div className={`metric-value ${balClass2}`}>{fmt(balance)}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Ingresos</div>
          <div className="metric-value green">{fmt(income)}</div>
        </div>
      </div>
    </header>
  );
}
