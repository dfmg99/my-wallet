export default function FAB({ onClick }) {
  return (
    <button className="fab" onClick={onClick} title="Nueva transacción" aria-label="Agregar transacción">
      +
    </button>
  );
}
