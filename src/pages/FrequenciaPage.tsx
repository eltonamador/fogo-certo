import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck, Download, CheckCircle2, XCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aula, Presenca, Disciplina, StatusPresenca } from '@/types/database';

const statusConfig: Record<StatusPresenca, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' }> = {
  presente: { label: 'Presente', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' },
  ausente: { label: 'Ausente', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' },
  justificado: { label: 'Justificado', icon: <AlertCircle className="h-4 w-4" />, variant: 'secondary' },
};

export default function FrequenciaPage() {
  const { role, user } = useAuth();
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');

  const { data: presencas, isLoading } = useQuery({
    queryKey: ['presencas', role, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('presencas')
        .select('*, aluno:profiles(*), aula:aulas(*, disciplina:disciplinas(*))');
      
      if (role === 'aluno' && user) {
        query = query.eq('aluno_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Presenca[];
    },
  });

  const { data: disciplinas } = useQuery({
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

  const filteredPresencas = presencas?.filter(presenca => {
    if (filterDisciplina === 'todas') return true;
    return presenca.aula?.disciplina_id === filterDisciplina;
  });

  // Calculate stats
  const stats = {
    total: filteredPresencas?.length || 0,
    presentes: filteredPresencas?.filter(p => p.status === 'presente').length || 0,
    ausentes: filteredPresencas?.filter(p => p.status === 'ausente').length || 0,
    justificados: filteredPresencas?.filter(p => p.status === 'justificado').length || 0,
  };

  const frequenciaPercent = stats.total > 0 
    ? ((stats.presentes + stats.justificados) / stats.total * 100).toFixed(1) 
    : '0';

  const canManage = role === 'admin' || role === 'instrutor';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Frequência</h1>
          <p className="text-muted-foreground">
            {role === 'aluno' ? 'Seu histórico de presença' : 'Controle de presença das aulas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas disciplinas</SelectItem>
              {disciplinas?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequência</p>
                <p className="text-2xl font-bold">{frequenciaPercent}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presenças</p>
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
                <p className="text-sm text-muted-foreground">Ausências</p>
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
                <p className="text-sm text-muted-foreground">Justificadas</p>
                <p className="text-2xl font-bold text-warning">{stats.justificados}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frequency Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredPresencas?.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">Os registros de presença aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aula</TableHead>
                    <TableHead>Disciplina</TableHead>
                    {canManage && <TableHead>Aluno</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPresencas?.map((presenca) => {
                    const config = statusConfig[presenca.status];
                    return (
                      <TableRow key={presenca.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {presenca.aula?.data_hora 
                              ? format(new Date(presenca.aula.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {presenca.aula?.titulo || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {presenca.aula?.disciplina?.nome || '-'}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {presenca.aluno?.nome || '-'}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {presenca.observacao || '-'}
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
