import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileQuestion, Clock, BookOpen, Plus, Play, CheckCircle2, AlertCircle, Calendar, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avaliacao, Resposta, Disciplina } from '@/types/database';
import { AvaliacaoDialog } from '@/components/avaliacoes/AvaliacaoDialog';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AvaliacoesPage() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avaliacaoToDelete, setAvaliacaoToDelete] = useState<string | null>(null);

  const { data: avaliacoes, isLoading } = useQuery({
    queryKey: ['avaliacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*, disciplina:disciplinas(*)')
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Avaliacao[];
    },
  });

  const { data: respostas } = useQuery({
    queryKey: ['respostas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('respostas')
        .select('*')
        .eq('aluno_id', user.id);
      
      if (error) throw error;
      return data as unknown as Resposta[];
    },
    enabled: role === 'aluno',
  });

  const { data: disciplinas } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Disciplina[];
    },
  });

  const filteredAvaliacoes = avaliacoes?.filter(avaliacao => {
    if (filterDisciplina === 'todas') return true;
    return avaliacao.disciplina_id === filterDisciplina;
  });

  const getAvaliacaoStatus = (avaliacao: Avaliacao) => {
    const dataAvaliacao = new Date(avaliacao.data_hora);
    const resposta = respostas?.find(r => r.avaliacao_id === avaliacao.id);
    
    if (resposta) {
      return { status: 'concluida', label: 'Concluída', variant: 'default' as const };
    }
    if (isPast(dataAvaliacao)) {
      return { status: 'encerrada', label: 'Encerrada', variant: 'secondary' as const };
    }
    return { status: 'disponivel', label: 'Disponível', variant: 'destructive' as const };
  };

  const canCreate = role === 'admin' || role === 'instrutor';

  const deleteMutation = useMutation({
    mutationFn: async (avaliacaoId: string) => {
      const { error } = await supabase.from('avaliacoes').delete().eq('id', avaliacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      toast.success('Avaliação excluída!');
      setDeleteDialogOpen(false);
      setAvaliacaoToDelete(null);
    },
    onError: (error: any) => toast.error('Erro: ' + error.message),
  });

  // Stats
  const stats = {
    total: filteredAvaliacoes?.length || 0,
    concluidas: respostas?.length || 0,
    pendentes: (filteredAvaliacoes?.length || 0) - (respostas?.length || 0),
    mediaNotas: respostas?.length 
      ? (respostas.reduce((acc, r) => acc + (r.nota || 0), 0) / respostas.length).toFixed(1)
      : '0',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground">Provas, simulados e quizzes do curso</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas disciplinas</SelectItem>
              {disciplinas?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button variant="fire" onClick={() => { setSelectedAvaliacao(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards - Only for students */}
      {role === 'aluno' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileQuestion className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-success">{stats.concluidas}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendentes}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="text-2xl font-bold">{stats.mediaNotas}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Avaliacoes List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(null).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredAvaliacoes?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-muted-foreground">
                {filterDisciplina !== 'todas' 
                  ? 'Tente selecionar outra disciplina.' 
                  : 'As avaliações do curso aparecerão aqui.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvaliacoes?.map((avaliacao) => {
            const statusInfo = role === 'aluno' ? getAvaliacaoStatus(avaliacao) : null;
            const resposta = respostas?.find(r => r.avaliacao_id === avaliacao.id);
            
            return (
              <Card key={avaliacao.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${avaliacao.disciplina?.cor || '#1e3a5f'}20` }}
                      >
                        <FileQuestion className="h-6 w-6" style={{ color: avaliacao.disciplina?.cor || '#1e3a5f' }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{avaliacao.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(avaliacao.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {avaliacao.duracao_minutos} minutos
                          </div>
                          <Badge variant="outline">{avaliacao.disciplina?.nome}</Badge>
                        </div>
                        {avaliacao.descricao && (
                          <p className="text-sm text-muted-foreground mt-2">{avaliacao.descricao}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {role === 'aluno' && (
                        <>
                          {resposta && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Nota</p>
                              <p className="text-xl font-bold">{resposta.nota?.toFixed(1) || '-'}/{avaliacao.nota_maxima}</p>
                            </div>
                          )}
                          <Badge variant={statusInfo?.variant}>{statusInfo?.label}</Badge>
                          {statusInfo?.status === 'disponivel' && (
                            <Button variant="fire">
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar
                            </Button>
                          )}
                        </>
                      )}
                      {canCreate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setSelectedAvaliacao(avaliacao); setDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setAvaliacaoToDelete(avaliacao.id); setDeleteDialogOpen(true); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AvaliacaoDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedAvaliacao(null); }} avaliacao={selectedAvaliacao} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta avaliação?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => avaliacaoToDelete && deleteMutation.mutate(avaliacaoToDelete)} className="bg-destructive">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
