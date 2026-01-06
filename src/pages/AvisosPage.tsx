import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Pin, Search, Plus, Filter, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aviso } from '@/types/database';
import { AvisoDialog } from '@/components/avisos/AvisoDialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function AvisosPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avisoToDelete, setAvisoToDelete] = useState<string | null>(null);

  const { data: avisos, isLoading } = useQuery({
    queryKey: ['avisos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos')
        .select('*, autor:profiles(*), pelotao:pelotoes(*), disciplina:disciplinas(*)')
        .order('fixado', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Aviso[];
    },
  });

  const filteredAvisos = avisos?.filter(aviso =>
    aviso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aviso.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = role === 'admin' || role === 'instrutor';

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async (avisoId: string) => {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', avisoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      toast.success('Aviso excluído com sucesso!');
      setDeleteDialogOpen(false);
      setAvisoToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir aviso: ' + error.message);
    },
  });

  const handleNewAviso = () => {
    setSelectedAviso(null);
    setDialogOpen(true);
  };

  const handleEditAviso = (aviso: Aviso) => {
    setSelectedAviso(aviso);
    setDialogOpen(true);
  };

  const handleDeleteAviso = (avisoId: string) => {
    setAvisoToDelete(avisoId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (avisoToDelete) {
      deleteMutation.mutate(avisoToDelete);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Avisos</h1>
          <p className="text-muted-foreground">Comunicados e atualizações importantes</p>
        </div>
        {canCreate && (
          <Button variant="fire" onClick={handleNewAviso}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aviso
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar avisos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Avisos List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAvisos?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum aviso encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente buscar com outros termos.' : 'Não há avisos no momento.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvisos?.map((aviso) => (
            <Card key={aviso.id} className={`card-hover ${aviso.fixado ? 'border-fire/30 bg-fire/5' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      aviso.fixado ? 'bg-fire/10' : 'bg-primary/10'
                    }`}>
                      {aviso.fixado ? (
                        <Pin className="h-5 w-5 text-fire" />
                      ) : (
                        <Bell className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{aviso.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Por {aviso.autor?.nome || 'Sistema'} • {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {aviso.fixado && (
                      <Badge variant="destructive" className="bg-fire hover:bg-fire/90">Fixado</Badge>
                    )}
                    {aviso.disciplina && (
                      <Badge variant="outline">{aviso.disciplina.nome}</Badge>
                    )}
                    {aviso.pelotao && (
                      <Badge variant="secondary">{aviso.pelotao.nome}</Badge>
                    )}
                    {canCreate && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAviso(aviso)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAviso(aviso.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 whitespace-pre-wrap">{aviso.conteudo}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <AvisoDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedAviso(null);
        }}
        aviso={selectedAviso}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este aviso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
