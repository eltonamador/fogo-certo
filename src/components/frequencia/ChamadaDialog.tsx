import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, Clock, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Aula, Presenca, StatusPresenca } from '@/types/frequencia';

interface ChamadaDialogProps {
  open: boolean;
  onClose: () => void;
  aula: Aula;
}

const STATUS_CONFIG = {
  PRESENTE: { label: 'Presente', icon: CheckCircle2, color: 'text-green-600' },
  AUSENTE: { label: 'Ausente', icon: XCircle, color: 'text-red-600' },
  JUSTIFICADO: { label: 'Justificado', icon: AlertCircle, color: 'text-yellow-600' },
  ATRASO: { label: 'Atraso', icon: Clock, color: 'text-orange-600' },
};

export function ChamadaDialog({ open, onClose, aula }: ChamadaDialogProps) {
  const queryClient = useQueryClient();
  const [presencasMap, setPresencasMap] = useState<Record<string, StatusPresenca>>({});
  const [observacoesMap, setObservacoesMap] = useState<Record<string, string>>({});

  // Buscar presenças da aula
  const { data: presencas, isLoading } = useQuery({
    queryKey: ['presencas', aula.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presencas')
        .select(`
          *,
          aluno:profiles!presencas_aluno_id_fkey(id, nome, matricula, email)
        `)
        .eq('aula_id', aula.id)
        .order('aluno(nome)');

      if (error) throw error;
      return data as unknown as Presenca[];
    },
    enabled: open,
  });

  // Inicializar mapa de presenças
  useEffect(() => {
    if (presencas) {
      const map: Record<string, StatusPresenca> = {};
      const obsMap: Record<string, string> = {};
      presencas.forEach(p => {
        map[p.aluno_id] = p.status;
        if (p.observacao) obsMap[p.aluno_id] = p.observacao;
      });
      setPresencasMap(map);
      setObservacoesMap(obsMap);
    }
  }, [presencas]);

  // Salvar presenças
  const salvarMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(presencasMap).map(([aluno_id, status]) => ({
        aula_id: aula.id,
        aluno_id,
        status,
        observacao: observacoesMap[aluno_id] || null,
        updated_at: new Date().toISOString(),
      }));

      // Upsert (insert ou update)
      const { error } = await supabase
        .from('presencas')
        .upsert(updates, { onConflict: 'aula_id,aluno_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      toast.success('Chamada salva como rascunho');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar chamada: ' + error.message);
    },
  });

  // Publicar chamada
  const publicarMutation = useMutation({
    mutationFn: async () => {
      // Salvar presenças primeiro
      const updates = Object.entries(presencasMap).map(([aluno_id, status]) => ({
        aula_id: aula.id,
        aluno_id,
        status,
        observacao: observacoesMap[aluno_id] || null,
        updated_at: new Date().toISOString(),
      }));

      const { error: presencaError } = await supabase
        .from('presencas')
        .upsert(updates, { onConflict: 'aula_id,aluno_id' });

      if (presencaError) throw presencaError;

      // Publicar aula
      const { error } = await supabase.rpc('publicar_chamada', {
        p_aula_id: aula.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      toast.success('Chamada publicada! Alertas foram processados automaticamente.');
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao publicar chamada: ' + error.message);
    },
  });

  const handleStatusChange = (alunoId: string, status: StatusPresenca) => {
    setPresencasMap(prev => ({ ...prev, [alunoId]: status }));
  };

  const handleMarcarTodosPresentes = () => {
    const newMap: Record<string, StatusPresenca> = {};
    presencas?.forEach(p => {
      newMap[p.aluno_id] = 'PRESENTE';
    });
    setPresencasMap(newMap);
    toast.success('Todos marcados como presentes');
  };

  const contadores = presencas ? {
    total: presencas.length,
    presentes: Object.values(presencasMap).filter(s => s === 'PRESENTE').length,
    ausentes: Object.values(presencasMap).filter(s => s === 'AUSENTE').length,
    justificados: Object.values(presencasMap).filter(s => s === 'JUSTIFICADO').length,
    atrasos: Object.values(presencasMap).filter(s => s === 'ATRASO').length,
  } : { total: 0, presentes: 0, ausentes: 0, justificados: 0, atrasos: 0 };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chamada - {aula.titulo}</DialogTitle>
          <DialogDescription>
            {aula.disciplina?.nome} • {new Date(aula.data_aula).toLocaleDateString('pt-BR')} • {aula.hora_inicio}
          </DialogDescription>
        </DialogHeader>

        {/* Contadores */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{contadores.presentes}</div>
            <div className="text-xs text-muted-foreground">Presentes</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{contadores.ausentes}</div>
            <div className="text-xs text-muted-foreground">Ausentes</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{contadores.justificados}</div>
            <div className="text-xs text-muted-foreground">Justificados</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-2xl font-bold">{contadores.atrasos}</div>
            <div className="text-xs text-muted-foreground">Atrasos</div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarcarTodosPresentes}
          >
            Marcar Todos Presentes
          </Button>
        </div>

        {/* Lista de alunos */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !presencas || presencas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {presencas.map((presenca) => {
                const status = presencasMap[presenca.aluno_id] || presenca.status;
                return (
                  <div
                    key={presenca.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{presenca.aluno?.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {presenca.aluno?.matricula}
                        </div>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="flex gap-2">
                      {(Object.keys(STATUS_CONFIG) as StatusPresenca[]).map((s) => {
                        const config = STATUS_CONFIG[s];
                        const Icon = config.icon;
                        return (
                          <Button
                            key={s}
                            variant={status === s ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleStatusChange(presenca.aluno_id, s)}
                          >
                            <Icon className="h-4 w-4 mr-1" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Observação */}
                    {(status === 'JUSTIFICADO' || status === 'ATRASO') && (
                      <div>
                        <Label className="text-xs">Observação</Label>
                        <Textarea
                          placeholder="Digite uma observação..."
                          value={observacoesMap[presenca.aluno_id] || ''}
                          onChange={(e) =>
                            setObservacoesMap(prev => ({
                              ...prev,
                              [presenca.aluno_id]: e.target.value
                            }))
                          }
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => publicarMutation.mutate()}
            disabled={publicarMutation.isPending || aula.status === 'PUBLICADA'}
          >
            <Send className="h-4 w-4 mr-2" />
            Publicar Chamada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
