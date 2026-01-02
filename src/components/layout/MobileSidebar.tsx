import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Bell, 
  Calendar, 
  BookOpen, 
  FileText, 
  Users, 
  ClipboardCheck, 
  FileQuestion, 
  ListTodo, 
  BarChart3,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'instrutor' | 'aluno')[];
}

const allNavItems: NavItem[] = [
  { title: 'Painel', href: '/dashboard', icon: Home },
  { title: 'Avisos', href: '/avisos', icon: Bell },
  { title: 'Calendário', href: '/calendario', icon: Calendar },
  { title: 'Disciplinas', href: '/disciplinas', icon: BookOpen },
  { title: 'Materiais', href: '/materiais', icon: FileText },
  { title: 'Frequência', href: '/frequencia', icon: ClipboardCheck },
  { title: 'Avaliações', href: '/avaliacoes', icon: FileQuestion },
  { title: 'Tarefas', href: '/tarefas', icon: ListTodo },
  { title: 'Minha Situação', href: '/minha-situacao', icon: BarChart3, roles: ['aluno'] },
  { title: 'Chamada', href: '/chamada', icon: ClipboardCheck, roles: ['admin', 'instrutor'] },
  { title: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['admin', 'instrutor'] },
  { title: 'Turmas', href: '/admin/turmas', icon: GraduationCap, roles: ['admin'] },
  { title: 'Pelotões', href: '/admin/pelotoes', icon: Shield, roles: ['admin'] },
  { title: 'Usuários', href: '/admin/usuarios', icon: Users, roles: ['admin'] },
];

export function MobileSidebar() {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();

  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return role && item.roles.includes(role);
    });
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'instrutor': return 'Instrutor';
      case 'aluno': return 'Aluno';
      default: return 'Usuário';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin': return Shield;
      case 'instrutor': return GraduationCap;
      default: return Users;
    }
  };

  const RoleIcon = getRoleIcon(role);

  return (
    <div className="flex flex-col h-full bg-background">
      <SheetHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fire to-orange-500 flex items-center justify-center shadow-fire">
            <Flame className="h-6 w-6 text-fire-foreground" />
          </div>
          <div>
            <SheetTitle className="font-display text-xl tracking-wider">CFSD</SheetTitle>
            <p className="text-xs text-muted-foreground">Sistema de Formação</p>
          </div>
        </div>
      </SheetHeader>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <RoleIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(role)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filterByRole(allNavItems).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t space-y-1">
        <Link
          to="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </Link>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
