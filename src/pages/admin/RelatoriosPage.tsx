import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Filter, FileSpreadsheet, Printer } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Profile, AppRole } from '@/types/database';
import { toast } from 'sonner';
import { ReportPrintView } from '@/components/reports/ReportPrintView';
import { createRoot } from 'react-dom/client';

interface ReportFilters {
  role: 'todos' | AppRole;
  pelotao_id: string;
  perfil_completo: 'todos' | 'sim' | 'nao';
  tipo_sanguineo: string;
}

interface ReportFields {
  basicos: boolean;
  pessoais: boolean;
  endereco: boolean;
  contato_emergencia: boolean;
  formacao: boolean;
  saude: boolean;
}

const REPORT_TEMPLATES = [
  {
    id: 'perfis-incompletos',
    nome: 'Perfis Incompletos',
    descricao: 'Usuários que ainda não completaram o cadastro',
    icon: FileText,
    filters: { perfil_completo: 'nao' as const },
    fields: { basicos: true, pessoais: false, endereco: false, contato_emergencia: false, formacao: false, saude: false }
  },
  {
    id: 'emergencia',
    nome: 'Dados de Emergência',
    descricao: 'Tipo sanguíneo e contatos de emergência',
    icon: FileText,
    filters: { perfil_completo: 'sim' as const },
    fields: { basicos: true, pessoais: true, endereco: false, contato_emergencia: true, formacao: false, saude: true }
  },
  {
    id: 'tipo-sanguineo',
    nome: 'Tipo Sanguíneo',
    descricao: 'Lista rápida de tipos sanguíneos',
    icon: FileText,
    filters: { perfil_completo: 'todos' as const },
    fields: { basicos: true, pessoais: true, endereco: false, contato_emergencia: false, formacao: false, saude: false }
  },
  {
    id: 'alunos-pelotao',
    nome: 'Alunos por Pelotão',
    descricao: 'Lista completa de alunos agrupada por pelotão',
    icon: FileText,
    filters: { role: 'aluno' as const, perfil_completo: 'todos' as const },
    fields: { basicos: true, pessoais: true, endereco: true, contato_emergencia: true, formacao: false, saude: false }
  },
  {
    id: 'formacao',
    nome: 'Formação e Cursos',
    descricao: 'Cursos operacionais realizados',
    icon: FileText,
    filters: { perfil_completo: 'todos' as const },
    fields: { basicos: true, pessoais: false, endereco: false, contato_emergencia: false, formacao: true, saude: false }
  },
  {
    id: 'completo',
    nome: 'Relatório Completo',
    descricao: 'Todos os dados disponíveis',
    icon: FileText,
    filters: { perfil_completo: 'todos' as const },
    fields: { basicos: true, pessoais: true, endereco: true, contato_emergencia: true, formacao: true, saude: true }
  }
];

