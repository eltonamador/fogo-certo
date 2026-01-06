import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Shield, Search, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pelotao, Turma } from '@/types/database';
import { toast } from 'sonner';

export default function AdminPelotoesPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPelotao, setEditingPelotao] = useState<Pelotao | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    turma: '',
    turma_id: '',
  });

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: pelotoes, isLoading } = useQuery({
    queryKey: ['admin-pelotoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('*')
        .order('turma')
        .order('nome');

      if (error) throw error;
      return data as Pelotao[];
    },
  });

  const { data: turmas } = useQuery({
    queryKey: ['turmas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('ano', { ascending: false });

      if (error) throw error;
      return data as Turma[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pelotao_id');

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('pelotoes').insert({
        nome: data.nome,
        turma: data.turma,
        turma_id: data.turma_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pelotoes'] });
      toast.success('Pelotão criado com sucesso!');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar pelotão');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('pelotoes').update({
        nome: data.nome,
        turma: data.turma,
        turma_id: data.turma_id || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pelotoes'] });
      toast.success('Pelotão atualizado com sucesso!');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao atualizar pelotão');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pelotoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pelotoes'] });
      toast.success('Pelotão excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir pelotão');
    },
  });

  const resetForm = () => {
    setFormData({ nome: '', turma: '', turma_id: '' });
    setEditingPelotao(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (pelotao: Pelotao) => {
    setEditingPelotao(pelotao);
    setFormData({
      nome: pelotao.nome,
      turma: pelotao.turma,
      turma_id: pelotao.turma_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.turma) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (editingPelotao) {
      updateMutation.mutate({ id: editingPelotao.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleTurmaSelect = (turmaId: string) => {
    const turma = turmas?.find(t => t.id === turmaId);
    if (turma) {
      setFormData({ ...formData, turma_id: turmaId, turma: turma.nome });
    }
  };

  const getAlunoCount = (pelotaoId: string) => {
    return profiles?.filter(p => p.pelotao_id === pelotaoId).length || 0;
  };

  const filteredPelotoes = pelotoes?.filter(pelotao =>
    pelotao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pelotao.turma.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const turmasUnicas = [...new Set(pelotoes?.map(p => p.turma) || [])];

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Pelotões</h1>
          <p className="text-muted-foreground">Gerenciamento de pelotões e turmas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="fire">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pelotão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPelotao ? 'Editar Pelotão' : 'Novo Pelotão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Pelotão *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: 1º Pelotão"
                  required
                />
              </div>
              <div>
                <Label htmlFor="turma_id">Turma *</Label>
                <Select value={formData.turma_id} onValueChange={handleTurmaSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas?.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} ({turma.ano})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" variant="fire" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPelotao ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pelotões</p>
                <p className="text-2xl font-bold">{pelotoes?.length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                <p className="text-2xl font-bold">{turmasUnicas.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{profiles?.filter(p => p.pelotao_id).length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pelotoes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredPelotoes?.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pelotão encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar a busca.' : 'Crie um pelotão para começar.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPelotoes?.map((pelotao) => (
                    <TableRow key={pelotao.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          {pelotao.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pelotao.turma}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {getAlunoCount(pelotao.id)} alunos
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(pelotao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(pelotao)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(pelotao.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
