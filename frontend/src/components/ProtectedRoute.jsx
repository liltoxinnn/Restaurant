import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Access denied</h2>
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
