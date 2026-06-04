import { useApp } from '../context/AppContext';

export default function TopBar({ title, subtitle, children }) {
  const { currentUser, logout, theme, toggleTheme } = useApp();
  const initials = currentUser?.name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {children}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', lineHeight: 1 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div
          className="avatar"
          title={`${currentUser?.name} — Cerrar sesión`}
          onClick={logout}
          style={{ cursor: 'pointer' }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
