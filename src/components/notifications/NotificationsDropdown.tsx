import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notificacao } from '@/types/alertas';

const SEVERIDADE_ICONS = {
  INFO: Info,
  ALERTA: AlertTriangle,
  CRITICO: AlertCircle,
};

const SEVERIDADE_COLORS = {
  INFO: 'text-blue-600',
  ALERTA: 'text-yellow-600',
  CRITICO: 'text-red-600',
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Buscar notificações
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notificacoes')
        .select(`
          *,
          alerta:alertas(id, severidade, tipo, resolvido)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as Notificacao[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch a cada 30s
  });

  // Marcar notificação como lida
  const marcarLidaMutation = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase.rpc('marcar_notificacao_lida', {
        p_notificacao_id: notificacaoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  // Marcar todas como lidas
  const marcarTodasLidasMutation = useMutation({
    mutationFn: async () => {
      const naoLidas = notificacoes?.filter(n => !n.lida) || [];
      for (const notif of naoLidas) {
        await supabase.rpc('marcar_notificacao_lida', {
          p_notificacao_id: notif.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const handleNotificacaoClick = (notificacao: Notificacao) => {
    // Marcar como lida
    if (!notificacao.lida) {
      marcarLidaMutation.mutate(notificacao.id);
    }

    // Navegar para o alerta
    if (notificacao.url) {
      navigate(notificacao.url);
      setOpen(false);
    } else if (notificacao.alerta_id) {
      navigate(`/alertas`);
      setOpen(false);
    }
  };

  const naoLidas = notificacoes?.filter(n => !n.lida).length || 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {naoLidas > 9 ? '9+' : naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => marcarTodasLidasMutation.mutate()}
              disabled={marcarTodasLidasMutation.isPending}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : !notificacoes || notificacoes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notificacoes.map((notificacao) => {
              const Icon = notificacao.alerta?.severidade
                ? SEVERIDADE_ICONS[notificacao.alerta.severidade]
                : Bell;
              const iconColor = notificacao.alerta?.severidade
                ? SEVERIDADE_COLORS[notificacao.alerta.severidade]
                : 'text-gray-600';

              return (
                <DropdownMenuItem
                  key={notificacao.id}
                  className={`cursor-pointer p-3 focus:bg-muted ${
                    !notificacao.lida ? 'bg-blue-50 hover:bg-blue-100' : ''
                  }`}
                  onClick={() => handleNotificacaoClick(notificacao)}
                >
                  <div className="flex gap-3 w-full">
                    <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">
                          {notificacao.titulo}
                        </div>
                        {!notificacao.lida && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      {notificacao.corpo && (
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notificacao.corpo}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notificacao.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}

        {notificacoes && notificacoes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center cursor-pointer"
              onClick={() => {
                navigate('/alertas');
                setOpen(false);
              }}
            >
              Ver todos os alertas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
