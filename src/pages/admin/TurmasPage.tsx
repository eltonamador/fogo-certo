import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { GraduationCap, Search, Plus, Edit, Trash2, Calendar, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Turma } from '@/types/database';
import { toast } from 'sonner';

export default function AdminTurmasPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear(),
    data_inicio: '',
    data_fim: '',
  });

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: turmas, isLoading } = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('ano', { ascending: false })
        .order('nome');
      
      if (error) throw error;
      return data as Turma[];
    },
  });

  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes-by-turma'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('turma_id');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('turmas').insert({
        nome: data.nome,
        ano: data.ano,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma criada com sucesso!');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar turma');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('turmas').update({
        nome: data.nome,
        ano: data.ano,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma atualizada com sucesso!');
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao atualizar turma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('turmas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir turma');
    },
  });

  const resetForm = () => {
    setFormData({ nome: '', ano: new Date().getFullYear(), data_inicio: '', data_fim: '' });
    setEditingTurma(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      ano: turma.ano,
      data_inicio: turma.data_inicio,
      data_fim: turma.data_fim,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.data_inicio || !formData.data_fim) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (editingTurma) {
      updateMutation.mutate({ id: editingTurma.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPelotaoCount = (turmaId: string) => {
    return pelotoes?.filter(p => p.turma_id === turmaId).length || 0;
  };

  const filteredTurmas = turmas?.filter(turma =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.ano.toString().includes(searchTerm)
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Turmas</h1>
          <p className="text-muted-foreground">Gerenciamento de turmas do CFSD</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="fire">
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: CFSD 2026/1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ano">Ano *</Label>
                <Input
                  id="ano"
                  type="number"
                  value={formData.ano}
                  onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_inicio">Data Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="data_fim">Data Fim *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" variant="fire" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTurma ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Turmas</p>
                <p className="text-2xl font-bold">{turmas?.length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                <p className="text-2xl font-bold">
                  {turmas?.filter(t => new Date(t.data_fim) >= new Date()).length || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pelotões</p>
                <p className="text-2xl font-bold">{pelotoes?.length || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar turmas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTurmas?.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">Crie uma turma para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Pelotões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas?.map((turma) => {
                    const isActive = new Date(turma.data_fim) >= new Date();
                    return (
                      <TableRow key={turma.id}>
                        <TableCell className="font-medium">{turma.nome}</TableCell>
                        <TableCell>{turma.ano}</TableCell>
                        <TableCell>
                          {format(new Date(turma.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(turma.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getPelotaoCount(turma.id)} pelotões</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive ? 'Ativa' : 'Encerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(turma)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(turma.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
