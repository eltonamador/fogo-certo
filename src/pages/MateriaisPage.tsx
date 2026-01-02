import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Video, Link as LinkIcon, File, Search, Plus, Download, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Material, Disciplina, TipoMaterial } from '@/types/database';

const tipoIcons: Record<TipoMaterial, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  documento: <File className="h-5 w-5" />,
};

const tipoLabels: Record<TipoMaterial, string> = {
  pdf: 'PDF',
  video: 'Vídeo',
  link: 'Link',
  documento: 'Documento',
};

export default function MateriaisPage() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  const { data: materiais, isLoading } = useQuery({
    queryKey: ['materiais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiais')
        .select('*, disciplina:disciplinas(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Material[];
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

  const filteredMateriais = materiais?.filter(material => {
    const matchesSearch = material.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDisciplina = filterDisciplina === 'todas' || material.disciplina_id === filterDisciplina;
    const matchesTipo = filterTipo === 'todos' || material.tipo === filterTipo;
    return matchesSearch && matchesDisciplina && matchesTipo;
  });

  const canCreate = role === 'admin' || role === 'instrutor';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">PDFs, vídeos, links e documentos do curso</p>
        </div>
        {canCreate && (
          <Button variant="fire">
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas disciplinas</SelectItem>
            {disciplinas?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos tipos</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="documento">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(null).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-10 w-10 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredMateriais?.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterDisciplina !== 'todas' || filterTipo !== 'todos' 
                  ? 'Tente ajustar os filtros.' 
                  : 'Os materiais do curso aparecerão aqui.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMateriais?.map((material) => (
            <Card key={material.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${material.disciplina?.cor || '#1e3a5f'}20` }}
                  >
                    <span style={{ color: material.disciplina?.cor || '#1e3a5f' }}>
                      {tipoIcons[material.tipo]}
                    </span>
                  </div>
                  <Badge variant="outline">{tipoLabels[material.tipo]}</Badge>
                </div>
                <CardTitle className="text-lg mt-3 line-clamp-2">{material.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{material.descricao}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{material.disciplina?.nome}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(material.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  {material.tipo === 'link' ? (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
