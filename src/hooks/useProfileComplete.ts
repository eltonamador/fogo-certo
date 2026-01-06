import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useProfileComplete() {
  const { profile, loading } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && profile) {
      // Verificar flag do banco
      setIsProfileComplete(profile.perfil_completo || false);
      setChecking(false);
    } else if (!loading) {
      setChecking(false);
    }
  }, [profile, loading]);

  return {
    isProfileComplete,
    checking
  };
}
