import { useState } from 'react';
import { useApp } from '../context/AppContext';

const today = () => new Date().toISOString().split('T')[0];

export default function TransactionModal({ open, onClose }) {
  const { addTransaction, categories } = useApp();
  const defaultCat = categories[0]?.name || '';
  const [form, setForm] = useState({ desc: '', amount: '', type: 'expense', cat: defaultCat, date: today(), method: '' });

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  const relevantCats = categories.filter(c =>
    form.type === 'income' ? c.type === 'income' : c.type !== 'income'
  );

  function handleTypeChange(e) {
    const newType = e.target.value;
    const cats = categories.filter(c => newType === 'income' ? c.type === 'income' : c.type !== 'income');
    setForm(p => ({ ...p, type: newType, cat: cats[0]?.name || '' }));
  }

  async function handleSave() {
    const desc = form.desc.trim();
    const amount = parseFloat(form.amount);
    if (!desc || !amount || amount <= 0 || !form.date) {
      alert('Por favor completa todos los campos.');
      return;
    }
    const cat = form.cat || (relevantCats[0]?.name ?? 'Otros');
    await addTransaction({ desc, amount, type: form.type, cat, date: form.date, status: 'done', method: form.method });
    setForm({ desc: '', amount: '', type: 'expense', cat, date: today(), method: '' });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Nueva transacción</h2>
        <div className="form-group">
          <label>Descripción</label>
          <input type="text" value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Ej: Supermercado Rey" autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Monto ($)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.type} onChange={handleTypeChange}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {relevantCats.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Método de pago <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <select value={form.method} onChange={e => set('method', e.target.value)}>
            <option value="">— Seleccionar —</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta débito">Tarjeta débito</option>
            <option value="Tarjeta crédito">Tarjeta crédito</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
