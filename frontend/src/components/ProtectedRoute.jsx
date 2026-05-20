import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="full-page-loader">
        <span className="spinner" /> Loading session…
      </div>
    );
  }
  if (status !== 'authed') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
