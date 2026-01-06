# 🚀 Guia de Migração: GitHub → Lovable

## ⚠️ IMPORTANTE: Segurança das Chaves

**ATENÇÃO:** O arquivo `.env` foi commitado anteriormente no histórico do Git e contém suas chaves do Supabase!

### 🔐 Ações de Segurança Obrigatórias

1. **Após fazer push para o GitHub, IMEDIATAMENTE:**
   - Acesse o Supabase Dashboard: https://supabase.com/dashboard
   - Vá em Settings → API
   - Clique em "Reset" para regenerar a `anon/public key`
   - Atualize sua chave local no arquivo `.env`

2. **Se o repositório for público:**
   - Considere apagar o repositório e criar um novo
   - OU use `git filter-branch` para remover o `.env` do histórico (avançado)

---

## 📋 Passo a Passo: GitHub

### 1. Criar Repositório no GitHub
```bash
# No GitHub, crie um novo repositório (pode ser privado ou público)
# NÃO inicialize com README, .gitignore ou licença
```

### 2. Fazer Push Inicial
```bash
cd /c/Users/elton/fogo-certo

# Adicionar todas as mudanças
git add .

# Fazer commit
git commit -m "Initial commit: CFSD Fogo Certo app

- Sistema de gerenciamento para Centro de Formação de Soldados
- Controle de turmas, pelotões e alunos
- Sistema de frequência com chamadas
- Sistema de alertas automáticos
- Materiais didáticos e tarefas
- Integração completa com Supabase"

# Adicionar remote (substitua USER e REPO pelos seus)
git remote add origin https://github.com/USER/REPO.git

# Push para GitHub
git push -u origin main
```

### 3. ⚠️ Regenerar Chaves do Supabase
Após o push, IMEDIATAMENTE regenere suas chaves conforme descrito acima.

---

## 🎨 Passo a Passo: Lovable

### 1. Importar do GitHub

1. Acesse https://lovable.dev
2. Clique em "New Project" → "Import from GitHub"
3. Selecione seu repositório `fogo-certo`
4. Aguarde a importação (pode levar alguns minutos)

### 2. Configurar Variáveis de Ambiente

**CRÍTICO:** No Lovable, você precisa configurar as variáveis de ambiente:

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis (com as novas chaves geradas):

```
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_URL=https://seu_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_nova_chave_publica
```

### 3. Aplicar Migrações do Supabase

As migrações estão em `supabase/migrations/`. Você precisa aplicá-las no Supabase:

**Opção A: Via Supabase Dashboard**
1. Acesse o SQL Editor no Supabase
2. Execute cada arquivo de migração na ordem (começando por 20260105...)

**Opção B: Via Supabase CLI**
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Link com seu projeto
supabase link --project-ref seu_project_id

# Aplicar migrações
supabase db push
```

### 4. Testar no Lovable

1. Aguarde o build completar
2. Clique em "Preview" para ver o app rodando
3. Teste o login e funcionalidades principais

---

## 📦 Estrutura do Projeto

```
fogo-certo/
├── src/
│   ├── components/       # Componentes React
│   ├── contexts/         # Context API
│   ├── hooks/           # Custom Hooks
│   ├── integrations/    # Cliente Supabase
│   ├── lib/             # Utilitários
│   ├── pages/           # Páginas do app
│   ├── schemas/         # Validações Zod
│   └── types/           # TypeScript types
├── supabase/
│   └── migrations/      # Migrações SQL
├── public/              # Assets estáticos
└── .env.example         # Template de variáveis

```

---

## ✅ Checklist Final

Antes de considerar a migração completa:

- [ ] .env está no .gitignore
- [ ] Push para GitHub feito
- [ ] Chaves do Supabase regeneradas
- [ ] .env local atualizado com novas chaves
- [ ] Projeto importado no Lovable
- [ ] Variáveis de ambiente configuradas no Lovable
- [ ] Migrações aplicadas no Supabase
- [ ] App testado e funcionando no Lovable

---

## 🆘 Solução de Problemas

### "Failed to connect to Supabase"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que começam com `VITE_`
- Regenere as chaves se necessário

### "Build failed"
- Verifique se todas as dependências foram instaladas
- Rode `npm install` localmente para verificar

### "RLS policies failing"
- Certifique-se de que todas as migrações foram aplicadas
- Verifique as permissões no Supabase Dashboard

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de build no Lovable
2. Consulte a documentação do Supabase
3. Revise as migrações SQL para entender a estrutura do banco

Boa sorte com a migração! 🚀
