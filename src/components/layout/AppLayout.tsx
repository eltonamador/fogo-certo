import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC, ROUTE_PERMISSIONS } from '@/hooks/useRBAC';
import { Sidebar } from './Sidebar';
import { MobileNav, MobileHeader } from './MobileNav';
import { ProfileWizardModal } from '@/components/profile/ProfileWizardModal';
import { useProfileComplete } from '@/hooks/useProfileComplete';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AppLayout() {
  const { user, loading } = useAuth();
  const { canAccessRoute, role } = useRBAC();
  const { isProfileComplete, checking } = useProfileComplete();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Verificar se deve mostrar wizard
  const shouldShowWizard = !checking && user && !isProfileComplete;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Profile Wizard Modal */}
      {shouldShowWizard && (
        <ProfileWizardModal open={true} />
      )}
    </div>
  );
}
