import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ToggleResult {
  success: boolean;
  previous_role: string;
  new_role: string;
  message: string;
}

export function useAdminToggle() {
  const [isToggling, setIsToggling] = useState(false);
  const [canToggle, setCanToggle] = useState<boolean | null>(null);
  const { refreshProfile } = useAuth();

  // Check if user can toggle admin
  const checkCanToggle = async () => {
    try {
      const { data, error } = await supabase.rpc('can_toggle_admin');

      if (error) {
        console.error('Error checking toggle permission:', error);
        setCanToggle(false);
        return false;
      }

      setCanToggle(data as boolean);
      return data as boolean;
    } catch (error) {
      console.error('Error in checkCanToggle:', error);
      setCanToggle(false);
      return false;
    }
  };

  // Toggle between instrutor and admin
  const toggleAdminRole = async () => {
    if (isToggling) return;

    setIsToggling(true);

    try {
      const { data, error } = await supabase.rpc('toggle_admin_role');

      if (error) {
        console.error('Error toggling role:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível alternar o papel',
          variant: 'destructive',
        });
        return { success: false, error };
      }

      const result = data as unknown as ToggleResult;

      // Refresh user profile and role
      await refreshProfile();

      // Show success message
      toast({
        title: 'Sucesso',
        description: result.message,
        variant: 'default',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in toggleAdminRole:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alternar o papel',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setIsToggling(false);
    }
  };

  return {
    canToggle,
    isToggling,
    checkCanToggle,
    toggleAdminRole,
  };
}
