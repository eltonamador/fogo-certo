import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Calendar, 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  FileQuestion, 
  ListTodo,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for demonstration
const mockStats = {
  admin: {
    totalAlunos: 45,
    totalInstrutores: 8,
    aulasHoje: 4,
    avaliacoesPendentes: 3,
  },
  instrutor: {
    aulasHoje: 2,
    tarefasPendentes: 12,
    avaliacoesPendentes: 2,
    frequenciaMedia: 94.5,
  },
  aluno: {
    frequencia: 96.2,
    notaMedia: 8.5,
    tarefasPendentes: 3,
    proximaAula: 'Combate a Incêndio - 14:00',
  },
};

const mockAvisos = [
  { id: 1, titulo: 'Simulado de Salvamento Aquático', fixado: true, data: '2 horas atrás' },
  { id: 2, titulo: 'Alteração no horário de amanhã', fixado: false, data: '5 horas atrás' },
  { id: 3, titulo: 'Material disponível: Primeiros Socorros', fixado: false, data: '1 dia atrás' },
];

const mockProximasAulas = [
  { id: 1, titulo: 'Combate a Incêndio', horario: '14:00', disciplina: 'Incêndio', local: 'Campo de Treinamento' },
  { id: 2, titulo: 'Primeiros Socorros', horario: '16:00', disciplina: 'Saúde', local: 'Sala 102' },
];

export default function DashboardPage() {
  const { profile, role } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getRoleStats = () => {
    switch (role) {
      case 'admin':
        return mockStats.admin;
      case 'instrutor':
        return mockStats.instrutor;
      default:
        return mockStats.aluno;
    }
  };

  const stats = getRoleStats();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {greeting()}, {profile?.nome?.split(' ')[0] || 'Soldado'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/avisos">
              <Bell className="h-4 w-4 mr-2" />
              Ver Avisos
            </Link>
          </Button>
          <Button asChild variant="fire">
            <Link to="/calendario">
              <Calendar className="h-4 w-4 mr-2" />
              Calendário
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'admin' && (
          <>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.admin).totalAlunos}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Instrutores</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.admin).totalInstrutores}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aulas Hoje</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.admin).aulasHoje}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avaliações Pendentes</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.admin).avaliacoesPendentes}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <FileQuestion className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {role === 'instrutor' && (
          <>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aulas Hoje</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.instrutor).aulasHoje}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.instrutor).tarefasPendentes}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <ListTodo className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avaliações</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.instrutor).avaliacoesPendentes}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <FileQuestion className="h-5 w-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência Média</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.instrutor).frequenciaMedia}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {role === 'aluno' && (
          <>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.aluno).frequencia}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Média</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.aluno).notaMedia}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
                    <p className="text-2xl font-bold">{(stats as typeof mockStats.aluno).tarefasPendentes}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima Aula</p>
                    <p className="text-lg font-semibold truncate">{(stats as typeof mockStats.aluno).proximaAula.split(' - ')[1]}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-fire/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-fire" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Avisos Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Avisos Recentes</CardTitle>
              <CardDescription>Últimas atualizações importantes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/avisos">
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAvisos.map((aviso) => (
              <div
                key={aviso.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  aviso.fixado ? 'bg-fire/10' : 'bg-primary/10'
                }`}>
                  <Bell className={`h-4 w-4 ${aviso.fixado ? 'text-fire' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{aviso.titulo}</p>
                    {aviso.fixado && (
                      <Badge variant="secondary" className="text-xs">Fixado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{aviso.data}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximas Aulas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Próximas Aulas</CardTitle>
              <CardDescription>Agenda de hoje</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendario">
                Ver calendário
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockProximasAulas.map((aula) => (
              <div
                key={aula.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{aula.titulo}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{aula.horario}</span>
                    <span>•</span>
                    <span>{aula.local}</span>
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {aula.disciplina}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/materiais">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Materiais</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/frequencia">
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-sm">Frequência</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/avaliacoes">
                <FileQuestion className="h-5 w-5" />
                <span className="text-sm">Avaliações</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/tarefas">
                <ListTodo className="h-5 w-5" />
                <span className="text-sm">Tarefas</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
