# Funcionalidade: Alternar entre Instrutor e Admin

## Resumo
Esta funcionalidade permite que o usuário autorizado (elton.amador@gmail.com) alterne entre os papéis de **Instrutor** e **Admin** através de um botão na página de Configurações/Perfil.

## O que foi implementado

### 1. Backend (Supabase)
- **Nova migration SQL**: `supabase/migrations/20260105134000_add_toggle_admin_role.sql`
  - Função `toggle_admin_role()`: Alterna entre instrutor ↔ admin
  - Função `can_toggle_admin()`: Verifica se o usuário pode alternar
  - Validação: Apenas o email bootstrap `elton.amador@gmail.com` pode usar
  - Segurança: SECURITY DEFINER com validações no backend

### 2. Frontend
- **Hook customizado**: `src/hooks/useAdminToggle.ts`
  - `toggleAdminRole()`: Executa a alternância
  - `checkCanToggle()`: Verifica permissão
  - `canToggle`: Estado booleano
  - `isToggling`: Estado de loading

- **UI atualizada**: `src/pages/ConfiguracoesPage.tsx`
  - Botão "Alternar para Admin" / "Voltar para Instrutor"
  - Aparece apenas para usuário autorizado
  - Feedback visual com loading e toast

- **Tipos atualizados**: `src/integrations/supabase/types.ts`
  - Adicionadas as funções RPC ao tipo Database

## Como aplicar a migration

### Opção 1: Usando Supabase CLI (Recomendado)

1. Instale o Supabase CLI se ainda não tiver:
```bash
npm install -g supabase
```

2. Faça login no Supabase:
```bash
cd fogo-certo
supabase login
```

3. Link ao projeto:
```bash
supabase link --project-ref gwkvevikooquxakvyclz
```

4. Aplique as migrations:
```bash
supabase db push
```

### Opção 2: Manualmente via Dashboard

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard/project/gwkvevikooquxakvyclz
2. Vá em **SQL Editor**
3. Copie todo o conteúdo do arquivo `supabase/migrations/20260105134000_add_toggle_admin_role.sql`
4. Cole no editor e execute (RUN)

## Como testar

### Pré-requisitos
1. O banco de dados deve ter a migration aplicada
2. Você deve estar logado com o email `elton.amador@gmail.com`
3. Seu papel atual deve ser `instrutor` ou `admin`

### Passos para teste

1. **Inicie o projeto**:
```bash
cd fogo-certo
npm install
npm run dev
```

2. **Faça login** com `elton.amador@gmail.com`

3. **Navegue para Configurações**:
   - Clique no menu lateral em "Configurações"
   - Ou acesse diretamente: http://localhost:5173/configuracoes

4. **Verifique o card "Conta"**:
   - Se você for o usuário autorizado, verá o botão de alternância
   - O texto do botão muda conforme seu papel atual:
     - **Instrutor**: "Alternar para Admin"
     - **Admin**: "Voltar para Instrutor"

5. **Teste a alternância**:
   - Clique no botão
   - Aguarde o loading (spinner)
   - Uma notificação toast aparecerá com sucesso
   - O papel exibido no card deve mudar
   - O menu lateral deve atualizar (mostrando/escondendo opções admin)

6. **Verifique as permissões**:
   - Como **Admin**: Acesse `/admin/usuarios`, `/admin/pelotoes`, `/admin/turmas`
   - Como **Instrutor**: Essas rotas não devem estar visíveis/acessíveis

### Cenários de teste

#### ✅ Sucesso: Instrutor → Admin
1. Login como instrutor (elton.amador@gmail.com)
2. Clique em "Alternar para Admin"
3. Papel muda para Admin
4. Menu mostra opções administrativas

#### ✅ Sucesso: Admin → Instrutor
1. Estando como admin
2. Clique em "Voltar para Instrutor"
3. Papel volta para Instrutor
4. Menu esconde opções administrativas

#### ❌ Erro esperado: Outro usuário tenta alternar
1. Login com outro email
2. Botão NÃO aparece
3. Mesmo tentando via console, backend rejeita

#### ❌ Erro esperado: Aluno tenta alternar
1. Login como aluno (elton.amador@gmail.com como aluno)
2. Backend rejeita (apenas instrutor/admin pode)

## Segurança

✅ **Validações implementadas**:
- Email bootstrap hardcoded no SQL
- Verificação de email no backend (SECURITY DEFINER)
- Apenas roles `instrutor` e `admin` podem alternar
- Botão só aparece para usuário autorizado
- Todas as validações acontecem no backend

✅ **Impossível burlar**:
- Mesmo tentando chamar a função via console/API
- Backend sempre valida o email do usuário autenticado
- Row Level Security (RLS) protege os dados

## Manutenção

### Alterar o email bootstrap
Edite o arquivo de migration:
```sql
_bootstrap_email text := 'novo.email@example.com';
```

E aplique novamente a migration (ou rode um UPDATE):
```sql
-- No SQL Editor do Supabase
DROP FUNCTION IF EXISTS toggle_admin_role CASCADE;
DROP FUNCTION IF EXISTS can_toggle_admin CASCADE;
-- Depois cole o novo código da migration
```

### Adicionar mais usuários autorizados
Modifique a função para aceitar uma lista:
```sql
_bootstrap_emails text[] := ARRAY['elton.amador@gmail.com', 'outro@example.com'];
IF _user_email = ANY(_bootstrap_emails) THEN
```

## Troubleshooting

### Botão não aparece
- Verifique se está logado com o email correto
- Confirme que a migration foi aplicada
- Abra o console do navegador e veja se há erros

### Erro ao alternar
- Verifique o console do navegador
- Veja os logs no Supabase Dashboard (Logs > API)
- Confirme que seu papel atual é `instrutor` ou `admin`

### Migration falhou
- Verifique se há migrations anteriores pendentes
- Tente aplicar manualmente via SQL Editor
- Veja os detalhes do erro no output do CLI

## Arquivos modificados/criados

### Criados
- `supabase/migrations/20260105134000_add_toggle_admin_role.sql`
- `src/hooks/useAdminToggle.ts`
- `ADMIN_TOGGLE_SETUP.md` (este arquivo)

### Modificados
- `src/pages/ConfiguracoesPage.tsx`
- `src/integrations/supabase/types.ts`

## Próximos passos (opcional)

- [ ] Adicionar logs de auditoria quando houver alternância
- [ ] Criar teste automatizado E2E
- [ ] Adicionar confirmação antes de alternar
- [ ] Criar dashboard de atividades do admin
- [ ] Implementar limite de tempo no modo admin (auto-revert)
