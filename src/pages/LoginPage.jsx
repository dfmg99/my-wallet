import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import { useApp } from '../context/AppContext';

const inp = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const focusAccent = e => e.target.style.borderColor = 'var(--accent)';
const blurBorder  = e => e.target.style.borderColor = 'var(--border)';

function Label({ children }) {
  return <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{children}</label>;
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red)18', border: '1px solid var(--red)44', borderRadius: 8, padding: '8px 12px' }}>
      {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ fontSize: 13, color: 'var(--green)', background: 'var(--green)18', border: '1px solid var(--green)44', borderRadius: 8, padding: '8px 12px' }}>
      {msg}
    </div>
  );
}

function SubmitBtn({ label, busy }) {
  return (
    <button type="submit" disabled={busy}
      style={{ background: 'var(--accent)', border: 'none', borderRadius: 12, color: '#fff', padding: '13px', fontWeight: 700, fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, transition: 'opacity 0.15s' }}>
      {busy ? 'Cargando…' : label}
    </button>
  );
}

export default function LoginPage() {
  const { loginWithEmail, register } = useApp();

  // Detect password recovery redirect from Supabase email link
  const [isRecovery, setIsRecovery] = useState(false);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isRecovery) return <ResetPasswordForm onDone={() => setIsRecovery(false)} />;

  return <AuthForm loginWithEmail={loginWithEmail} register={register} />;
}

// ── Main auth form (login / register / forgot) ────────
function AuthForm({ loginWithEmail, register }) {
  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [busy, setBusy]         = useState(false);

  function switchMode(m) { setMode(m); setError(''); setSuccess(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (mode === 'register') {
      if (!name.trim()) return setError('El nombre es obligatorio.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Correo inválido.');
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    } else if (mode === 'login') {
      if (!email.trim() || !password) return setError('Completa todos los campos.');
    } else {
      // forgot
      if (!email.trim()) return setError('Ingresa tu correo.');
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
        setSuccess('Cuenta creada. Revisa tu correo para confirmarla si es necesario.');
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (err) throw new Error(err.message);
        setSuccess('Correo enviado. Revisa tu bandeja de entrada para cambiar la contraseña.');
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, width: 400, maxWidth: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            My <span style={{ color: 'var(--text)' }}>Wallet</span>
          </div>
          {mode === 'forgot'
            ? <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>Recuperar contraseña</div>
            : <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Tus finanzas, bajo control</div>
          }
        </div>

        {/* Tab toggle */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 12, padding: 3, marginBottom: 24, gap: 3 }}>
            {[['login', 'Iniciar sesión'], ['register', 'Registrarse']].map(([m, label]) => (
              <button key={m} type="button" onClick={() => switchMode(m)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              }}>{label}</button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <Label>Nombre</Label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoFocus style={inp} onFocus={focusAccent} onBlur={blurBorder} />
            </div>
          )}

          <div>
            <Label>Correo electrónico</Label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" autoFocus={mode !== 'register'} style={inp} onFocus={focusAccent} onBlur={blurBorder} />
          </div>

          {mode !== 'forgot' && (
            <div>
              <Label>Contraseña {mode === 'register' && <span style={{ color: 'var(--border)' }}>(mín. 6 caracteres)</span>}</Label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} onFocus={focusAccent} onBlur={blurBorder} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: 2 }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          <ErrorBox msg={error} />
          <SuccessBox msg={success} />

          <SubmitBtn label={mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar correo'} busy={busy} />

          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('forgot')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}>
              ← Volver al login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Reset password form (after clicking recovery email link) ──
function ResetPasswordForm({ onDone }) {
  const [pass, setPass]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (pass.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (pass !== confirm) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: pass });
      if (err) throw new Error(err.message);
      await supabase.auth.signOut();
      onDone();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>My <span style={{ color: 'var(--text)' }}>Wallet</span></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>Nueva contraseña</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Nueva contraseña', 'Confirmar contraseña'].map((label, i) => (
            <div key={i}>
              <Label>{label}</Label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} value={i === 0 ? pass : confirm}
                  onChange={e => i === 0 ? setPass(e.target.value) : setConfirm(e.target.value)}
                  placeholder="Mínimo 6 caracteres" style={{ ...inp, paddingRight: 44 }}
                  onFocus={focusAccent} onBlur={blurBorder} autoFocus={i === 0} />
                {i === 0 && (
                  <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <ErrorBox msg={error} />
          <SubmitBtn label="Guardar nueva contraseña" busy={busy} />
        </form>
      </div>
    </div>
  );
}
