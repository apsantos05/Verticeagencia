export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando dashboard"
      className="loading-page"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-banner" />
      <div className="metrics-grid finance-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <span className="sr-only">Carregando seu workspace…</span>
    </div>
  );
}
