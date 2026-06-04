import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useApp } from '../context/AppContext';
import { getCatInfo, fmt } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

const OPTIONS = {
  responsive: true,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#8b90a7', font: { size: 12 }, padding: 14, boxWidth: 12, borderRadius: 4 },
    },
    tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed)}` } },
  },
};

export default function DonutChart({ transactions }) {
  const { categories } = useApp();

  const catTotals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => { catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount; });

  const labels = Object.keys(catTotals);
  if (labels.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
        Sin gastos este mes
      </p>
    );
  }

  const data   = Object.values(catTotals);
  const colors = labels.map(l => getCatInfo(categories, l).color);

  return (
    <Doughnut
      data={{ labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] }}
      options={OPTIONS}
    />
  );
}
