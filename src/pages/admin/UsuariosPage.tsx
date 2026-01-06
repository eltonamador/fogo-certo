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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Search, Plus, Edit, Trash2, Shield, GraduationCap, UserCircle, Eye } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Profile, AppRole, Pelotao } from '@/types/database';
import { toast } from 'sonner';
import { ProfileView } from '@/components/admin/ProfileView';

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Administrador', icon: <Shield className="h-4 w-4" />, variant: 'default' },
  instrutor: { label: 'Instrutor', icon: <GraduationCap className="h-4 w-4" />, variant: 'secondary' },
  aluno: { label: 'Aluno', icon: <UserCircle className="h-4 w-4" />, variant: 'outline' },
};

export default function AdminUsuariosPage() {
  const { role: userRole, user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');
  const [filterPelotao, setFilterPelotao] = useState<string>('todos');

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'aluno' as AppRole,
    pelotao_id: '',
  });

  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    telefone: '',
    matricula: '',
    pelotao_id: '',
  });

  // Role change dialog
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; nome: string; currentRole: AppRole } | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Profile view dialog
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string>('');

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, pelotao:pelotoes(*)')
        .order('nome');

      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Pelotao[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const { data: result, error } = await supabase.rpc('admin_create_user', {
        _email: data.email,
        _password: data.password,
        _nome: data.nome,
        _role: data.role,
        _pelotao_id: data.pelotao_id || null,
      });

      if (error) throw error;

      // Verificar se a função retornou sucesso
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar usuário');
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setCreateForm({ nome: '', email: '', password: '', role: 'aluno', pelotao_id: '' });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          telefone: data.telefone,
          matricula: data.matricula,
          pelotao_id: data.pelotao_id || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success('Perfil atualizado com sucesso!');
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: result, error } = await supabase.rpc('admin_delete_user', {
        _target_user_id: userId,
      });

      if (error) throw error;

      // Verificar se a função retornou sucesso
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success) {
          throw new Error(result.error || 'Erro ao excluir usuário');
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Usuário excluído com sucesso!');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir usuário: ' + error.message);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase.rpc('admin_change_user_role', {
        _target_user_id: userId,
        _new_role: role
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Papel alterado com sucesso!');
      setConfirmDialogOpen(false);
      setRoleChangeDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
    },
    onError: (error: Error) => {
      if (error.message.includes('Aluno não pode ser promovido diretamente')) {
        toast.error('Aluno não pode ser promovido diretamente a admin. Promova primeiro a instrutor.');
      } else {
        toast.error('Erro ao alterar papel: ' + error.message);
      }
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const roleData = userRoles?.find(r => r.user_id === userId);
    return (roleData?.role as AppRole) || 'aluno';
  };

  const filteredProfiles = profiles?.filter(profile => {
    const matchesSearch = profile.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase());
    const role = getUserRole(profile.id);
    const matchesRole = filterRole === 'todos' || role === filterRole;
    const matchesPelotao = filterPelotao === 'todos' || profile.pelotao_id === filterPelotao;
    return matchesSearch && matchesRole && matchesPelotao;
  });

  const stats = {
    total: profiles?.length || 0,
    admins: profiles?.filter(p => getUserRole(p.id) === 'admin').length || 0,
    instrutores: profiles?.filter(p => getUserRole(p.id) === 'instrutor').length || 0,
    alunos: profiles?.filter(p => getUserRole(p.id) === 'aluno').length || 0,
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditingUser(profile);
    setEditForm({
      nome: profile.nome,
      telefone: profile.telefone || '',
      matricula: profile.matricula || '',
      pelotao_id: profile.pelotao_id || '',
    });
    setEditDialogOpen(true);
  };

  const handleOpenRoleChange = (profile: Profile) => {
    const currentRole = getUserRole(profile.id);
    setSelectedUser({ id: profile.id, nome: profile.nome, currentRole });
    setNewRole('');
    setRoleChangeDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (selectedUser && newRole) {
      setConfirmDialogOpen(true);
    }
  };

  const handleExecuteRoleChange = () => {
    if (selectedUser && newRole) {
      changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const getAvailableRoles = (currentRole: AppRole): AppRole[] => {
    switch (currentRole) {
      case 'aluno':
        return ['instrutor'];
      case 'instrutor':
        return ['admin', 'aluno'];
      case 'admin':
        return ['instrutor', 'aluno'];
      default:
        return [];
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nome || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (createForm.role === 'aluno' && !createForm.pelotao_id) {
      toast.error('Alunos devem ter um pelotão');
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateProfileMutation.mutate({ id: editingUser.id, data: editForm });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerenciamento de usuários do sistema</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="fire">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="create-nome">Nome Completo *</Label>
                <Input
                  id="create-nome"
                  value={createForm.nome}
                  onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-password">Senha *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-role">Papel *</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as AppRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluno">Aluno</SelectItem>
                    <SelectItem value="instrutor">Instrutor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createForm.role === 'aluno' && (
                <div>
                  <Label htmlFor="create-pelotao">Pelotão *</Label>
                  <Select value={createForm.pelotao_id} onValueChange={(v) => setCreateForm({ ...createForm, pelotao_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pelotão" />
                    </SelectTrigger>
                    <SelectContent>
                      {pelotoes?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome} - {p.turma}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="fire" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
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
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-fire/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-fire" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instrutores</p>
                <p className="text-2xl font-bold">{stats.instrutores}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alunos</p>
                <p className="text-2xl font-bold">{stats.alunos}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos papéis</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="instrutor">Instrutores</SelectItem>
            <SelectItem value="aluno">Alunos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPelotao} onValueChange={setFilterPelotao}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pelotão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos pelotões</SelectItem>
            {pelotoes?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredProfiles?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Pelotão</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((profile) => {
                    const role = getUserRole(profile.id);
                    const config = roleConfig[role];
                    const isSelf = profile.id === user?.id;
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.nome}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{profile.pelotao?.nome || '-'}</TableCell>
                        <TableCell>{profile.matricula || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setViewingUserId(profile.id);
                                setProfileViewOpen(true);
                              }}
                              title="Ver perfil completo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenRoleChange(profile)}
                              disabled={isSelf}
                              title={isSelf ? 'Você não pode alterar seu próprio papel' : 'Alterar papel'}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenEdit(profile)}
                              title="Editar informações"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isSelf}
                              onClick={() => {
                                setUserToDelete(profile);
                                setDeleteDialogOpen(true);
                              }}
                              title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
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

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Perfil</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Alterar informações de {editingUser?.nome}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={editForm.telefone}
                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="edit-matricula">Matrícula</Label>
              <Input
                id="edit-matricula"
                value={editForm.matricula}
                onChange={(e) => setEditForm({ ...editForm, matricula: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-pelotao">Pelotão</Label>
              <Select value={editForm.pelotao_id || undefined} onValueChange={(v) => setEditForm({ ...editForm, pelotao_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem pelotão" />
                </SelectTrigger>
                <SelectContent>
                  {pelotoes?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} - {p.turma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Papel do Usuário</DialogTitle>
            <DialogDescription>
              Alterar o papel de <strong>{selectedUser?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Papel atual:</p>
              {selectedUser && (
                <Badge variant={roleConfig[selectedUser.currentRole].variant} className="gap-1">
                  {roleConfig[selectedUser.currentRole].icon}
                  {roleConfig[selectedUser.currentRole].label}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Novo papel:</p>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo papel" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUser && getAvailableRoles(selectedUser.currentRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {roleConfig[role].icon}
                        {roleConfig[role].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUser?.currentRole === 'aluno' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Aluno não pode ser promovido diretamente a admin. Primeiro promova a instrutor.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={!newRole || newRole === selectedUser?.currentRole}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de papel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o papel de <strong>{selectedUser?.nome}</strong> de{' '}
              <strong>{selectedUser && roleConfig[selectedUser.currentRole].label}</strong> para{' '}
              <strong>{newRole && roleConfig[newRole].label}</strong>?
              <br /><br />
              <span className="text-warning">
                Isso altera as permissões de acesso do usuário.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteRoleChange}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? 'Alterando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{userToDelete?.nome}</strong>?
              <br /><br />
              <span className="text-destructive font-semibold">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile View Dialog */}
      <ProfileView
        open={profileViewOpen}
        onClose={() => {
          setProfileViewOpen(false);
          setViewingUserId('');
        }}
        userId={viewingUserId}
      />
    </div>
  );
}
