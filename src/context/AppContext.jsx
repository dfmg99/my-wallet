import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, dbToTx, txToDb, dbToCat, catToDb } from '../supabase';
import { DEFAULT_CATEGORIES } from '../utils/format';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);

  // Track locally-mutated IDs to skip duplicate realtime events
  const pendingTx  = useRef(new Set());
  const pendingCat = useRef(new Set());

  const [viewYear, setViewYear]   = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const changeMonth = useCallback((delta) => {
    setViewMonth(prev => {
      let m = prev + delta;
      if (m > 11) { setViewYear(y => y + 1); return 0; }
      if (m < 0)  { setViewYear(y => y - 1); return 11; }
      return m;
    });
  }, []);

  const [theme, setTheme] = useState(() => {
    const t = localStorage.getItem('mywallet_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    return t;
  });
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); localStorage.setItem('mywallet_theme', next);
  }, [theme]);

  // ── Data loaders ──────────────────────────────────────
  const loadTransactions = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setTransactions((data || []).map(dbToTx));
  }, []);

  const loadCategories = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('categories').select('*').eq('user_id', userId);
    if (error) return;

    const cats = (data || []).map(dbToCat);

    // Remove stale defaults no longer in DEFAULT_CATEGORIES
    const validNames = new Set(DEFAULT_CATEGORIES.map(c => c.name));
    const staleIds   = cats.filter(c => c.isDefault && !validNames.has(c.name)).map(c => c.id);
    if (staleIds.length > 0) {
      await supabase.from('categories').delete().in('id', staleIds);
    }

    setCategories(cats.filter(c => !staleIds.includes(c.id)));
  }, []);

  // ── Realtime subscriptions ────────────────────────────
  const setupRealtime = useCallback((userId) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
        if (pendingTx.current.delete(row.id)) return;
        setTransactions(prev => prev.find(t => t.id === row.id) ? prev : [dbToTx(row), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
        if (pendingTx.current.has(row.id)) return;
        setTransactions(prev => prev.map(t => t.id === row.id ? dbToTx(row) : t));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, ({ old: row }) => {
        setTransactions(prev => prev.filter(t => t.id !== row.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
        if (pendingCat.current.delete(row.id)) return;
        setCategories(prev => prev.find(c => c.id === row.id) ? prev : [...prev, dbToCat(row)]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
        if (pendingCat.current.has(row.id)) return;
        setCategories(prev => prev.map(c => c.id === row.id ? dbToCat(row) : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, ({ old: row }) => {
        setCategories(prev => prev.filter(c => c.id !== row.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Auth state listener ───────────────────────────────
  useEffect(() => {
    let cleanup = null;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const profile = await supabase.from('profiles').select('name').eq('id', u.id).single();
        setCurrentUser({ id: u.id, email: u.email, name: profile.data?.name || u.email });
        await Promise.all([loadTransactions(u.id), loadCategories(u.id)]);
        cleanup = setupRealtime(u.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const profile = await supabase.from('profiles').select('name').eq('id', u.id).single();
        setCurrentUser({ id: u.id, email: u.email, name: profile.data?.name || u.email });
        await Promise.all([loadTransactions(u.id), loadCategories(u.id)]);
        cleanup = setupRealtime(u.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null); setTransactions([]); setCategories([]);
        if (cleanup) { cleanup(); cleanup = null; }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (cleanup) cleanup();
    };
  }, [loadTransactions, loadCategories, setupRealtime]);

  // ── Auth actions ──────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    const userId = data.user.id;

    // Create profile
    await supabase.from('profiles').insert({ id: userId, name });

    // Seed default categories
    const seeds = DEFAULT_CATEGORIES.map(c => catToDb({ ...c, isDefault: c.isDefault }, userId));
    await supabase.from('categories').insert(seeds);
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) throw new Error('Correo o contraseña incorrectos.');
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateUser = useCallback(async (changes) => {
    if (changes.password) {
      const { error } = await supabase.auth.updateUser({ password: changes.password });
      if (error) throw new Error(error.message);
    }
    if (changes.name) {
      await supabase.from('profiles').update({ name: changes.name }).eq('id', currentUser.id);
      setCurrentUser(prev => ({ ...prev, name: changes.name }));
    }
  }, [currentUser]);

  const deleteUser = useCallback(async () => {
    const id = currentUser.id;
    await supabase.from('transactions').delete().eq('user_id', id);
    await supabase.from('categories').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    await supabase.auth.signOut();
  }, [currentUser]);

  // ── Transactions ──────────────────────────────────────
  const addTransaction = useCallback(async (tx) => {
    const { data, error } = await supabase
      .from('transactions').insert(txToDb(tx, currentUser.id)).select().single();
    if (error) throw error;
    const newTx = dbToTx(data);
    pendingTx.current.add(newTx.id);
    setTransactions(prev => [newTx, ...prev]);
  }, [currentUser]);

  const deleteTransaction = useCallback(async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback(async (id, changes) => {
    const dbChanges = {};
    const map = { desc: 'desc', amount: 'amount', type: 'type', cat: 'cat', date: 'date', method: 'method', status: 'status' };
    Object.keys(changes).forEach(k => { if (map[k]) dbChanges[map[k]] = changes[k]; });
    pendingTx.current.add(id);
    await supabase.from('transactions').update(dbChanges).eq('id', id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    setTimeout(() => pendingTx.current.delete(id), 2000);
  }, []);

  // ── Categories ────────────────────────────────────────
  const addCategory = useCallback(async (cat) => {
    const { data, error } = await supabase
      .from('categories').insert(catToDb(cat, currentUser.id)).select().single();
    if (error) throw error;
    const newCat = dbToCat(data);
    pendingCat.current.add(newCat.id);
    setCategories(prev => [...prev, newCat]);
  }, [currentUser]);

  const updateCategory = useCallback(async (id, changes) => {
    const dbChanges = {};
    const map = { name: 'name', icon: 'icon', color: 'color', budget: 'budget', type: 'type', isDefault: 'is_default' };
    Object.keys(changes).forEach(k => { if (map[k] !== undefined) dbChanges[map[k]] = changes[k]; });
    pendingCat.current.add(id);
    await supabase.from('categories').update(dbChanges).eq('id', id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
    setTimeout(() => pendingCat.current.delete(id), 2000);
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, transactions, categories, loading,
      register, loginWithEmail, logout, updateUser, deleteUser,
      addTransaction, deleteTransaction, updateTransaction,
      addCategory, updateCategory, deleteCategory,
      theme, toggleTheme,
      viewYear, viewMonth, changeMonth,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
