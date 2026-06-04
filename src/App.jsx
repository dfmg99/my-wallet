import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Budget from './pages/Budget';
import Report from './pages/Report';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import QuickActions from './components/QuickActions';
import TransactionModal from './components/TransactionModal';

function AppInner() {
  const { currentUser, loading, logout } = useApp();
  const [page, setPage] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [quickType, setQuickType] = useState(null); // null | 'income' | 'expense'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Cargando…
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  return (
    <div className="app-layout">
      <BottomNav currentPage={page} onNavigate={setPage} onLogout={logout} />

      <div className="app-main">
        <AppHeader onQuickOpen={setQuickType} onNavigate={setPage} />
        <div className="app-content">
          {page === 'overview'      && <Overview />}
          {page === 'transactions'  && <Transactions />}
          {page === 'categories'    && <Categories />}
          {page === 'budget'        && <Budget />}
          {page === 'report'        && <Report />}
        </div>
      </div>

      <QuickActions
        panel={quickType}
        onClose={() => setQuickType(null)}
        onOpenFull={() => { setQuickType(null); setModalOpen(true); }}
      />
      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
