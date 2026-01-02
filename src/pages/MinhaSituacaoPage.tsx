import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Clock, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhaSituacaoPage() {
  const { user } = useAuth();

  const { data: presencas, isLoading: loadingPresencas } = useQuery({
    queryKey: ['minhas-presencas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presencas')
        .select('*, aula:aulas(*, disciplina:disciplinas(*))')
        .eq('aluno_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: respostas, isLoading: loadingRespostas } = useQuery({
    queryKey: ['minhas-respostas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('respostas')
        .select('*, avaliacao:avaliacoes(*, disciplina:disciplinas(*))')
        .eq('aluno_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: entregas, isLoading: loadingEntregas } = useQuery({
    queryKey: ['minhas-entregas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('*, tarefa:tarefas(*, disciplina:disciplinas(*))')
        .eq('aluno_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: tarefasPendentes } = useQuery({
    queryKey: ['tarefas-pendentes', user?.id],
    queryFn: async () => {
      const { data: tarefas, error: tarefasError } = await supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
        .gte('prazo', new Date().toISOString());
      
      if (tarefasError) throw tarefasError;

      const { data: minhasEntregas, error: entregasError } = await supabase
        .from('entregas')
        .select('tarefa_id')
        .eq('aluno_id', user?.id);
      
      if (entregasError) throw entregasError;

      const entregasIds = new Set(minhasEntregas?.map(e => e.tarefa_id));
      return tarefas?.filter(t => !entregasIds.has(t.id)) || [];
    },
    enabled: !!user?.id,
  });

  // Calculate stats
  const frequenciaStats = () => {
    if (!presencas?.length) return { presente: 0, ausente: 0, justificado: 0, percentual: 0 };
    const presente = presencas.filter(p => p.status === 'presente').length;
    const ausente = presencas.filter(p => p.status === 'ausente').length;
    const justificado = presencas.filter(p => p.status === 'justificado').length;
    const total = presencas.length;
    return {
      presente,
      ausente,
      justificado,
      percentual: total > 0 ? Math.round(((presente + justificado) / total) * 100) : 0,
    };
  };

  const notaStats = () => {
    if (!respostas?.length) return { media: 0, total: 0 };
    const notasValidas = respostas.filter(r => r.nota !== null);
    const soma = notasValidas.reduce((acc, r) => acc + (r.nota || 0), 0);
    return {
      media: notasValidas.length > 0 ? (soma / notasValidas.length).toFixed(1) : 0,
      total: respostas.length,
    };
  };

  const freq = frequenciaStats();
  const notas = notaStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'presente':
        return <Badge className="bg-success/20 text-success border-success/30">Presente</Badge>;
      case 'ausente':
        return <Badge variant="destructive">Ausente</Badge>;
      case 'justificado':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Justificado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Minha Situação</h1>
        <p className="text-muted-foreground">Acompanhe sua frequência, notas e pendências</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequência</p>
                <p className="text-2xl font-bold">{freq.percentual}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
            <Progress value={freq.percentual} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nota Média</p>
                <p className="text-2xl font-bold">{notas.media}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliações</p>
                <p className="text-2xl font-bold">{notas.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p className="text-2xl font-bold">{tarefasPendentes?.length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="frequencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="pendencias">Pendências</TabsTrigger>
        </TabsList>

        <TabsContent value="frequencia">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Frequência</CardTitle>
              <CardDescription>
                {freq.presente} presentes • {freq.ausente} ausências • {freq.justificado} justificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPresencas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                </div>
              ) : !presencas?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum registro de frequência</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Aula</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presencas.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {format(new Date(p.aula?.data_hora_inicio || p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{p.aula?.titulo || '-'}</TableCell>
                        <TableCell>{p.aula?.disciplina?.nome || '-'}</TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notas</CardTitle>
              <CardDescription>Suas notas em avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRespostas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                </div>
              ) : !respostas?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma avaliação realizada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {respostas.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {format(new Date(r.data_submissao || r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{r.avaliacao?.titulo || '-'}</TableCell>
                        <TableCell>{r.avaliacao?.disciplina?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={r.nota >= 7 ? 'default' : r.nota >= 5 ? 'secondary' : 'destructive'}>
                            {r.nota !== null ? r.nota.toFixed(1) : 'Aguardando'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendencias">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Pendentes</CardTitle>
              <CardDescription>Tarefas que ainda não foram entregues</CardDescription>
            </CardHeader>
            <CardContent>
              {!tarefasPendentes?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                  <p>Nenhuma pendência! Você está em dia.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tarefasPendentes.map((t: any) => {
                      const vencido = new Date(t.prazo) < new Date();
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.titulo}</TableCell>
                          <TableCell>{t.disciplina?.nome || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(t.prazo), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={vencido ? 'destructive' : 'secondary'}>
                              {vencido ? 'Atrasado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
