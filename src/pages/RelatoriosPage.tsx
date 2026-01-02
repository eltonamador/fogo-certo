import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Users, TrendingUp, Award, Calendar } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Disciplina } from '@/types/database';

// Mock data for charts
const mockFrequenciaData = [
  { disciplina: 'Incêndio', frequencia: 95 },
  { disciplina: 'Salvamento', frequencia: 92 },
  { disciplina: 'Saúde', frequencia: 88 },
  { disciplina: 'Técnica', frequencia: 94 },
  { disciplina: 'Física', frequencia: 90 },
];

const mockNotasData = [
  { disciplina: 'Incêndio', media: 8.5 },
  { disciplina: 'Salvamento', media: 7.8 },
  { disciplina: 'Saúde', media: 9.2 },
  { disciplina: 'Técnica', media: 8.0 },
  { disciplina: 'Física', media: 7.5 },
];

const mockDistribuicaoNotas = [
  { faixa: 'A (9-10)', valor: 12, cor: '#22c55e' },
  { faixa: 'B (7-8.9)', valor: 18, cor: '#3b82f6' },
  { faixa: 'C (5-6.9)', valor: 10, cor: '#f59e0b' },
  { faixa: 'D (0-4.9)', valor: 5, cor: '#ef4444' },
];

const mockEvolucaoMensal = [
  { mes: 'Jan', frequencia: 92, notas: 7.5 },
  { mes: 'Fev', frequencia: 94, notas: 7.8 },
  { mes: 'Mar', frequencia: 91, notas: 8.0 },
  { mes: 'Abr', frequencia: 95, notas: 8.2 },
  { mes: 'Mai', frequencia: 93, notas: 8.5 },
  { mes: 'Jun', frequencia: 96, notas: 8.4 },
];

export default function RelatoriosPage() {
  const { role } = useAuth();
  const [selectedPelotao, setSelectedPelotao] = useState('todos');
  const [selectedDisciplina, setSelectedDisciplina] = useState('todas');

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

  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  if (role === 'aluno') {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Os relatórios estão disponíveis apenas para instrutores e administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Indicadores e análises do curso</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPelotao} onValueChange={setSelectedPelotao}>
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
          <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas disciplinas</SelectItem>
              {disciplinas?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">45</p>
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
                <p className="text-sm text-muted-foreground">Frequência Geral</p>
                <p className="text-2xl font-bold">93.2%</p>
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
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <p className="text-2xl font-bold">8.2</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aproveitamento</p>
                <p className="text-2xl font-bold">91%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Frequência por Disciplina */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequência por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockFrequenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="disciplina" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="frequencia" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Média de Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Média de Notas por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockNotasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="disciplina" fontSize={12} />
                  <YAxis domain={[0, 10]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="media" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockDistribuicaoNotas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="valor"
                    label={({ faixa }) => faixa}
                  >
                    {mockDistribuicaoNotas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockEvolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis yAxisId="left" domain={[80, 100]} fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} fontSize={12} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="frequencia" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="notas" stroke="hsl(var(--info))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Frequência (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-info" />
                <span className="text-muted-foreground">Notas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
