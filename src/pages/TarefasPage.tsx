import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, Clock, Upload, Plus, CheckCircle2, AlertCircle, XCircle, Calendar } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tarefa, Entrega, Disciplina, StatusEntrega } from '@/types/database';

const statusConfig: Record<StatusEntrega, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  pendente: { label: 'Pendente', icon: <Clock className="h-4 w-4" />, variant: 'secondary' },
  entregue: { label: 'Entregue', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' },
  avaliado: { label: 'Avaliado', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'outline' },
  atrasado: { label: 'Atrasado', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' },
};

export default function TarefasPage() {
  const { role, user } = useAuth();
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
        .order('prazo', { ascending: true });
      
      if (error) throw error;
      return data as unknown as Tarefa[];
    },
  });

  const { data: entregas } = useQuery({
    queryKey: ['entregas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('entregas')
        .select('*')
        .eq('aluno_id', user.id);
      
      if (error) throw error;
      return data as unknown as Entrega[];
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

  const getTarefaStatus = (tarefa: Tarefa): StatusEntrega => {
    const entrega = entregas?.find(e => e.tarefa_id === tarefa.id);
    if (entrega) return entrega.status;
    if (isPast(new Date(tarefa.prazo))) return 'atrasado';
    return 'pendente';
  };

  const filteredTarefas = tarefas?.filter(tarefa => {
    const matchesDisciplina = filterDisciplina === 'todas' || tarefa.disciplina_id === filterDisciplina;
    const status = getTarefaStatus(tarefa);
    const matchesStatus = filterStatus === 'todos' || status === filterStatus;
    return matchesDisciplina && matchesStatus;
  });

  // Stats
  const stats = {
    total: tarefas?.length || 0,
    pendentes: tarefas?.filter(t => getTarefaStatus(t) === 'pendente').length || 0,
    entregues: tarefas?.filter(t => ['entregue', 'avaliado'].includes(getTarefaStatus(t))).length || 0,
    atrasadas: tarefas?.filter(t => getTarefaStatus(t) === 'atrasado').length || 0,
  };

  const canCreate = role === 'admin' || role === 'instrutor';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">Atividades e entregas do curso</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {disciplinas?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="entregue">Entregues</SelectItem>
              <SelectItem value="atrasado">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
          {canCreate && (
            <Button variant="fire">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
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
                  <ListTodo className="h-5 w-5 text-primary" />
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
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold text-success">{stats.entregues}</p>
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
                  <p className="text-sm text-muted-foreground">Atrasadas</p>
                  <p className="text-2xl font-bold text-destructive">{stats.atrasadas}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tarefas List */}
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
        ) : filteredTarefas?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground">
                {filterDisciplina !== 'todas' || filterStatus !== 'todos'
                  ? 'Tente ajustar os filtros.' 
                  : 'As tarefas do curso aparecerão aqui.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTarefas?.map((tarefa) => {
            const status = getTarefaStatus(tarefa);
            const config = statusConfig[status];
            const entrega = entregas?.find(e => e.tarefa_id === tarefa.id);
            const diasRestantes = differenceInDays(new Date(tarefa.prazo), new Date());
            
            return (
              <Card key={tarefa.id} className={`card-hover ${status === 'atrasado' ? 'border-destructive/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${tarefa.disciplina?.cor || '#1e3a5f'}20` }}
                      >
                        <ListTodo className="h-6 w-6" style={{ color: tarefa.disciplina?.cor || '#1e3a5f' }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{tarefa.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Prazo: {format(new Date(tarefa.prazo), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <Badge variant="outline">{tarefa.disciplina?.nome}</Badge>
                          {diasRestantes > 0 && status === 'pendente' && (
                            <span className={`text-xs ${diasRestantes <= 2 ? 'text-warning font-medium' : ''}`}>
                              {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {tarefa.descricao && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{tarefa.descricao}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {role === 'aluno' && (
                        <>
                          {entrega?.nota !== null && entrega?.nota !== undefined && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Nota</p>
                              <p className="text-xl font-bold">{entrega.nota.toFixed(1)}</p>
                            </div>
                          )}
                          <Badge variant={config.variant} className="gap-1">
                            {config.icon}
                            {config.label}
                          </Badge>
                          {status === 'pendente' && (
                            <Button variant="fire">
                              <Upload className="h-4 w-4 mr-2" />
                              Entregar
                            </Button>
                          )}
                        </>
                      )}
                      {canCreate && (
                        <Button variant="outline">Ver Entregas</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
