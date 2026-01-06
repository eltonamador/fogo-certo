-- ============================================================================
-- CORRIGIR TODAS AS POLÍTICAS RLS - VERSÃO SEGURA
-- ============================================================================
-- Esta migração remove e recria todas as políticas RLS para garantir
-- que as permissões estejam corretas em todas as tabelas

-- ============================================================================
-- AVISOS
-- ============================================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  fixado BOOLEAN NOT NULL DEFAULT false,
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pelotao_id UUID REFERENCES public.pelotoes(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Todos veem avisos" ON public.avisos;
DROP POLICY IF EXISTS "Admins e instrutores criam avisos" ON public.avisos;
DROP POLICY IF EXISTS "Admins e instrutores editam avisos" ON public.avisos;
DROP POLICY IF EXISTS "Admins e instrutores excluem avisos" ON public.avisos;

-- Criar políticas
CREATE POLICY "Todos veem avisos"
  ON public.avisos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins e instrutores criam avisos"
  ON public.avisos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores editam avisos"
  ON public.avisos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR (role = 'instrutor' AND public.avisos.autor_id = auth.uid()))
    )
  );

CREATE POLICY "Admins e instrutores excluem avisos"
  ON public.avisos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR (role = 'instrutor' AND public.avisos.autor_id = auth.uid()))
    )
  );

-- ============================================================================
-- DISCIPLINAS
-- ============================================================================

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos veem disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins criam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins editam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins excluem disciplinas" ON public.disciplinas;

CREATE POLICY "Todos veem disciplinas"
  ON public.disciplinas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins criam disciplinas"
  ON public.disciplinas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins editam disciplinas"
  ON public.disciplinas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins excluem disciplinas"
  ON public.disciplinas FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- MATERIAIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'video', 'link', 'documento')),
  url TEXT NOT NULL,
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos veem materiais" ON public.materiais;
DROP POLICY IF EXISTS "Admins e instrutores criam materiais" ON public.materiais;
DROP POLICY IF EXISTS "Admins e instrutores editam materiais" ON public.materiais;
DROP POLICY IF EXISTS "Admins e instrutores excluem materiais" ON public.materiais;

CREATE POLICY "Todos veem materiais"
  ON public.materiais FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins e instrutores criam materiais"
  ON public.materiais FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores editam materiais"
  ON public.materiais FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores excluem materiais"
  ON public.materiais FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- AVALIAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  nota_maxima NUMERIC(5,2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos veem avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Admins e instrutores criam avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Admins e instrutores editam avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Admins e instrutores excluem avaliacoes" ON public.avaliacoes;

CREATE POLICY "Todos veem avaliacoes"
  ON public.avaliacoes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins e instrutores criam avaliacoes"
  ON public.avaliacoes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores editam avaliacoes"
  ON public.avaliacoes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores excluem avaliacoes"
  ON public.avaliacoes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- TAREFAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  prazo TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos veem tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Admins e instrutores criam tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Admins e instrutores editam tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Admins e instrutores excluem tarefas" ON public.tarefas;

CREATE POLICY "Todos veem tarefas"
  ON public.tarefas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins e instrutores criam tarefas"
  ON public.tarefas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores editam tarefas"
  ON public.tarefas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Admins e instrutores excluem tarefas"
  ON public.tarefas FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- RESPOSTAS (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nota NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(avaliacao_id, aluno_id)
);

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos veem suas respostas" ON public.respostas;
DROP POLICY IF EXISTS "Admins e instrutores veem todas respostas" ON public.respostas;
DROP POLICY IF EXISTS "Alunos criam suas respostas" ON public.respostas;
DROP POLICY IF EXISTS "Admins e instrutores editam respostas" ON public.respostas;

CREATE POLICY "Alunos veem suas respostas"
  ON public.respostas FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());

CREATE POLICY "Admins e instrutores veem todas respostas"
  ON public.respostas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Alunos criam suas respostas"
  ON public.respostas FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Admins e instrutores editam respostas"
  ON public.respostas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- ENTREGAS (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'avaliado', 'atrasado')),
  nota NUMERIC(5,2),
  arquivo_url TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(tarefa_id, aluno_id)
);

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos veem suas entregas" ON public.entregas;
DROP POLICY IF EXISTS "Admins e instrutores veem todas entregas" ON public.entregas;
DROP POLICY IF EXISTS "Alunos criam suas entregas" ON public.entregas;
DROP POLICY IF EXISTS "Alunos editam suas entregas" ON public.entregas;
DROP POLICY IF EXISTS "Admins e instrutores editam entregas" ON public.entregas;

CREATE POLICY "Alunos veem suas entregas"
  ON public.entregas FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());

CREATE POLICY "Admins e instrutores veem todas entregas"
  ON public.entregas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );

CREATE POLICY "Alunos criam suas entregas"
  ON public.entregas FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos editam suas entregas"
  ON public.entregas FOR UPDATE TO authenticated
  USING (aluno_id = auth.uid());

CREATE POLICY "Admins e instrutores editam entregas"
  ON public.entregas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'instrutor')
    )
  );
