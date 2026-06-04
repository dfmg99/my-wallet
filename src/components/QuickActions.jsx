import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const today = () => new Date().toISOString().split('T')[0];

const inp = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

export default function QuickActions({ panel, onClose, onOpenFull }) {
  const { addTransaction, categories } = useApp();
  const [desc, setDesc]     = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat]       = useState('');
  const [date, setDate]     = useState(today());
  const [err, setErr]       = useState('');

  // Reset form whenever the panel opens, filtering categories by type
  useEffect(() => {
    if (panel) {
      setDesc(''); setAmount(''); setErr('');
      const relevant = categories.filter(c => panel === 'income' ? c.type === 'income' : c.type !== 'income');
      setCat(relevant[0]?.name || '');
      setDate(today());
    }
  }, [panel]);

  // Lock body scroll while panel is open.
  // On mobile: position:fixed prevents the virtual keyboard from resizing the background.
  // Save & restore scrollY so the page doesn't jump to the top when closing.
  useEffect(() => {
    if (!panel) return;
    const scrollY        = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position    = 'fixed';
    document.body.style.top         = `-${scrollY}px`;
    document.body.style.width       = '100%';
    document.body.style.overflowY   = 'scroll';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      // Blur any focused input so iOS releases the viewport before we restore scroll
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      document.body.style.position    = '';
      document.body.style.top         = '';
      document.body.style.width       = '';
      document.body.style.overflowY   = '';
      document.body.style.paddingRight = '';

      // Small delay for iOS to finish releasing the keyboard before restoring scroll
      setTimeout(() => window.scrollTo(0, scrollY), 100);
    };
  }, [panel]);

  async function submit(e) {
    e.preventDefault();
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) {
      setErr('Ingresa un monto válido mayor que 0.');
      return;
    }
    const selectedCat = cat || categories[0]?.name;
    if (!selectedCat) {
      setErr('No hay categorías disponibles. Crea una primero.');
      return;
    }
    setErr('');
    try {
      await addTransaction({
        desc:   desc.trim() || (panel === 'income' ? 'Ingreso' : 'Gasto'),
        amount: a,
        type:   panel,
        cat:    selectedCat,
        date:   date || today(),
        status: 'done',
      });
      onClose();
    } catch (error) {
      setErr('Error al guardar: ' + (error?.message || 'Intenta de nuevo.'));
    }
  }

  if (!panel) return null;

  const isIncome    = panel === 'income';
  const accentColor = isIncome ? 'var(--green)' : 'var(--red)';

  return (
    <>
      <div className="quick-backdrop" onClick={onClose} />

      <div className="quick-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: accentColor }}>
            {isIncome ? '+ Ingreso rápido' : '− Gasto rápido'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}>
            ×
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            autoFocus
            style={inp}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {(() => {
            const relevant = categories.filter(c => isIncome ? c.type === 'income' : c.type !== 'income');
            return relevant.length > 0 ? (
              <select value={cat} onChange={e => setCat(e.target.value)} style={inp}>
                {relevant.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            ) : null;
          })()}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="$0.00"
              step="0.01"
              min="0"
              style={{ ...inp, flex: 1 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...inp, flex: 1 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          {err && (
            <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red)18', border: '1px solid var(--red)44', borderRadius: 8, padding: '7px 10px' }}>
              {err}
            </div>
          )}
          <button
            type="submit"
            style={{
              background: accentColor, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', padding: '11px 0',
            }}
          >
            Guardar
          </button>
          {onOpenFull && (
            <button
              type="button"
              onClick={onOpenFull}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, textAlign: 'right', padding: 0 }}
            >
              Más opciones →
            </button>
          )}
        </form>
      </div>
    </>
  );
}
