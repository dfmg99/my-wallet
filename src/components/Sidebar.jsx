const NAV_ITEMS = [
  { id: 'dashboard',     icon: '🏠', label: 'Dashboard' },
  { id: 'transactions',  icon: '💳', label: 'Transacciones' },
  { id: 'reports',       icon: '📊', label: 'Reportes' },
  { id: 'categories',    icon: '📁', label: 'Categorías' },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <nav className="sidebar">
      <div className="logo">My <span>Wallet</span></div>
      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`nav-item${currentPage === item.id ? ' active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </nav>
  );
}
