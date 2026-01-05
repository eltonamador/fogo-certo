import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC, ROUTE_PERMISSIONS } from '@/hooks/useRBAC';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { canAccessRoute, role } = useRBAC();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!loading && user && role) {
      const currentPath = location.pathname;
      const permission = ROUTE_PERMISSIONS[currentPath];
      
      if (permission && !canAccessRoute(currentPath)) {
        toast.error('Acesso não permitido');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, user, role, location.pathname, canAccessRoute, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
