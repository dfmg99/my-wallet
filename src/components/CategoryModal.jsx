import { useState, useEffect, useRef } from 'react';
import 'emoji-picker-element';
import { useApp } from '../context/AppContext';

const PRESET_COLORS = [
  '#22d3a5','#6c63ff','#f45b7a','#f59e0b',
  '#38bdf8','#a78bfa','#34d399','#f472b6',
  '#ef4444','#3b82f6','#f5c842','#10b981',
];

const DEFAULT = { name: '', icon: '📦', color: '#6c63ff', budget: '', type: 'expense' };

// Wraps emoji-picker custom element imperatively (React-safe)
function EmojiPickerEl({ onSelect, theme }) {
  const containerRef = useRef();
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const picker = document.createElement('emoji-picker');
    picker.style.width = '100%';
    picker.className = theme === 'dark' ? 'dark' : '';

    const handler = e => onSelectRef.current(e.detail.unicode);
    picker.addEventListener('emoji-click', handler);
    container.appendChild(picker);

    return () => {
      picker.removeEventListener('emoji-click', handler);
      if (container.contains(picker)) container.removeChild(picker);
    };
  }, []); // mount once

  useEffect(() => {
    const picker = containerRef.current?.querySelector('emoji-picker');
    if (picker) picker.className = theme === 'dark' ? 'dark' : '';
  }, [theme]);

  return <div ref={containerRef} />;
}

export default function CategoryModal({ initial, onSave, onClose }) {
  const { theme } = useApp();
  const [form, setForm]         = useState(DEFAULT);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setForm(initial
      ? { name: initial.name, icon: initial.icon, color: initial.color, budget: initial.budget > 0 ? String(initial.budget) : '', type: initial.type || 'expense' }
      : DEFAULT
    );
    setShowPicker(false);
  }, [initial]);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function handleSave() {
    const name = form.name.trim();
    if (!name) { alert('El nombre es obligatorio.'); return; }
    onSave({ name, icon: form.icon || '📦', color: form.color, budget: parseFloat(form.budget) || 0, type: form.type });
  }

  const isEdit = !!initial?.id;

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 400, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</h2>

        {/* Name */}
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Mascotas" autoFocus />
        </div>

        {/* Icon */}
        <div className="form-group">
          <label>Ícono</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: `${form.color}22`, border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, cursor: 'pointer',
            }} onClick={() => setShowPicker(s => !s)} title="Seleccionar emoji">
              {form.icon}
            </div>
            <button type="button" onClick={() => setShowPicker(s => !s)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', color: 'var(--text)',
              cursor: 'pointer', fontSize: 13,
            }}>
              {showPicker ? 'Cerrar selector' : '😀 Seleccionar emoji'}
            </button>
          </div>
        </div>

        {showPicker && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <EmojiPickerEl
              theme={theme}
              onSelect={emoji => { set('icon', emoji); setShowPicker(false); }}
            />
          </div>
        )}

        {/* Color */}
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {PRESET_COLORS.map(c => (
              <div key={c} onClick={() => set('color', c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.1s',
                flexShrink: 0,
              }} />
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--muted)' }}>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
              Custom
            </label>
          </div>
        </div>

        {/* Type */}
        <div className="form-group">
          <label>Tipo de categoría</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontWeight: 600, fontSize: 13,
                  border: `2px solid ${form.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                  background: form.type === t ? (t === 'income' ? '#10b98118' : '#ef444418') : 'var(--surface2)',
                  color: form.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t === 'income' ? '💚 Ingreso' : '🔴 Gasto'}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="form-group">
          <label>Presupuesto mensual ($) <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)}
            placeholder="Sin límite" min="0" step="0.01" />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
