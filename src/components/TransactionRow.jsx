import { useApp } from '../context/AppContext';
import { getCatInfo, fmt, fmtDate } from '../utils/format';

export default function TransactionRow({ tx, showCat = false }) {
  const { deleteTransaction, categories } = useApp();
  const { icon, color } = getCatInfo(categories, tx.cat);

  async function handleDelete() {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await deleteTransaction(tx.id);
  }

  return (
    <tr>
      <td>
        <div className="tx-row">
          <div className="tx-icon" style={{ background: `${color}22` }}>{icon}</div>
          <div>
            <div className="tx-name">{tx.desc}</div>
            {!showCat && <div className="tx-cat">{tx.cat}</div>}
          </div>
        </div>
      </td>
      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(tx.date)}</td>
      <td className={`amount ${tx.type === 'income' ? 'pos' : 'neg'}`}>
        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
      </td>
      {showCat && <td><span style={{ fontSize: 12, color: 'var(--muted)' }}>{tx.cat}</span></td>}
      <td>
        <span className={`status-pill ${tx.status === 'done' ? 'done' : 'pend'}`}>
          {tx.status === 'done' ? 'Completado' : 'Pendiente'}
        </span>
      </td>
      <td>
        <button className="del-btn" title="Eliminar" onClick={handleDelete}>🗑</button>
      </td>
    </tr>
  );
}
