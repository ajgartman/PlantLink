import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');

  if (!token) {
    // No token found, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Token exists, show the protected page
  return <>{children}</>;
}

export default ProtectedRoute;