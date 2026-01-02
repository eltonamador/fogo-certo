import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Disciplina } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export default function DisciplinasPage() {
  const { role } = useAuth();

  const { data: disciplinas, isLoading } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Disciplina[];
    },
  });

  const canManage = role === 'admin';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Disciplinas</h1>
          <p className="text-muted-foreground">Todas as disciplinas do curso de formação</p>
        </div>
        {canManage && (
          <Button variant="fire">
            <Plus className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        )}
      </div>

      {/* Disciplinas Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(null).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-10 w-10 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : disciplinas?.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma disciplina cadastrada</h3>
              <p className="text-muted-foreground">
                As disciplinas do curso aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          disciplinas?.map((disciplina) => (
            <Card key={disciplina.id} className="card-hover group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${disciplina.cor}20` }}
                  >
                    <BookOpen className="h-5 w-5" style={{ color: disciplina.cor }} />
                  </div>
                  <Button variant="ghost" size="icon-sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/disciplinas/${disciplina.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <CardTitle className="text-lg mt-3">{disciplina.nome}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {disciplina.descricao || 'Sem descrição disponível'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{disciplina.carga_horaria}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
