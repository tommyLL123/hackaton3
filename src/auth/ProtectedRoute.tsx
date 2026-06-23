import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { FullPageStatus } from '../components/Status';

export function ProtectedRoute() {
  const { token, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) return <FullPageStatus title="Restaurando sesión" message="Validando credenciales del operador." />;
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
