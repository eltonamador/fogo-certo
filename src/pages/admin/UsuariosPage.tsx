import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Plus, Edit, Trash2, Shield, GraduationCap, UserCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Profile, AppRole, Pelotao } from '@/types/database';

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Administrador', icon: <Shield className="h-4 w-4" />, variant: 'default' },
  instrutor: { label: 'Instrutor', icon: <GraduationCap className="h-4 w-4" />, variant: 'secondary' },
  aluno: { label: 'Aluno', icon: <UserCircle className="h-4 w-4" />, variant: 'outline' },
};

export default function AdminUsuariosPage() {
  const { role: userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');
  const [filterPelotao, setFilterPelotao] = useState<string>('todos');

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

  // Stats
  const stats = {
    total: profiles?.length || 0,
    admins: profiles?.filter(p => getUserRole(p.id) === 'admin').length || 0,
    instrutores: profiles?.filter(p => getUserRole(p.id) === 'instrutor').length || 0,
    alunos: profiles?.filter(p => getUserRole(p.id) === 'aluno').length || 0,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerenciamento de usuários do sistema</p>
        </div>
        <Button variant="fire">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
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
                            <Button variant="ghost" size="icon-sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
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
