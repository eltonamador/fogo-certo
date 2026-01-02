import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Pin, Search, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aviso } from '@/types/database';

export default function AvisosPage() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Avisos</h1>
          <p className="text-muted-foreground">Comunicados e atualizações importantes</p>
        </div>
        {canCreate && (
          <Button variant="fire">
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
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      aviso.fixado ? 'bg-fire/10' : 'bg-primary/10'
                    }`}>
                      {aviso.fixado ? (
                        <Pin className="h-5 w-5 text-fire" />
                      ) : (
                        <Bell className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{aviso.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Por {aviso.autor?.nome || 'Sistema'} • {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {aviso.fixado && (
                      <Badge variant="destructive" className="bg-fire hover:bg-fire/90">Fixado</Badge>
                    )}
                    {aviso.disciplina && (
                      <Badge variant="outline">{aviso.disciplina.nome}</Badge>
                    )}
                    {aviso.pelotao && (
                      <Badge variant="secondary">{aviso.pelotao.nome}</Badge>
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
    </div>
  );
}
