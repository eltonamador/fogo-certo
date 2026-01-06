# Integração do Sistema de Alertas/Notificações

## ✅ Componentes Criados

1. **Migração SQL**: `supabase/migrations/20260106000003_create_alertas_system.sql`
2. **Types**: `src/types/alertas.ts`
3. **Página de Alertas**: `src/pages/AlertasPage.tsx`
4. **Widget de Notificações**: `src/components/notifications/NotificationsDropdown.tsx`

## 📋 Passos de Integração

### 1. Aplicar Migração SQL no Supabase

Copie o conteúdo de `supabase/migrations/20260106000003_create_alertas_system.sql` e execute no Supabase Dashboard → SQL Editor.

**O que será criado:**
- Tabelas: `config_frequencia`, `alertas`, `notificacoes`
- Tipos ENUM: `tipo_alerta`, `severidade_alerta`
- Funções: processamento automático de alertas
- Trigger: dispara alertas ao registrar ausência
- RLS Policies: permissões por role

### 2. Adicionar Rota no App.tsx

Adicione o import:
```typescript
import AlertasPage from "./pages/AlertasPage";
```

Adicione a rota dentro de `<Route element={<AppLayout />}>`:
```typescript
<Route path="/alertas" element={<AlertasPage />} />
```

### 3. Adicionar Link no Sidebar

Edite `src/components/layout/Sidebar.tsx`:

**Adicione import:**
```typescript
import { AlertCircle } from 'lucide-react';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
```

**Adicione ao `adminNavItems`:**
```typescript
const adminNavItems: NavItem[] = [
  { title: 'Turmas', href: '/admin/turmas', icon: GraduationCap, roles: ['admin'] },
  { title: 'Pelotões', href: '/admin/pelotoes', icon: Shield, roles: ['admin'] },
  { title: 'Usuários', href: '/admin/usuarios', icon: Users, roles: ['admin'] },
  { title: 'Alertas', href: '/alertas', icon: AlertCircle, roles: ['admin', 'coordenador', 'instrutor'] },
  { title: 'Relatórios Admin', href: '/admin/relatorios', icon: FileText, roles: ['admin'] },
];
```

**Adicione o widget de notificações após User Info (linha 136):**
```typescript
      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <RoleIcon className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {getRoleLabel(role)}
              </p>
            </div>
          </div>
          {/* Widget de Notificações */}
          {(role === 'admin' || role === 'coordenador' || role === 'instrutor') && (
            <NotificationsDropdown />
          )}
        </div>
      </div>
```

### 4. Adicionar Widget no MobileHeader

Edite `src/components/layout/MobileNav.tsx`:

**Adicione import:**
```typescript
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';
```

**Modifique o MobileHeader (linha 68):**
```typescript
export function MobileHeader() {
  const { role } = useAuth();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-primary z-50">
      <div className="flex items-center justify-between h-full px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-fire/20 flex items-center justify-center">
            <span className="text-primary-foreground text-lg">🔥</span>
          </div>
          <h1 className="font-display text-lg text-primary-foreground tracking-wider">CFSD</h1>
        </Link>

        <div className="flex items-center gap-2">
          {/* Widget de Notificações */}
          {(role === 'admin' || role === 'coordenador' || role === 'instrutor') && (
            <NotificationsDropdown />
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

### 5. Adicionar Link no MobileSidebar (Opcional)

Se quiser adicionar "Alertas" no menu mobile também:

Edite `src/components/layout/MobileSidebar.tsx` e adicione aos `allNavItems`:
```typescript
{ title: 'Alertas', href: '/alertas', icon: AlertCircle, roles: ['admin', 'coordenador', 'instrutor'] },
```

### 6. Integrar com Publicação de Chamada

Edite `src/components/frequencia/ChamadaDialog.tsx`:

Na função `publicarMutation.onSuccess` (linha 126), adicione um aviso:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['presencas'] });
  queryClient.invalidateQueries({ queryKey: ['aulas'] });
  queryClient.invalidateQueries({ queryKey: ['alertas'] }); // ← Adicione esta linha
  queryClient.invalidateQueries({ queryKey: ['notificacoes'] }); // ← Adicione esta linha
  toast.success('Chamada publicada! Alertas foram processados automaticamente.');
  onClose();
},
```

### 7. Criar Configurações Padrão (Opcional)

Crie configurações padrão para as turmas existentes executando no SQL Editor:

```sql
-- Criar configuração padrão para cada turma
INSERT INTO public.config_frequencia (turma_id, disciplina_id, limite_alerta, limite_critico)
SELECT id, NULL, 3, 5
FROM public.turmas
ON CONFLICT (turma_id, disciplina_id) DO NOTHING;
```

## 🎯 Funcionalidades Implementadas

### Alertas Automáticos
- ✅ Alerta IMEDIATO ao registrar falta
- ✅ Alerta por LIMIAR (acúmulo de faltas)
- ✅ Severidades: INFO, ALERTA, CRÍTICO
- ✅ Deduplicação automática
- ✅ Trigger executa ao publicar chamada

### Notificações In-App
- ✅ Badge com contador de não lidas
- ✅ Dropdown com últimas 20 notificações
- ✅ Marcar como lida (individual e em lote)
- ✅ Navegação para alerta ao clicar
- ✅ Refetch automático a cada 30s

### Central de Alertas
- ✅ Filtros: Turma, Pelotão, Disciplina, Severidade, Status
- ✅ Cards de resumo (Total, Imediatos, Limiares, etc.)
- ✅ Tabela com badges coloridos
- ✅ Modal de detalhes completo
- ✅ Ação "Marcar como Resolvido"
- ✅ Observações na resolução

### Permissões
- ✅ **Admin**: vê e gerencia todos os alertas
- ✅ **Coordenador**: vê alertas dos pelotões que coordena
- ✅ **Instrutor**: vê alertas que criou (somente leitura)
- ✅ **Aluno**: sem acesso

## 📊 Configurações de Limites

As configurações de limites podem ser gerenciadas via SQL ou criar uma página dedicada (próximo passo).

**Exemplo de configuração:**
```sql
-- Configuração padrão da turma (3 faltas = alerta, 5 = crítico)
INSERT INTO public.config_frequencia (turma_id, limite_alerta, limite_critico)
VALUES ('uuid-turma', 3, 5);

-- Configuração específica por disciplina
INSERT INTO public.config_frequencia (turma_id, disciplina_id, limite_alerta, limite_critico)
VALUES ('uuid-turma', 'uuid-disciplina', 2, 4);
```

## 🧪 Teste do Sistema

1. **Aplicar migração SQL**
2. **Integrar rotas e componentes**
3. **Criar configuração padrão** (SQL acima)
4. **Criar uma aula e marcar aluno como AUSENTE**
5. **Verificar:**
   - Badge de notificação aparece
   - Dropdown mostra notificação
   - Central de Alertas lista o alerta
   - Coordenador pode resolver

## 🚀 Próximos Passos (Opcional)

1. **Página de Configurações de Limites**: Interface para admins configurarem limites por turma/disciplina
2. **Relatórios de Alertas**: Gráficos e estatísticas de alertas
3. **Notificações por Email**: Integrar com serviço de email
4. **Notificações Push**: Integrar com Firebase Cloud Messaging
5. **Dashboard de Alertas**: Widget no DashboardPage mostrando resumo
