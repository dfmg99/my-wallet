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

const AVATAR_COLORS = [
  '#6c63ff','#22d3a5','#f45b7a','#f59e0b',
  '#3b82f6','#a78bfa','#34d399','#f472b6',
  '#ef4444','#10b981','#0ea5e9','#e85d04',
];

const inp = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

// ── Profile edit modal ────────────────────────────────
function ProfileModal({ user, onClose }) {
  const { updateUser } = useApp();
  const [name,  setName]  = useState(user.name  || '');
  const [color, setColor] = useState(user.avatarColor || '#6c63ff');
  const [bio,   setBio]   = useState(user.bio   || '');
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) return setError('El nombre es obligatorio.');
    setError(''); setBusy(true);
    try {
      await updateUser({ name: name.trim(), avatarColor: color, bio: bio.trim() });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const initials = name.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Editar perfil</h2>

        {/* Avatar preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#fff' }}>
            {initials}
          </div>
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={inp}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>

        <div className="form-group">
          <label>Color del avatar</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {AVATAR_COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s',
                flexShrink: 0,
              }} />
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: 'var(--muted)' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
              Custom
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Nota personal <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Agrega una nota o descripción..." maxLength={200}
            style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', marginTop: 3 }}>{bio.length}/200</div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{error}</div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AppHeader ─────────────────────────────────────────
export default function AppHeader({ onQuickOpen, onNavigate }) {
  const {
    currentUser, logout, theme, toggleTheme,
    transactions, viewYear, viewMonth, changeMonth,
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    if (!dropdownOpen) return;
    const h = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropdownOpen]);

  const initials    = currentUser?.name?.slice(0, 2).toUpperCase() || '??';
  const avatarColor = currentUser?.avatarColor || '#6c63ff';
  const label       = `${MONTHS[viewMonth]} ${viewYear}`;

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

  const menuItem = (icon, label, onClick, color) => (
    <button onClick={() => { setDropdownOpen(false); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '11px 16px', background: 'none',
        border: 'none', color: color || 'var(--text)', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <header className="app-header">
      <div className="app-header-top">
        {/* Logo — navigates to overview */}
        <div className="app-logo" onClick={() => onNavigate?.('overview')}
          style={{ cursor: 'pointer', userSelect: 'none' }} title="Ir a Visión General">
          My <span>Wallet</span>
        </div>

        <div className="header-controls">
          <button className="theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div className="header-avatar" onClick={() => setDropdownOpen(o => !o)}
              style={{ cursor: 'pointer', background: avatarColor }} title="Perfil">
              {initials}
            </div>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, minWidth: 230, zIndex: 50,
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)', overflow: 'hidden',
              }}>
                {/* User info */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
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
                  {currentUser?.bio && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
                      {currentUser.bio}
                    </div>
                  )}
                </div>

                {menuItem('✏️', 'Editar perfil', () => setProfileOpen(true))}
                <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                {menuItem('🚪', 'Cerrar sesión', logout, 'var(--red)')}
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

      {profileOpen && currentUser && (
        <ProfileModal user={currentUser} onClose={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
