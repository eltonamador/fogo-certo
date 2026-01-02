import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClipboardCheck, Search, Users, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Aula, Profile, StatusPresenca } from '@/types/database';

interface PresencaState {
  aluno_id: string;
  status: StatusPresenca;
  observacao: string;
}

export default function ChamadaPage() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAula, setSelectedAula] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [presencas, setPresencas] = useState<Record<string, PresencaState>>({});

  if (role !== 'admin' && role !== 'instrutor') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: aulas, isLoading: loadingAulas } = useQuery({
    queryKey: ['aulas-chamada', user?.id, role],
    queryFn: async () => {
      let query = supabase
        .from('aulas')
        .select('*, disciplina:disciplinas(*)')
        .order('data_hora_inicio', { ascending: false })
        .limit(30);
      
      if (role === 'instrutor') {
        query = query.eq('instrutor_id', user?.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Aula[];
    },
    enabled: !!user?.id,
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ['alunos-chamada'],
    queryFn: async () => {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'aluno');
      
      if (rolesError) throw rolesError;
      
      const alunoIds = userRoles?.map(r => r.user_id) || [];
      
      if (alunoIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, pelotao:pelotoes(*)')
        .in('id', alunoIds)
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  const { data: presencasExistentes } = useQuery({
    queryKey: ['presencas-aula', selectedAula],
    queryFn: async () => {
      if (!selectedAula) return [];
      const { data, error } = await supabase
        .from('presencas')
        .select('*')
        .eq('aula_id', selectedAula);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAula,
  });

  // Initialize presencas when aula is selected
  useState(() => {
    if (presencasExistentes && alunos) {
      const initial: Record<string, PresencaState> = {};
      alunos.forEach(aluno => {
        const existing = presencasExistentes.find(p => p.aluno_id === aluno.id);
        initial[aluno.id] = {
          aluno_id: aluno.id,
          status: (existing?.status as StatusPresenca) || 'presente',
          observacao: existing?.observacao || '',
        };
      });
      setPresencas(initial);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAula) throw new Error('Selecione uma aula');
      
      const presencasList = Object.values(presencas).map(p => ({
        aula_id: selectedAula,
        aluno_id: p.aluno_id,
        status: p.status,
        observacao: p.observacao || null,
      }));

      // Delete existing and insert new
      await supabase.from('presencas').delete().eq('aula_id', selectedAula);
      
      const { error } = await supabase.from('presencas').insert(presencasList);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presencas-aula'] });
      toast.success('Chamada salva com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar chamada');
    },
  });

  const handleStatusChange = (alunoId: string, status: StatusPresenca) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], aluno_id: alunoId, status },
    }));
  };

  const handleObservacaoChange = (alunoId: string, observacao: string) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], aluno_id: alunoId, observacao },
    }));
  };

  const marcarTodos = (status: StatusPresenca) => {
    const updated: Record<string, PresencaState> = {};
    alunos?.forEach(aluno => {
      updated[aluno.id] = {
        ...presencas[aluno.id],
        aluno_id: aluno.id,
        status,
      };
    });
    setPresencas(updated);
  };

  const filteredAlunos = alunos?.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAulaData = aulas?.find(a => a.id === selectedAula);

  // Stats
  const stats = {
    total: filteredAlunos?.length || 0,
    presentes: Object.values(presencas).filter(p => p.status === 'presente').length,
    ausentes: Object.values(presencas).filter(p => p.status === 'ausente').length,
    justificados: Object.values(presencas).filter(p => p.status === 'justificado').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Chamada</h1>
          <p className="text-muted-foreground">Registre a presença dos alunos</p>
        </div>
      </div>

      {/* Select Aula */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Aula</CardTitle>
          <CardDescription>Escolha a aula para fazer a chamada</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAula} onValueChange={setSelectedAula}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma aula..." />
            </SelectTrigger>
            <SelectContent>
              {aulas?.map((aula) => (
                <SelectItem key={aula.id} value={aula.id}>
                  {format(new Date(aula.data_hora_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {aula.titulo} ({aula.disciplina?.nome})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAula && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Presentes</p>
                    <p className="text-2xl font-bold text-success">{stats.presentes}</p>
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
                    <p className="text-sm text-muted-foreground">Ausentes</p>
                    <p className="text-2xl font-bold text-destructive">{stats.ausentes}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Justificados</p>
                    <p className="text-2xl font-bold text-warning">{stats.justificados}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => marcarTodos('presente')}>
              <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
              Marcar todos presentes
            </Button>
            <Button variant="outline" size="sm" onClick={() => marcarTodos('ausente')}>
              <XCircle className="h-4 w-4 mr-2 text-destructive" />
              Marcar todos ausentes
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Alunos List */}
          <Card>
            <CardContent className="p-0">
              {loadingAlunos ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredAlunos?.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Pelotão</TableHead>
                        <TableHead>Presença</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlunos?.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell>
                            <div className="font-medium">{aluno.nome}</div>
                            <div className="text-sm text-muted-foreground">{aluno.matricula || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{aluno.pelotao?.nome || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <RadioGroup
                              value={presencas[aluno.id]?.status || 'presente'}
                              onValueChange={(value) => handleStatusChange(aluno.id, value as StatusPresenca)}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="presente" id={`presente-${aluno.id}`} />
                                <Label htmlFor={`presente-${aluno.id}`} className="text-success cursor-pointer">P</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ausente" id={`ausente-${aluno.id}`} />
                                <Label htmlFor={`ausente-${aluno.id}`} className="text-destructive cursor-pointer">A</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="justificado" id={`justificado-${aluno.id}`} />
                                <Label htmlFor={`justificado-${aluno.id}`} className="text-warning cursor-pointer">J</Label>
                              </div>
                            </RadioGroup>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Observação..."
                              value={presencas[aluno.id]?.observacao || ''}
                              onChange={(e) => handleObservacaoChange(aluno.id, e.target.value)}
                              className="w-48"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="fire" size="lg" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Chamada
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
