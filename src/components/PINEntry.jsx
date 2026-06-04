import { useState } from 'react';

const PAD = ['1','2','3','4','5','6','7','8','9',null,'0','⌫'];

export default function PINEntry({ user, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function append(digit) {
    if (pin.length >= 4 || error) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) verify(next);
  }

  function backspace() {
    if (error) return;
    setPin(p => p.slice(0, -1));
  }

  function verify(p) {
    if (p === String(user.pin)) {
      onSuccess(user);
    } else {
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 700);
    }
  }

  function handleKey(e) {
    if (e.key >= '0' && e.key <= '9') append(e.key);
    if (e.key === 'Backspace') backspace();
  }

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onKeyDown={handleKey}
      tabIndex={0}
      autoFocus
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 32px', width: 300, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, margin: '0 auto 12px' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{user.name}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Ingresa tu PIN</div>

        {/* Dots */}
        <div style={{
          display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 6,
          animation: error ? 'pinShake 0.5s ease' : 'none',
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: pin.length > i ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--border)',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>
        <div style={{ height: 20, marginBottom: 16, fontSize: 12, color: 'var(--red)' }}>
          {error ? 'PIN incorrecto' : ''}
        </div>

        {/* Number pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {PAD.map((key, i) =>
            key === null ? <div key={i} /> : (
              <button
                key={i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => key === '⌫' ? backspace() : append(key)}
                style={{
                  padding: '13px 0',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: key === '⌫' ? 'var(--muted)' : 'var(--text)',
                  fontSize: key === '⌫' ? 17 : 19,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
              >
                {key}
              </button>
            )
          )}
        </div>

        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}
