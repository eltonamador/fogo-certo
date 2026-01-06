-- ============================================================================
-- CORRIGIR POLÍTICAS RLS PARA DISCIPLINAS
-- ============================================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admins gerenciam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Todos podem ver disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Todos veem disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins criam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins editam disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Admins excluem disciplinas" ON public.disciplinas;

-- Habilitar RLS (se ainda não estiver)
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

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

-- Comentários
COMMENT ON POLICY "Todos veem disciplinas" ON public.disciplinas IS 'Todos usuários autenticados podem ver disciplinas';
COMMENT ON POLICY "Admins criam disciplinas" ON public.disciplinas IS 'Apenas admin pode criar disciplinas';
COMMENT ON POLICY "Admins editam disciplinas" ON public.disciplinas IS 'Apenas admin pode editar disciplinas';
COMMENT ON POLICY "Admins excluem disciplinas" ON public.disciplinas IS 'Apenas admin pode excluir disciplinas';
