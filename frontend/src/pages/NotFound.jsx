import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center' }}>
        <h2>404</h2>
        <p className="muted">We couldn’t find that page.</p>
        <Link className="btn btn-secondary btn-sm" to="/dashboard" style={{ marginTop: 12 }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
