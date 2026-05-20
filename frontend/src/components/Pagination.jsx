export default function Pagination({ page, totalPages, total, onChange }) {
  const prev = () => onChange(Math.max(page - 1, 1));
  const next = () => onChange(Math.min(page + 1, totalPages));

  return (
    <div className="pagination">
      <div>
        {total === 0 ? 'No results' : `Showing page ${page} of ${totalPages} · ${total} total`}
      </div>
      <div className="controls">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={prev}>
          ← Prev
        </button>
        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={next}>
          Next →
        </button>
      </div>
    </div>
  );
}
