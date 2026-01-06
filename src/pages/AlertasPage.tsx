import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alerta, SeveridadeAlerta } from '@/types/alertas';

const SEVERIDADE_CONFIG = {
  INFO: { label: 'Info', icon: Info, color: 'text-blue-600', variant: 'default' as const },
  ALERTA: { label: 'Alerta', icon: AlertTriangle, color: 'text-yellow-600', variant: 'secondary' as const },
  CRITICO: { label: 'Crítico', icon: AlertCircle, color: 'text-red-600', variant: 'destructive' as const },
};

const TIPO_CONFIG = {
  IMEDIATO: { label: 'Imediato', variant: 'outline' as const },
  LIMIAR: { label: 'Limiar', variant: 'default' as const },
};

export default function AlertasPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [filterTurma, setFilterTurma] = useState('todos');
  const [filterPelotao, setFilterPelotao] = useState('todos');
  const [filterDisciplina, setFilterDisciplina] = useState('todos');
  const [filterSeveridade, setFilterSeveridade] = useState<SeveridadeAlerta | 'TODOS'>('TODOS');
  const [filterResolvido, setFilterResolvido] = useState<'sim' | 'nao' | 'todos'>('nao');

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<Alerta | null>(null);
  const [observacaoResolucao, setObservacaoResolucao] = useState('');

  // Buscar alertas
  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas', filterTurma, filterPelotao, filterDisciplina, filterSeveridade, filterResolvido],
    queryFn: async () => {
      let query = supabase
        .from('alertas')
        .select(`
          *,
          aluno:profiles!alertas_aluno_id_fkey(id, nome, matricula, email),
          pelotao:pelotoes(id, nome, turma),
          turma:turmas(id, nome),
          disciplina:disciplinas(id, nome, codigo),
          aula:aulas(id, titulo, data_aula, hora_inicio),
          instrutor:profiles!alertas_instrutor_id_fkey(id, nome),
          resolvido_por_usuario:profiles!alertas_resolvido_por_fkey(id, nome)
        `)
        .order('created_at', { ascending: false });

      // Filtros por role
      if (role === 'coordenador') {
        // Coordenador vê apenas alertas dos pelotões que coordena
        const { data: pelotoes } = await supabase
          .from('pelotoes')
          .select('id')
          .eq('coordenador_id', user!.id);

        if (pelotoes && pelotoes.length > 0) {
          const pelotaoIds = pelotoes.map(p => p.id);
          query = query.in('pelotao_id', pelotaoIds);
        } else {
          return []; // Coordenador sem pelotões
        }
      } else if (role === 'instrutor') {
        // Instrutor vê apenas alertas que ele criou
        query = query.eq('instrutor_id', user!.id);
      }
      // Admin vê tudo (sem filtro adicional)

      // Aplicar filtros
      if (filterTurma !== 'todos') query = query.eq('turma_id', filterTurma);
      if (filterPelotao !== 'todos') query = query.eq('pelotao_id', filterPelotao);
      if (filterDisciplina !== 'todos') query = query.eq('disciplina_id', filterDisciplina);
      if (filterSeveridade !== 'TODOS') query = query.eq('severidade', filterSeveridade);
      if (filterResolvido === 'sim') query = query.eq('resolvido', true);
      if (filterResolvido === 'nao') query = query.eq('resolvido', false);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Alerta[];
    },
  });

  // Buscar turmas
  const { data: turmas } = useQuery({
    queryKey: ['turmas-alertas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('turmas').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Buscar pelotões
  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes-alertas', filterTurma],
    queryFn: async () => {
      let query = supabase.from('pelotoes').select('id, nome, turma').order('nome');
      if (filterTurma !== 'todos') query = query.eq('turma_id', filterTurma);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Buscar disciplinas
  const { data: disciplinas } = useQuery({
    queryKey: ['disciplinas-alertas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('disciplinas').select('id, nome, codigo').order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Resolver alerta
  const resolverMutation = useMutation({
    mutationFn: async ({ alertaId, observacao }: { alertaId: string; observacao?: string }) => {
      const { error } = await supabase.rpc('resolver_alerta', {
        p_alerta_id: alertaId,
        p_observacao: observacao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      setDetailDialogOpen(false);
      setSelectedAlerta(null);
      setObservacaoResolucao('');
      toast.success('Alerta resolvido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao resolver alerta: ' + error.message);
    },
  });

  const handleViewDetails = (alerta: Alerta) => {
    setSelectedAlerta(alerta);
    setObservacaoResolucao('');
    setDetailDialogOpen(true);
  };

  const handleResolverAlerta = () => {
    if (!selectedAlerta) return;
    resolverMutation.mutate({
      alertaId: selectedAlerta.id,
      observacao: observacaoResolucao,
    });
  };

  // Resumo
  const resumo = alertas
    ? {
        total: alertas.length,
        imediatos: alertas.filter(a => a.tipo === 'IMEDIATO').length,
        limiares: alertas.filter(a => a.tipo === 'LIMIAR').length,
        info: alertas.filter(a => a.severidade === 'INFO').length,
        alerta: alertas.filter(a => a.severidade === 'ALERTA').length,
        critico: alertas.filter(a => a.severidade === 'CRITICO').length,
        naoResolvidos: alertas.filter(a => !a.resolvido).length,
      }
    : null;

  if (role !== 'admin' && role !== 'coordenador' && role !== 'instrutor') {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Acesso restrito.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Central de Alertas</h1>
        <p className="text-muted-foreground">Gerenciamento de alertas de frequência</p>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{resumo.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{resumo.imediatos}</div>
              <div className="text-xs text-muted-foreground">Imediatos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{resumo.limiares}</div>
              <div className="text-xs text-muted-foreground">Limiares</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{resumo.alerta}</div>
              <div className="text-xs text-muted-foreground">Alertas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{resumo.critico}</div>
              <div className="text-xs text-muted-foreground">Críticos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{resumo.naoResolvidos}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <Label>Turma</Label>
              <Select value={filterTurma} onValueChange={setFilterTurma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {turmas?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pelotão</Label>
              <Select value={filterPelotao} onValueChange={setFilterPelotao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {pelotoes?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disciplina</Label>
              <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {disciplinas?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.codigo} - {d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidade</Label>
              <Select value={filterSeveridade} onValueChange={(v) => setFilterSeveridade(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="ALERTA">Alerta</SelectItem>
                  <SelectItem value="CRITICO">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterResolvido} onValueChange={(v) => setFilterResolvido(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Pendentes</SelectItem>
                  <SelectItem value="sim">Resolvidos</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
          <CardDescription>{alertas?.length || 0} alerta(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlertas ? (
            <div className="text-center py-8">Carregando...</div>
          ) : !alertas || alertas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum alerta encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.map((alerta) => {
                  const SevIcon = SEVERIDADE_CONFIG[alerta.severidade].icon;
                  return (
                    <TableRow key={alerta.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(alerta.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(alerta.created_at), 'HH:mm', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{alerta.aluno?.nome}</div>
                        <div className="text-sm text-muted-foreground">{alerta.aluno?.matricula}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={TIPO_CONFIG[alerta.tipo].variant}>
                          {TIPO_CONFIG[alerta.tipo].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={SEVERIDADE_CONFIG[alerta.severidade].variant}>
                          <SevIcon className="h-3 w-3 mr-1" />
                          {SEVERIDADE_CONFIG[alerta.severidade].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm truncate">{alerta.motivo}</div>
                        {alerta.contagem_faltas && (
                          <div className="text-xs text-muted-foreground">
                            {alerta.contagem_faltas} falta(s)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {alerta.resolvido ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolvido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleViewDetails(alerta)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      {selectedAlerta && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Alerta</DialogTitle>
              <DialogDescription>
                Criado em {format(new Date(selectedAlerta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Tipo e Severidade */}
              <div className="flex gap-2">
                <Badge variant={TIPO_CONFIG[selectedAlerta.tipo].variant}>
                  {TIPO_CONFIG[selectedAlerta.tipo].label}
                </Badge>
                <Badge variant={SEVERIDADE_CONFIG[selectedAlerta.severidade].variant}>
                  {SEVERIDADE_CONFIG[selectedAlerta.severidade].label}
                </Badge>
                {selectedAlerta.resolvido && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Resolvido
                  </Badge>
                )}
              </div>

              {/* Informações do Aluno */}
              <div>
                <Label className="text-xs text-muted-foreground">Aluno</Label>
                <div className="font-medium">{selectedAlerta.aluno?.nome}</div>
                <div className="text-sm text-muted-foreground">
                  Matrícula: {selectedAlerta.aluno?.matricula} • {selectedAlerta.aluno?.email}
                </div>
                {selectedAlerta.pelotao && (
                  <div className="text-sm text-muted-foreground">
                    Pelotão: {selectedAlerta.pelotao.nome}
                  </div>
                )}
              </div>

              {/* Motivo */}
              <div>
                <Label className="text-xs text-muted-foreground">Motivo</Label>
                <div className="text-sm">{selectedAlerta.motivo}</div>
              </div>

              {/* Contagem de Faltas */}
              {selectedAlerta.contagem_faltas !== null && (
                <div>
                  <Label className="text-xs text-muted-foreground">Contagem de Faltas</Label>
                  <div className="text-2xl font-bold">{selectedAlerta.contagem_faltas}</div>
                </div>
              )}

              {/* Disciplina */}
              {selectedAlerta.disciplina && (
                <div>
                  <Label className="text-xs text-muted-foreground">Disciplina</Label>
                  <div className="text-sm">
                    {selectedAlerta.disciplina.codigo} - {selectedAlerta.disciplina.nome}
                  </div>
                </div>
              )}

              {/* Aula */}
              {selectedAlerta.aula && (
                <div>
                  <Label className="text-xs text-muted-foreground">Aula</Label>
                  <div className="text-sm">{selectedAlerta.aula.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(selectedAlerta.aula.data_aula), 'dd/MM/yyyy', { locale: ptBR })} às{' '}
                    {selectedAlerta.aula.hora_inicio}
                  </div>
                </div>
              )}

              {/* Instrutor */}
              {selectedAlerta.instrutor && (
                <div>
                  <Label className="text-xs text-muted-foreground">Instrutor Responsável</Label>
                  <div className="text-sm">{selectedAlerta.instrutor.nome}</div>
                </div>
              )}

              {/* Resolução */}
              {selectedAlerta.resolvido ? (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground">Resolvido por</Label>
                  <div className="text-sm">{selectedAlerta.resolvido_por_usuario?.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    em {format(new Date(selectedAlerta.resolvido_em!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {selectedAlerta.observacao_resolucao && (
                    <>
                      <Label className="text-xs text-muted-foreground mt-2">Observação</Label>
                      <div className="text-sm">{selectedAlerta.observacao_resolucao}</div>
                    </>
                  )}
                </div>
              ) : (role === 'admin' || role === 'coordenador') && (
                <div className="border-t pt-4">
                  <Label>Observação (opcional)</Label>
                  <Textarea
                    value={observacaoResolucao}
                    onChange={(e) => setObservacaoResolucao(e.target.value)}
                    placeholder="Digite uma observação sobre a resolução..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Fechar
              </Button>
              {!selectedAlerta.resolvido && (role === 'admin' || role === 'coordenador') && (
                <Button
                  onClick={handleResolverAlerta}
                  disabled={resolverMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Resolvido
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
