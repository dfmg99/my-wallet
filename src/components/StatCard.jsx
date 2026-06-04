export default function StatCard({ label, value, valueClass, sub, badge }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className={`card-value ${valueClass}`}>{value || '—'}</div>
      {sub && <div className="card-sub">{sub}</div>}
      {badge && (
        <div className={`badge ${badge.dir}`}>
          {badge.dir === 'up' ? '↑' : '↓'} {badge.pct}%
        </div>
      )}
    </div>
  );
}
