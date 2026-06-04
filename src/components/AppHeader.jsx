import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MONTHS, fmt } from '../utils/format';

const circleBtn = (bg) => ({
  width: 26, height: 26, borderRadius: '50%',
  background: bg, border: 'none', color: '#fff',
  fontSize: 18, fontWeight: 400, lineHeight: 1,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'opacity 0.15s',
});

export default function AppHeader({ onQuickOpen, onNavigate }) {
  const {
    currentUser, logout, theme, toggleTheme,
    transactions, viewYear, viewMonth, changeMonth,
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const initials = currentUser?.name?.slice(0, 2).toUpperCase() || '??';
  const label = `${MONTHS[viewMonth]} ${viewYear}`;

  const monthTxs = transactions.filter(t => {
    const [ty, tm] = t.date.split('-').map(Number);
    return ty === viewYear && (tm - 1) === viewMonth;
  });

  const income  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const allIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = allIncome - allExpense;
  const balClass  = totalBalance > 0 ? 'green' : totalBalance < 0 ? 'red' : 'accent';
  const balClass2 = balance > 0 ? 'green' : balance < 0 ? 'red' : 'accent';

  return (
    <header className="app-header">
      <div className="app-header-top">
        {/* Logo — click navigates to overview */}
        <div
          className="app-logo"
          onClick={() => onNavigate?.('overview')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Ir a Visión General"
        >
          My <span>Wallet</span>
        </div>

        <div className="header-controls">
          <button className="theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Avatar with dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              className="header-avatar"
              onClick={() => setDropdownOpen(o => !o)}
              title="Perfil"
              style={{ cursor: 'pointer' }}
            >
              {initials}
            </div>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, minWidth: 220, zIndex: 50,
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}>
                {/* User info */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--accent)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff',
                      flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser?.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 16px', background: 'none',
                    border: 'none', color: 'var(--red)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red)18'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span>🚪</span> Cerrar sesión
                </button>
              </div>
            )}
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
