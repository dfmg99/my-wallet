const TABS = [
  { id: 'overview',     label: 'Visión General', emoji: '📊' },
  { id: 'transactions', label: 'Transacciones',  emoji: '💳' },
  { id: 'categories',   label: 'Categorías',     emoji: '📁' },
  { id: 'budget',       label: 'Presupuesto',    emoji: '💰' },
  { id: 'report',       label: 'Informe',        emoji: '📋' },
];

export default function BottomNav({ currentPage, onNavigate, onLogout }) {
  return (
    <nav className="bottom-nav">
      <div className="nav-logo-desk">My <span>Wallet</span></div>

      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab${currentPage === tab.id ? ' active' : ''}`}
          onClick={() => onNavigate(tab.id)}
        >
          <span className="tab-icon">{tab.emoji}</span>
          <span className="nav-tab-label">{tab.label}</span>
        </button>
      ))}

      <div className="nav-spacer" />

      <button className="nav-logout-btn" onClick={onLogout}>
        <span style={{ fontSize: 18 }}>🚪</span>
        Cerrar sesión
      </button>
    </nav>
  );
}
