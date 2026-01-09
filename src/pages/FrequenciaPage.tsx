// Este arquivo substitui FrequenciaPage.tsx - renomeie manualmente após revisar
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
import { ClipboardCheck, Plus, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aula, TipoAula } from '@/types/frequencia';
import { ChamadaDialog } from '@/components/frequencia/ChamadaDialog';

const TIPO_AULA_CONFIG = {
  AULA: { label: 'Aula', variant: 'default' as const },
  PROVA: { label: 'Prova', variant: 'destructive' as const },
  AVALIACAO: { label: 'Avaliação', variant: 'destructive' as const },
  SIMULADO: { label: 'Simulado', variant: 'secondary' as const },
  ATIVIDADE_PRATICA: { label: 'Atividade Prática', variant: 'outline' as const },
};

const STATUS_AULA_CONFIG = {
  RASCUNHO: { label: 'Rascunho', variant: 'outline' as const },
  PUBLICADA: { label: 'Publicada', variant: 'default' as const },
  FINALIZADA: { label: 'Finalizada', variant: 'secondary' as const },
};

export default function FrequenciaPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [chamadaDialogOpen, setChamadaDialogOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [filterData, setFilterData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterDisciplina, setFilterDisciplina] = useState('todos');
  const [createForm, setCreateForm] = useState({
    disciplina_id: '',
    pelotao_id: '',
    data_aula: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: '08:00',
    hora_fim: '10:00',
    tipo: 'AULA' as TipoAula,
    titulo: '',
    descricao: '',
    local: '',
  });

  const { data: aulas, isLoading: loadingAulas } = useQuery({
    queryKey: ['aulas', filterData, filterDisciplina],
    queryFn: async () => {
      let query = supabase
        .from('aulas')
        .select(`*,
          disciplina:disciplinas(id, nome),
          instrutor:profiles!aulas_instrutor_id_fkey(id, nome),
          pelotao:pelotoes(id, nome, turma)
        `)
        .order('data_aula', { ascending: false });

      if (role === 'instrutor') {
        query = query.eq('instrutor_id', user!.id);
      }

      if (filterData) query = query.eq('data_aula', filterData);
      if (filterDisciplina !== 'todos') query = query.eq('disciplina_id', filterDisciplina);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Aula[];
    },
  });

  const { data: disciplinas, isLoading: disciplinasLoading, error: disciplinasError } = useQuery({
    queryKey: ['disciplinas-frequencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, nome')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes-frequencia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pelotoes').select('id, nome, turma').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const createAulaMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const { data: aula, error } = await supabase.from('aulas').insert({
        ...data,
        instrutor_id: user!.id,
        status: 'RASCUNHO',
        created_by: user!.id,
      }).select().single();

      if (error) throw error;

      if (data.pelotao_id) {
        const { error: presencaError } = await supabase.rpc('criar_presencas_pelotao', {
          p_aula_id: aula.id,
          p_pelotao_id: data.pelotao_id,
        });
        if (presencaError) throw presencaError;
      }

      return aula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      setCreateDialogOpen(false);
      toast.success('Aula criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar aula: ' + error.message);
    },
  });

  const deleteAulaMutation = useMutation({
    mutationFn: async (aulaId: string) => {
      const { error } = await supabase.from('aulas').delete().eq('id', aulaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      toast.success('Aula excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir aula: ' + error.message);
    },
  });

  if (role !== 'admin' && role !== 'instrutor') {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Acesso restrito. Apenas instrutores e administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Frequência</h1>
          <p className="text-muted-foreground">Gestão de chamadas e presença</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula/Evento
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} />
            </div>
            <div>
              <Label>Disciplina</Label>
              <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {disciplinas?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aulas/Eventos</CardTitle>
          <CardDescription>{aulas?.length || 0} aula(s) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAulas ? (
            <div className="text-center py-8">Carregando...</div>
          ) : !aulas || aulas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma aula encontrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Presença</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aulas.map((aula) => (
                  <TableRow key={aula.id}>
                    <TableCell>
                      <div>{format(new Date(aula.data_aula), 'dd/MM/yyyy', { locale: ptBR })}</div>
                      <div className="text-sm text-muted-foreground">{aula.hora_inicio}</div>
                    </TableCell>
                    <TableCell>{aula.disciplina?.nome}</TableCell>
                    <TableCell>{aula.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={TIPO_AULA_CONFIG[aula.tipo].variant}>
                        {TIPO_AULA_CONFIG[aula.tipo].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_AULA_CONFIG[aula.status].variant}>
                        {STATUS_AULA_CONFIG[aula.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {aula.total_alunos > 0 && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{aula.total_presentes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-3 w-3" />
                            <span>{aula.total_ausentes}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedAula(aula); setChamadaDialogOpen(true); }}>
                          <ClipboardCheck className="h-4 w-4" />
                        </Button>
                        {aula.status === 'RASCUNHO' && (
                          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => deleteAulaMutation.mutate(aula.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Aula/Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createAulaMutation.mutate(createForm); }} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Disciplina *</Label>
                {disciplinasLoading ? (
                  <Select disabled>
                    <SelectTrigger><SelectValue placeholder="Carregando..." /></SelectTrigger>
                  </Select>
                ) : disciplinasError ? (
                  <div className="text-sm text-destructive">Erro ao carregar disciplinas</div>
                ) : !disciplinas || disciplinas.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma disciplina disponível</div>
                ) : (
                  <Select value={createForm.disciplina_id} onValueChange={(v) => setCreateForm({ ...createForm, disciplina_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {disciplinas.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Pelotão *</Label>
                <Select value={createForm.pelotao_id} onValueChange={(v) => setCreateForm({ ...createForm, pelotao_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {pelotoes?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} - {p.turma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={createForm.data_aula} onChange={(e) => setCreateForm({ ...createForm, data_aula: e.target.value })} />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={createForm.tipo} onValueChange={(v) => setCreateForm({ ...createForm, tipo: v as TipoAula })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AULA">Aula</SelectItem>
                    <SelectItem value="PROVA">Prova</SelectItem>
                    <SelectItem value="AVALIACAO">Avaliação</SelectItem>
                    <SelectItem value="SIMULADO">Simulado</SelectItem>
                    <SelectItem value="ATIVIDADE_PRATICA">Atividade Prática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora Início *</Label>
                <Input type="time" value={createForm.hora_inicio} onChange={(e) => setCreateForm({ ...createForm, hora_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input type="time" value={createForm.hora_fim} onChange={(e) => setCreateForm({ ...createForm, hora_fim: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={createForm.titulo} onChange={(e) => setCreateForm({ ...createForm, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={createForm.descricao} onChange={(e) => setCreateForm({ ...createForm, descricao: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{createAulaMutation.isPending ? 'Criando...' : 'Criar Aula'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedAula && (
        <ChamadaDialog open={chamadaDialogOpen} onClose={() => { setChamadaDialogOpen(false); setSelectedAula(null); }} aula={selectedAula} />
      )}
    </div>
  );
}
