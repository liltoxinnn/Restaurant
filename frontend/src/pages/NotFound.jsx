import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-4 text-center">
      <p className="text-6xl font-bold text-primary-600">404</p>
      <h1 className="text-2xl font-semibold text-gray-800">Page not found</h1>
      <p className="max-w-sm text-gray-500">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