export default function RelatoriosPage() {
  const { role: userRole } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({
    role: 'todos',
    pelotao_id: 'todos',
    perfil_completo: 'todos',
    tipo_sanguineo: 'todos'
  });

  const [fields, setFields] = useState<ReportFields>({
    basicos: true,
    pessoais: false,
    endereco: false,
    contato_emergencia: false,
    formacao: false,
    saude: false
  });

  const [showPreview, setShowPreview] = useState(false);

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Buscar todos os perfis
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, pelotao:pelotoes(*)')
        .order('nome');

      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // Buscar roles dos usuários
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      return data;
    },
  });

  // Buscar pelotões
  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const userRoleEntry = userRoles?.find(ur => ur.user_id === userId);
    return (userRoleEntry?.role as AppRole) || 'aluno';
  };

  // Filtrar perfis
  const filteredProfiles = profiles?.filter(profile => {
    const role = getUserRole(profile.id);

    // Filtro de role
    if (filters.role !== 'todos' && role !== filters.role) return false;

    // Filtro de pelotão
    if (filters.pelotao_id !== 'todos' && profile.pelotao_id !== filters.pelotao_id) return false;

    // Filtro de perfil completo
    if (filters.perfil_completo === 'sim' && !profile.perfil_completo) return false;
    if (filters.perfil_completo === 'nao' && profile.perfil_completo) return false;

    // Filtro de tipo sanguíneo
    if (filters.tipo_sanguineo !== 'todos' && profile.tipo_sanguineo !== filters.tipo_sanguineo) return false;

    return true;
  });

  const applyTemplate = (template: typeof REPORT_TEMPLATES[0]) => {
    setFilters(prev => ({ ...prev, ...template.filters }));
    setFields(template.fields);
    toast.success(`Template "${template.nome}" aplicado`);
  };

  const handlePrint = () => {
    if (!filteredProfiles || filteredProfiles.length === 0) {
      toast.error('Nenhum dado para imprimir');
      return;
    }

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Bloqueador de pop-up ativo. Permita pop-ups para este site.');
      return;
    }

    printWindow.document.write('<html><head><title>Relatório</title></head><body>');
    printWindow.document.write('<div id="print-root"></div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Renderizar o componente React na nova janela
    const printRoot = printWindow.document.getElementById('print-root');
    if (printRoot) {
      const root = createRoot(printRoot);
      root.render(
        <ReportPrintView
          profiles={filteredProfiles}
          getUserRole={getUserRole}
          fields={fields}
          filters={filters}
        />
      );

      // Aguardar renderização e então imprimir
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 100);
      }, 500);
    }
  };

  const handleGeneratePDF = () => {
    if (!filteredProfiles || filteredProfiles.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    // Usar o mesmo método de impressão, mas o usuário pode escolher "Salvar como PDF"
    toast.info('Use a opção "Salvar como PDF" na janela de impressão que irá abrir');
    handlePrint();
  };

  const handleGenerateExcel = () => {
    if (!filteredProfiles || filteredProfiles.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    // Criar CSV
    const headers: string[] = [];
    if (fields.basicos) headers.push('Nome', 'Email', 'Telefone', 'Matrícula', 'Papel');
    if (fields.pessoais) headers.push('CPF', 'Data Nascimento', 'Sexo', 'Tipo Sanguíneo');
    if (fields.endereco) headers.push('CEP', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'UF');
    if (fields.contato_emergencia) headers.push('Contato Emergência', 'Parentesco', 'Telefone Emergência');
    if (fields.formacao) headers.push('Cursos Operacionais');
    if (fields.saude) headers.push('Doença Crônica', 'Alergias', 'Medicamentos');

    const rows = filteredProfiles.map(profile => {
      const row: string[] = [];
      const role = getUserRole(profile.id);

      if (fields.basicos) {
        row.push(
          profile.nome || '',
          profile.email || '',
          profile.telefone || '',
          profile.matricula || '',
          role === 'admin' ? 'Administrador' : role === 'instrutor' ? 'Instrutor' : 'Aluno'
        );
      }
      if (fields.pessoais) {
        row.push(
          profile.cpf || '',
          profile.data_nascimento || '',
          profile.sexo || '',
          profile.tipo_sanguineo || ''
        );
      }
      if (fields.endereco && profile.endereco) {
        row.push(
          profile.endereco.cep || '',
          profile.endereco.logradouro || '',
          profile.endereco.numero || '',
          profile.endereco.bairro || '',
          profile.endereco.cidade || '',
          profile.endereco.uf || ''
        );
      } else if (fields.endereco) {
        row.push('', '', '', '', '', '');
      }
      if (fields.contato_emergencia && profile.contato_emergencia) {
        row.push(
          profile.contato_emergencia.nome || '',
          profile.contato_emergencia.parentesco || '',
          profile.contato_emergencia.telefone || ''
        );
      } else if (fields.contato_emergencia) {
        row.push('', '', '');
      }
      if (fields.formacao) {
        row.push(profile.cursos_operacionais_outros || '');
      }
      if (fields.saude && profile.saude) {
        row.push(
          profile.saude.doenca_cronica ? 'Sim' : 'Não',
          profile.saude.alergias || '',
          profile.saude.medicamentos_uso || ''
        );
      } else if (fields.saude) {
        row.push('', '', '');
      }

      return row;
    });

    // Gerar CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Gerar relatórios personalizados de usuários</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Templates */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Templates de Relatórios</CardTitle>
            <CardDescription>Escolha um template pré-configurado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TEMPLATES.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => applyTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <template.icon className="h-4 w-4" />
                      {template.nome}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.descricao}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Personalize os filtros do relatório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Usuário</Label>
                <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="instrutor">Instrutores</SelectItem>
                    <SelectItem value="aluno">Alunos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pelotão</Label>
                <Select value={filters.pelotao_id} onValueChange={(v) => setFilters({ ...filters, pelotao_id: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {pelotoes?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} - {p.turma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Perfil Completo</Label>
                <Select value={filters.perfil_completo} onValueChange={(v) => setFilters({ ...filters, perfil_completo: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo Sanguíneo</Label>
                <Select value={filters.tipo_sanguineo} onValueChange={(v) => setFilters({ ...filters, tipo_sanguineo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">Campos a Incluir</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basicos"
                    checked={fields.basicos}
                    onCheckedChange={(checked) => setFields({ ...fields, basicos: checked as boolean })}
                  />
                  <label htmlFor="basicos" className="text-sm cursor-pointer">
                    Dados Básicos (nome, email, telefone, matrícula)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pessoais"
                    checked={fields.pessoais}
                    onCheckedChange={(checked) => setFields({ ...fields, pessoais: checked as boolean })}
                  />
                  <label htmlFor="pessoais" className="text-sm cursor-pointer">
                    Dados Pessoais (CPF, data nascimento, sexo, tipo sanguíneo)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="endereco"
                    checked={fields.endereco}
                    onCheckedChange={(checked) => setFields({ ...fields, endereco: checked as boolean })}
                  />
                  <label htmlFor="endereco" className="text-sm cursor-pointer">
                    Endereço Completo
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contato_emergencia"
                    checked={fields.contato_emergencia}
                    onCheckedChange={(checked) => setFields({ ...fields, contato_emergencia: checked as boolean })}
                  />
                  <label htmlFor="contato_emergencia" className="text-sm cursor-pointer">
                    Contato de Emergência
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="formacao"
                    checked={fields.formacao}
                    onCheckedChange={(checked) => setFields({ ...fields, formacao: checked as boolean })}
                  />
                  <label htmlFor="formacao" className="text-sm cursor-pointer">
                    Formação e Cursos Operacionais
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saude"
                    checked={fields.saude}
                    onCheckedChange={(checked) => setFields({ ...fields, saude: checked as boolean })}
                  />
                  <label htmlFor="saude" className="text-sm cursor-pointer">
                    Dados de Saúde <Badge variant="destructive" className="ml-2">Sensível</Badge>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo e Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registros:</span>
                <span className="font-semibold">{filteredProfiles?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campos:</span>
                <span className="font-semibold">
                  {Object.values(fields).filter(Boolean).length}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Visualizar'} Preview
              </Button>

              <Button
                className="w-full"
                onClick={handleGenerateExcel}
                disabled={!filteredProfiles || filteredProfiles.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel/CSV
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={!filteredProfiles || filteredProfiles.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={handlePrint}
                disabled={!filteredProfiles || filteredProfiles.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {showPreview && filteredProfiles && filteredProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do Relatório</CardTitle>
            <CardDescription>
              Visualização dos primeiros {Math.min(10, filteredProfiles.length)} registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {fields.basicos && (
                      <>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Papel</th>
                      </>
                    )}
                    {fields.pessoais && (
                      <>
                        <th className="text-left p-2">CPF</th>
                        <th className="text-left p-2">Tipo Sang.</th>
                      </>
                    )}
                    {fields.endereco && (
                      <>
                        <th className="text-left p-2">Cidade</th>
                        <th className="text-left p-2">UF</th>
                      </>
                    )}
                    {fields.contato_emergencia && (
                      <th className="text-left p-2">Contato Emerg.</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.slice(0, 10).map(profile => {
                    const role = getUserRole(profile.id);
                    return (
                      <tr key={profile.id} className="border-b">
                        {fields.basicos && (
                          <>
                            <td className="p-2">{profile.nome}</td>
                            <td className="p-2">{profile.email}</td>
                            <td className="p-2 capitalize">{role}</td>
                          </>
                        )}
                        {fields.pessoais && (
                          <>
                            <td className="p-2">{profile.cpf || '-'}</td>
                            <td className="p-2">{profile.tipo_sanguineo || '-'}</td>
                          </>
                        )}
                        {fields.endereco && (
                          <>
                            <td className="p-2">{profile.endereco?.cidade || '-'}</td>
                            <td className="p-2">{profile.endereco?.uf || '-'}</td>
                          </>
                        )}
                        {fields.contato_emergencia && (
                          <td className="p-2">{profile.contato_emergencia?.nome || '-'}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredProfiles.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                ... e mais {filteredProfiles.length - 10} registros
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
