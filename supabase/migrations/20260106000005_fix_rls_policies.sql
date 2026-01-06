-- ============================================================================
-- CORRIGIR POLÍTICAS RLS PARA AVISOS, DISCIPLINAS, MATERIAIS, AVALIAÇÕES E TAREFAS
-- ============================================================================

-- ============================================================================
-- AVISOS
-- ============================================================================
DROP POLICY IF EXISTS "Admins e instrutores gerenciam avisos" ON public.avisos;
DROP POLICY IF EXISTS "Todos podem ver avisos" ON public.avisos;

-- Política para leitura (todos autenticados)
CREATE POLICY "Todos veem avisos"
  ON public.avisos FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (admin e instrutor)
CREATE POLICY "Admins e instrutores criam avisos"
  ON public.avisos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para atualização (admin e instrutor, apenas seus próprios avisos ou admin vê tudo)
CREATE POLICY "Admins e instrutores editam avisos"
  ON public.avisos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'instrutor' AND public.avisos.autor_id = auth.uid())
      )
    )
  );

-- Política para exclusão (admin e instrutor, apenas seus próprios avisos ou admin vê tudo)
CREATE POLICY "Admins e instrutores excluem avisos"
  ON public.avisos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'instrutor' AND public.avisos.autor_id = auth.uid())
      )
    )
  );

-- ============================================================================
-- DISCIPLINAS
-- ============================================================================
DROP POLICY IF EXISTS "Admins gerenciam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Todos podem ver disciplinas" ON public.disciplinas;

-- Política para leitura (todos autenticados)
CREATE POLICY "Todos veem disciplinas"
  ON public.disciplinas FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (apenas admin)
CREATE POLICY "Admins criam disciplinas"
  ON public.disciplinas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para atualização (apenas admin)
CREATE POLICY "Admins editam disciplinas"
  ON public.disciplinas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para exclusão (apenas admin)
CREATE POLICY "Admins excluem disciplinas"
  ON public.disciplinas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- MATERIAIS
-- ============================================================================
DROP POLICY IF EXISTS "Admins e instrutores gerenciam materiais" ON public.materiais;
DROP POLICY IF EXISTS "Todos podem ver materiais" ON public.materiais;

-- Política para leitura (todos autenticados)
CREATE POLICY "Todos veem materiais"
  ON public.materiais FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (admin e instrutor)
CREATE POLICY "Admins e instrutores criam materiais"
  ON public.materiais FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para atualização (admin e instrutor)
CREATE POLICY "Admins e instrutores editam materiais"
  ON public.materiais FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para exclusão (admin e instrutor)
CREATE POLICY "Admins e instrutores excluem materiais"
  ON public.materiais FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- AVALIAÇÕES
-- ============================================================================
DROP POLICY IF EXISTS "Admins e instrutores gerenciam avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Todos podem ver avaliacoes" ON public.avaliacoes;

-- Política para leitura (todos autenticados)
CREATE POLICY "Todos veem avaliacoes"
  ON public.avaliacoes FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (admin e instrutor)
CREATE POLICY "Admins e instrutores criam avaliacoes"
  ON public.avaliacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para atualização (admin e instrutor)
CREATE POLICY "Admins e instrutores editam avaliacoes"
  ON public.avaliacoes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para exclusão (admin e instrutor)
CREATE POLICY "Admins e instrutores excluem avaliacoes"
  ON public.avaliacoes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- TAREFAS
-- ============================================================================
DROP POLICY IF EXISTS "Admins e instrutores gerenciam tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Todos podem ver tarefas" ON public.tarefas;

-- Política para leitura (todos autenticados)
CREATE POLICY "Todos veem tarefas"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (admin e instrutor)
CREATE POLICY "Admins e instrutores criam tarefas"
  ON public.tarefas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para atualização (admin e instrutor)
CREATE POLICY "Admins e instrutores editam tarefas"
  ON public.tarefas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- Política para exclusão (admin e instrutor)
CREATE POLICY "Admins e instrutores excluem tarefas"
  ON public.tarefas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'instrutor')
    )
  );

-- ============================================================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================================================
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON POLICY "Todos veem avisos" ON public.avisos IS 'Todos usuários autenticados podem ver avisos';
COMMENT ON POLICY "Admins e instrutores criam avisos" ON public.avisos IS 'Apenas admin e instrutor podem criar avisos';
COMMENT ON POLICY "Todos veem disciplinas" ON public.disciplinas IS 'Todos usuários autenticados podem ver disciplinas';
COMMENT ON POLICY "Admins criam disciplinas" ON public.disciplinas IS 'Apenas admin pode criar disciplinas';
COMMENT ON POLICY "Todos veem materiais" ON public.materiais IS 'Todos usuários autenticados podem ver materiais';
COMMENT ON POLICY "Admins e instrutores criam materiais" ON public.materiais IS 'Apenas admin e instrutor podem criar materiais';
