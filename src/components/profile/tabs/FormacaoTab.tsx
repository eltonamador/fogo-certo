import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { AcademicEducation, ProfessionalExperience } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para formulários
type FormacaoFormData = {
  nivel: 'Fundamental' | 'Médio' | 'Técnico' | 'Superior' | 'Pós-graduação' | 'Mestrado' | 'Doutorado';
  curso: string;
  instituicao: string;
  situacao: 'Concluído' | 'Em andamento' | 'Trancado';
  ano_inicio: string;
  ano_conclusao: string;
  observacoes: string;
};

type ExperienciaFormData = {
  cargo: string;
  organizacao: string;
  tipo: 'Militar' | 'Civil' | 'Voluntário';
  data_inicio: string;
  data_fim: string;
  local: string;
  atividades: string;
  competencias: string[];
};

export function FormacaoTab() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Estados para edição
  const [editingFormacao, setEditingFormacao] = useState<string | null>(null);
  const [editingExperiencia, setEditingExperiencia] = useState<string | null>(null);
  const [newFormacao, setNewFormacao] = useState<Partial<FormacaoFormData> | null>(null);
  const [newExperiencia, setNewExperiencia] = useState<Partial<ExperienciaFormData> | null>(null);

  // Queries
  const { data: formacoes = [], isLoading: loadingFormacoes } = useQuery({
    queryKey: ['academic-education', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_education')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AcademicEducation[];
    },
    enabled: !!user?.id,
  });

  const { data: experiencias = [], isLoading: loadingExperiencias } = useQuery({
    queryKey: ['professional-experience', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_experience')
        .select('*')
        .eq('user_id', user!.id)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data as ProfessionalExperience[];
    },
    enabled: !!user?.id,
  });

  // Mutations
  const createFormacaoMutation = useMutation({
    mutationFn: async (data: FormacaoFormData) => {
      const { error } = await supabase
        .from('academic_education')
        .insert({
          user_id: user!.id,
          ...data,
          ano_inicio: data.ano_inicio || null,
          ano_conclusao: data.ano_conclusao || null,
          observacoes: data.observacoes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      setNewFormacao(null);
      toast.success('Formação adicionada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar formação: ' + error.message);
    },
  });

  const updateFormacaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormacaoFormData }) => {
      const { error } = await supabase
        .from('academic_education')
        .update({
          ...data,
          ano_inicio: data.ano_inicio || null,
          ano_conclusao: data.ano_conclusao || null,
          observacoes: data.observacoes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      setEditingFormacao(null);
      toast.success('Formação atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar formação: ' + error.message);
    },
  });

  const deleteFormacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academic_education')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-education'] });
      toast.success('Formação removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover formação: ' + error.message);
    },
  });

  const createExperienciaMutation = useMutation({
    mutationFn: async (data: ExperienciaFormData) => {
      const { error } = await supabase
        .from('professional_experience')
        .insert({
          user_id: user!.id,
          ...data,
          data_fim: data.data_fim || null,
          local: data.local || null,
          atividades: data.atividades || null,
          competencias: data.competencias && data.competencias.length > 0 ? data.competencias : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experience'] });
      setNewExperiencia(null);
      toast.success('Experiência adicionada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar experiência: ' + error.message);
    },
  });

  const updateExperienciaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExperienciaFormData }) => {
      const { error } = await supabase
        .from('professional_experience')
        .update({
          ...data,
          data_fim: data.data_fim || null,
          local: data.local || null,
          atividades: data.atividades || null,
          competencias: data.competencias && data.competencias.length > 0 ? data.competencias : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experience'] });
      setEditingExperiencia(null);
      toast.success('Experiência atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar experiência: ' + error.message);
    },
  });

  const deleteExperienciaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_experience')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-experience'] });
      toast.success('Experiência removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover experiência: ' + error.message);
    },
  });

  // Handlers
  const handleSaveFormacao = (formData: FormacaoFormData) => {
    if (!formData.nivel || !formData.curso || !formData.instituicao || !formData.situacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (formData.situacao === 'Concluído' && !formData.ano_conclusao) {
      toast.error('Ano de conclusão é obrigatório para formações concluídas');
      return;
    }
    createFormacaoMutation.mutate(formData as FormacaoFormData);
  };

  const handleUpdateFormacao = (id: string, formData: FormacaoFormData) => {
    if (!formData.nivel || !formData.curso || !formData.instituicao || !formData.situacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (formData.situacao === 'Concluído' && !formData.ano_conclusao) {
      toast.error('Ano de conclusão é obrigatório para formações concluídas');
      return;
    }
    updateFormacaoMutation.mutate({ id, data: formData });
  };

  const handleSaveExperiencia = (formData: ExperienciaFormData) => {
    if (!formData.cargo || !formData.organizacao || !formData.tipo || !formData.data_inicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createExperienciaMutation.mutate(formData as ExperienciaFormData);
  };

  const handleUpdateExperiencia = (id: string, formData: ExperienciaFormData) => {
    if (!formData.cargo || !formData.organizacao || !formData.tipo || !formData.data_inicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateExperienciaMutation.mutate({ id, data: formData });
  };

  // Componente de Card de Formação
  const FormacaoCard = ({ formacao, isEditing, onEdit, onCancel, onSave, onDelete }: {
    formacao: AcademicEducation | Partial<FormacaoFormData>;
    isEditing: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
    onSave?: (data: FormacaoFormData) => void;
    onDelete?: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<FormacaoFormData>>({
      nivel: (formacao as AcademicEducation).nivel || (formacao as Partial<FormacaoFormData>).nivel,
      curso: (formacao as AcademicEducation).curso || (formacao as Partial<FormacaoFormData>).curso || '',
      instituicao: (formacao as AcademicEducation).instituicao || (formacao as Partial<FormacaoFormData>).instituicao || '',
      situacao: (formacao as AcademicEducation).situacao || (formacao as Partial<FormacaoFormData>).situacao,
      ano_inicio: (formacao as AcademicEducation).ano_inicio || (formacao as Partial<FormacaoFormData>).ano_inicio || '',
      ano_conclusao: (formacao as AcademicEducation).ano_conclusao || (formacao as Partial<FormacaoFormData>).ano_conclusao || '',
      observacoes: (formacao as AcademicEducation).observacoes || (formacao as Partial<FormacaoFormData>).observacoes || '',
    });

    if (isEditing) {
      return (
        <Card className="border-primary/50">
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nível *</Label>
                <Select
                  value={formData.nivel}
                  onValueChange={(v) => setFormData({ ...formData, nivel: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fundamental">Fundamental</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Superior">Superior</SelectItem>
                    <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                    <SelectItem value="Mestrado">Mestrado</SelectItem>
                    <SelectItem value="Doutorado">Doutorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Curso/Área *</Label>
                <Input
                  value={formData.curso}
                  onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                  placeholder="Ex: Engenharia, Administração"
                />
              </div>
              <div>
                <Label>Instituição *</Label>
                <Input
                  value={formData.instituicao}
                  onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                  placeholder="Nome da instituição"
                />
              </div>
              <div>
                <Label>Situação *</Label>
                <Select
                  value={formData.situacao}
                  onValueChange={(v) => setFormData({ ...formData, situacao: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Trancado">Trancado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano de Início</Label>
                <Input
                  type="text"
                  value={formData.ano_inicio}
                  onChange={(e) => setFormData({ ...formData, ano_inicio: e.target.value })}
                  placeholder="Ex: 2020"
                  maxLength={4}
                />
              </div>
              <div>
                <Label>Ano de Conclusão {formData.situacao === 'Concluído' && '*'}</Label>
                <Input
                  type="text"
                  value={formData.ano_conclusao}
                  onChange={(e) => setFormData({ ...formData, ano_conclusao: e.target.value })}
                  placeholder="Ex: 2024"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={() => onSave?.(formData as FormacaoFormData)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{(formacao as AcademicEducation).curso}</h4>
                <Badge variant="outline">{(formacao as AcademicEducation).nivel}</Badge>
                <Badge variant={(formacao as AcademicEducation).situacao === 'Concluído' ? 'default' : 'secondary'}>
                  {(formacao as AcademicEducation).situacao}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {(formacao as AcademicEducation).instituicao}
              </p>
              {(formacao as AcademicEducation).ano_inicio || (formacao as AcademicEducation).ano_conclusao ? (
                <p className="text-xs text-muted-foreground">
                  {[(formacao as AcademicEducation).ano_inicio, (formacao as AcademicEducation).ano_conclusao]
                    .filter(Boolean)
                    .join(' - ')}
                </p>
              ) : null}
              {(formacao as AcademicEducation).observacoes && (
                <p className="text-sm text-muted-foreground">
                  {(formacao as AcademicEducation).observacoes}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de Card de Experiência
  const ExperienciaCard = ({ experiencia, isEditing, onEdit, onCancel, onSave, onDelete }: {
    experiencia: ProfessionalExperience | Partial<ExperienciaFormData>;
    isEditing: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
    onSave?: (data: ExperienciaFormData) => void;
    onDelete?: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<ExperienciaFormData>>({
      cargo: (experiencia as ProfessionalExperience).cargo || (experiencia as Partial<ExperienciaFormData>).cargo || '',
      organizacao: (experiencia as ProfessionalExperience).organizacao || (experiencia as Partial<ExperienciaFormData>).organizacao || '',
      tipo: (experiencia as ProfessionalExperience).tipo || (experiencia as Partial<ExperienciaFormData>).tipo,
      data_inicio: (experiencia as ProfessionalExperience).data_inicio 
        ? format(new Date((experiencia as ProfessionalExperience).data_inicio), 'yyyy-MM-dd')
        : (experiencia as Partial<ExperienciaFormData>).data_inicio || '',
      data_fim: (experiencia as ProfessionalExperience).data_fim
        ? format(new Date((experiencia as ProfessionalExperience).data_fim), 'yyyy-MM-dd')
        : (experiencia as Partial<ExperienciaFormData>).data_fim || '',
      local: (experiencia as ProfessionalExperience).local || (experiencia as Partial<ExperienciaFormData>).local || '',
      atividades: (experiencia as ProfessionalExperience).atividades || (experiencia as Partial<ExperienciaFormData>).atividades || '',
      competencias: (experiencia as ProfessionalExperience).competencias as string[] || (experiencia as Partial<ExperienciaFormData>).competencias || [],
    });

    const [competenciaInput, setCompetenciaInput] = useState('');

    const addCompetencia = () => {
      if (competenciaInput.trim()) {
        setFormData({
          ...formData,
          competencias: [...(formData.competencias || []), competenciaInput.trim()],
        });
        setCompetenciaInput('');
      }
    };

    const removeCompetencia = (index: number) => {
      setFormData({
        ...formData,
        competencias: formData.competencias?.filter((_, i) => i !== index) || [],
      });
    };

    if (isEditing) {
      return (
        <Card className="border-primary/50">
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Cargo/Função *</Label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Soldado, Sargento, Bombeiro"
                />
              </div>
              <div>
                <Label>Organização/Unidade *</Label>
                <Input
                  value={formData.organizacao}
                  onChange={(e) => setFormData({ ...formData, organizacao: e.target.value })}
                  placeholder="Nome da organização"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Militar">Militar</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Voluntário">Voluntário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Local (Cidade/UF)</Label>
                <Input
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Ex: São Paulo/SP"
                />
              </div>
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Fim (deixe vazio se atual)</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Principais Atividades</Label>
              <Textarea
                value={formData.atividades}
                onChange={(e) => setFormData({ ...formData, atividades: e.target.value })}
                placeholder="Descreva as principais atividades desenvolvidas"
                rows={3}
              />
            </div>
            <div>
              <Label>Competências</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={competenciaInput}
                  onChange={(e) => setCompetenciaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetencia())}
                  placeholder="Digite e pressione Enter"
                />
                <Button type="button" variant="outline" onClick={addCompetencia}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.competencias && formData.competencias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.competencias.map((comp, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeCompetencia(idx)}>
                      {comp} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={() => onSave?.(formData as ExperienciaFormData)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{(experiencia as ProfessionalExperience).cargo}</h4>
                <Badge variant="outline">{(experiencia as ProfessionalExperience).tipo}</Badge>
                {!(experiencia as ProfessionalExperience).data_fim && (
                  <Badge variant="default">Atual</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {(experiencia as ProfessionalExperience).organizacao}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date((experiencia as ProfessionalExperience).data_inicio), 'MM/yyyy', { locale: ptBR })}
                {' - '}
                {(experiencia as ProfessionalExperience).data_fim
                  ? format(new Date((experiencia as ProfessionalExperience).data_fim), 'MM/yyyy', { locale: ptBR })
                  : 'Atual'}
                {(experiencia as ProfessionalExperience).local && ` • ${(experiencia as ProfessionalExperience).local}`}
              </p>
              {(experiencia as ProfessionalExperience).atividades && (
                <p className="text-sm text-muted-foreground">
                  {(experiencia as ProfessionalExperience).atividades}
                </p>
              )}
              {(experiencia as ProfessionalExperience).competencias && 
               (experiencia as ProfessionalExperience).competencias!.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {((experiencia as ProfessionalExperience).competencias as string[]).map((comp, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {comp}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seção Formação e Experiência - PRIMEIRO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Formação e Experiência
              </CardTitle>
              <CardDescription className="mt-1">
                Formações: {formacoes.length} | Experiências: {experiencias.length}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formação Acadêmica */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formação Acadêmica
              </h3>
              {!newFormacao && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewFormacao({})}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar formação
                </Button>
              )}
            </div>

            {newFormacao && (
              <FormacaoCard
                formacao={newFormacao}
                isEditing={true}
                onCancel={() => setNewFormacao(null)}
                onSave={(data) => {
                  handleSaveFormacao(data);
                }}
              />
            )}

            {loadingFormacoes ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : formacoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma formação cadastrada</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {formacoes.map((formacao) => (
                  <AccordionItem key={formacao.id} value={formacao.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <span className="font-medium">{formacao.curso}</span>
                        <Badge variant="outline" className="text-xs">{formacao.nivel}</Badge>
                        <Badge variant={formacao.situacao === 'Concluído' ? 'default' : 'secondary'} className="text-xs">
                          {formacao.situacao}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {editingFormacao === formacao.id ? (
                        <FormacaoCard
                          formacao={formacao}
                          isEditing={true}
                          onCancel={() => setEditingFormacao(null)}
                          onSave={(data) => handleUpdateFormacao(formacao.id, data)}
                        />
                      ) : (
                        <FormacaoCard
                          formacao={formacao}
                          isEditing={false}
                          onEdit={() => setEditingFormacao(formacao.id)}
                          onDelete={() => {
                            if (confirm('Tem certeza que deseja remover esta formação?')) {
                              deleteFormacaoMutation.mutate(formacao.id);
                            }
                          }}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <Separator />

          {/* Experiência Profissional */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experiência Profissional
              </h3>
              {!newExperiencia && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewExperiencia({})}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar experiência
                </Button>
              )}
            </div>

            {newExperiencia && (
              <ExperienciaCard
                experiencia={newExperiencia}
                isEditing={true}
                onCancel={() => setNewExperiencia(null)}
                onSave={(data) => {
                  handleSaveExperiencia(data);
                }}
              />
            )}

            {loadingExperiencias ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : experiencias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma experiência cadastrada</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {experiencias.map((experiencia) => (
                  <AccordionItem key={experiencia.id} value={experiencia.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <span className="font-medium">{experiencia.cargo}</span>
                        <Badge variant="outline" className="text-xs">{experiencia.tipo}</Badge>
                        {!experiencia.data_fim && (
                          <Badge variant="default" className="text-xs">Atual</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {editingExperiencia === experiencia.id ? (
                        <ExperienciaCard
                          experiencia={experiencia}
                          isEditing={true}
                          onCancel={() => setEditingExperiencia(null)}
                          onSave={(data) => handleUpdateExperiencia(experiencia.id, data)}
                        />
                      ) : (
                        <ExperienciaCard
                          experiencia={experiencia}
                          isEditing={false}
                          onEdit={() => setEditingExperiencia(experiencia.id)}
                          onDelete={() => {
                            if (confirm('Tem certeza que deseja remover esta experiência?')) {
                              deleteExperienciaMutation.mutate(experiencia.id);
                            }
                          }}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção Cursos Operacionais - DEPOIS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Cursos Operacionais
          </CardTitle>
          <CardDescription>
            Cursos profissionais e técnicos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Campo mantido temporariamente</p>
            <p>Este campo será atualizado em uma próxima versão com MultiSelect e opção "Outros".</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
