-- ============================================================================
-- SISTEMA DE ALERTAS/NOTIFICAÇÕES - VERSÃO SIMPLIFICADA
-- ============================================================================

-- Limpar objetos existentes
DROP TRIGGER IF EXISTS trigger_alertas_presenca ON public.presencas;
DROP FUNCTION IF EXISTS public.trigger_processar_alertas() CASCADE;
DROP FUNCTION IF EXISTS public.processar_alertas_ausencia(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.criar_notificacoes_alerta(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.contar_faltas_aluno(UUID, UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.obter_config_limites(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.resolver_alerta(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.marcar_notificacao_lida(UUID) CASCADE;

DROP TABLE IF EXISTS public.notificacoes CASCADE;
DROP TABLE IF EXISTS public.alertas CASCADE;
DROP TABLE IF EXISTS public.config_frequencia CASCADE;

DROP TYPE IF EXISTS tipo_alerta CASCADE;
DROP TYPE IF EXISTS severidade_alerta CASCADE;

-- ============================================================================
-- TIPOS ENUM
-- ============================================================================
CREATE TYPE tipo_alerta AS ENUM ('IMEDIATO', 'LIMIAR');
CREATE TYPE severidade_alerta AS ENUM ('INFO', 'ALERTA', 'CRITICO');

-- ============================================================================
-- TABELA: config_frequencia
-- ============================================================================
CREATE TABLE public.config_frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  limite_alerta INTEGER NOT NULL DEFAULT 3,
  limite_critico INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT config_unica UNIQUE (turma_id, disciplina_id)
);

CREATE INDEX idx_config_frequencia_turma ON public.config_frequencia(turma_id);
CREATE INDEX idx_config_frequencia_disciplina ON public.config_frequencia(disciplina_id);

-- ============================================================================
-- TABELA: alertas
-- ============================================================================
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pelotao_id UUID REFERENCES public.pelotoes(id) ON DELETE SET NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
  tipo tipo_alerta NOT NULL,
  severidade severidade_alerta NOT NULL DEFAULT 'INFO',
  motivo TEXT NOT NULL,
  contagem_faltas INTEGER,
  instrutor_id UUID REFERENCES public.profiles(id),
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido_por UUID REFERENCES public.profiles(id),
  resolvido_em TIMESTAMPTZ,
  observacao_resolucao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Índices
CREATE INDEX idx_alertas_aluno ON public.alertas(aluno_id);
CREATE INDEX idx_alertas_pelotao ON public.alertas(pelotao_id);
CREATE INDEX idx_alertas_turma ON public.alertas(turma_id);
CREATE INDEX idx_alertas_disciplina ON public.alertas(disciplina_id);
CREATE INDEX idx_alertas_resolvido ON public.alertas(resolvido) WHERE resolvido = FALSE;
CREATE INDEX idx_alertas_created ON public.alertas(created_at DESC);

-- Índices únicos para deduplicação
CREATE UNIQUE INDEX idx_alerta_imediato_unico
  ON public.alertas(aula_id, aluno_id, tipo)
  WHERE tipo = 'IMEDIATO' AND resolvido = FALSE;

CREATE UNIQUE INDEX idx_alerta_limiar_unico
  ON public.alertas(aluno_id, disciplina_id, tipo, severidade)
  WHERE tipo = 'LIMIAR' AND resolvido = FALSE;

-- ============================================================================
-- TABELA: notificacoes
-- ============================================================================
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alerta_id UUID REFERENCES public.alertas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT,
  url TEXT,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_user ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida) WHERE lida = FALSE;
CREATE INDEX idx_notificacoes_created ON public.notificacoes(created_at DESC);

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Obter limites de frequência
CREATE OR REPLACE FUNCTION public.obter_config_limites(
  p_turma_id UUID,
  p_disciplina_id UUID DEFAULT NULL
)
RETURNS TABLE (limite_alerta INTEGER, limite_critico INTEGER) AS $$
BEGIN
  -- Tentar config específica da disciplina
  IF p_disciplina_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.limite_alerta, c.limite_critico
    FROM public.config_frequencia c
    WHERE c.turma_id = p_turma_id AND c.disciplina_id = p_disciplina_id
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- Config padrão da turma
  RETURN QUERY
  SELECT c.limite_alerta, c.limite_critico
  FROM public.config_frequencia c
  WHERE c.turma_id = p_turma_id AND c.disciplina_id IS NULL
  LIMIT 1;

  -- Padrões fixos se não houver config
  IF NOT FOUND THEN
    RETURN QUERY SELECT 3, 5;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Contar faltas
CREATE OR REPLACE FUNCTION public.contar_faltas_aluno(
  p_aluno_id UUID,
  p_disciplina_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.presencas pr
  INNER JOIN public.aulas a ON a.id = pr.aula_id
  WHERE pr.aluno_id = p_aluno_id
    AND pr.status = 'AUSENTE'
    AND a.status = 'PUBLICADA'
    AND (p_disciplina_id IS NULL OR a.disciplina_id = p_disciplina_id);

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Criar notificações (admins e instrutores)
CREATE OR REPLACE FUNCTION public.criar_notificacoes_alerta(
  p_alerta_id UUID,
  p_titulo TEXT,
  p_corpo TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Notificar admins e instrutores
  INSERT INTO public.notificacoes (user_id, alerta_id, titulo, corpo, url)
  SELECT
    ur.user_id,
    p_alerta_id,
    p_titulo,
    p_corpo,
    '/alertas'
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'instrutor');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO PRINCIPAL: Processar alertas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.processar_alertas_ausencia(
  p_presenca_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_presenca RECORD;
  v_aluno RECORD;
  v_config RECORD;
  v_faltas INTEGER;
  v_alerta_id UUID;
  v_titulo TEXT;
  v_corpo TEXT;
  v_motivo TEXT;
BEGIN
  -- Buscar presença
  SELECT
    pr.id,
    pr.aluno_id,
    pr.status,
    a.id as aula_id,
    a.titulo as aula_titulo,
    a.data_aula,
    a.disciplina_id,
    a.instrutor_id,
    a.status as aula_status
  INTO v_presenca
  FROM public.presencas pr
  INNER JOIN public.aulas a ON a.id = pr.aula_id
  WHERE pr.id = p_presenca_id
    AND pr.status = 'AUSENTE'
    AND a.status = 'PUBLICADA';

  IF NOT FOUND THEN RETURN; END IF;

  -- Buscar aluno
  SELECT p.id, p.nome, p.pelotao_id, pel.turma_id
  INTO v_aluno
  FROM public.profiles p
  LEFT JOIN public.pelotoes pel ON pel.id = p.pelotao_id
  WHERE p.id = v_presenca.aluno_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- ========================================
  -- ALERTA IMEDIATO
  -- ========================================
  v_motivo := format('Aluno %s faltou na aula "%s" em %s',
    v_aluno.nome,
    v_presenca.aula_titulo,
    TO_CHAR(v_presenca.data_aula, 'DD/MM/YYYY')
  );

  INSERT INTO public.alertas (
    aluno_id, pelotao_id, turma_id, disciplina_id, aula_id,
    tipo, severidade, motivo, instrutor_id, created_by
  )
  VALUES (
    v_aluno.id, v_aluno.pelotao_id, v_aluno.turma_id,
    v_presenca.disciplina_id, v_presenca.aula_id,
    'IMEDIATO', 'INFO', v_motivo,
    v_presenca.instrutor_id, auth.uid()
  )
  ON CONFLICT (aula_id, aluno_id, tipo)
    WHERE (tipo = 'IMEDIATO' AND resolvido = FALSE)
    DO NOTHING
  RETURNING id INTO v_alerta_id;

  IF v_alerta_id IS NOT NULL THEN
    PERFORM public.criar_notificacoes_alerta(
      v_alerta_id,
      '📋 Falta Registrada',
      v_motivo
    );
  END IF;

  -- ========================================
  -- ALERTAS POR LIMIAR
  -- ========================================
  IF v_aluno.turma_id IS NULL THEN RETURN; END IF;

  v_faltas := public.contar_faltas_aluno(v_aluno.id, v_presenca.disciplina_id);

  SELECT * INTO v_config
  FROM public.obter_config_limites(v_aluno.turma_id, v_presenca.disciplina_id);

  -- CRÍTICO
  IF v_faltas >= v_config.limite_critico THEN
    v_motivo := format('Aluno %s atingiu %s faltas (CRÍTICO)', v_aluno.nome, v_faltas);

    INSERT INTO public.alertas (
      aluno_id, pelotao_id, turma_id, disciplina_id,
      tipo, severidade, motivo, contagem_faltas, instrutor_id, created_by
    )
    VALUES (
      v_aluno.id, v_aluno.pelotao_id, v_aluno.turma_id, v_presenca.disciplina_id,
      'LIMIAR', 'CRITICO', v_motivo, v_faltas,
      v_presenca.instrutor_id, auth.uid()
    )
    ON CONFLICT (aluno_id, disciplina_id, tipo, severidade)
      WHERE (tipo = 'LIMIAR' AND resolvido = FALSE)
      DO UPDATE SET contagem_faltas = v_faltas, motivo = v_motivo
    RETURNING id INTO v_alerta_id;

    IF v_alerta_id IS NOT NULL THEN
      PERFORM public.criar_notificacoes_alerta(v_alerta_id, '🚨 Alerta CRÍTICO', v_motivo);
    END IF;

  -- ALERTA
  ELSIF v_faltas >= v_config.limite_alerta THEN
    v_motivo := format('Aluno %s atingiu %s faltas (ALERTA)', v_aluno.nome, v_faltas);

    INSERT INTO public.alertas (
      aluno_id, pelotao_id, turma_id, disciplina_id,
      tipo, severidade, motivo, contagem_faltas, instrutor_id, created_by
    )
    VALUES (
      v_aluno.id, v_aluno.pelotao_id, v_aluno.turma_id, v_presenca.disciplina_id,
      'LIMIAR', 'ALERTA', v_motivo, v_faltas,
      v_presenca.instrutor_id, auth.uid()
    )
    ON CONFLICT (aluno_id, disciplina_id, tipo, severidade)
      WHERE (tipo = 'LIMIAR' AND resolvido = FALSE)
      DO UPDATE SET contagem_faltas = v_faltas, motivo = v_motivo
    RETURNING id INTO v_alerta_id;

    IF v_alerta_id IS NOT NULL THEN
      PERFORM public.criar_notificacoes_alerta(v_alerta_id, '⚠️ Alerta de Frequência', v_motivo);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_processar_alertas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'AUSENTE' THEN
    PERFORM public.processar_alertas_ausencia(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alertas_presenca
AFTER INSERT OR UPDATE OF status ON public.presencas
FOR EACH ROW
WHEN (NEW.status = 'AUSENTE')
EXECUTE FUNCTION public.trigger_processar_alertas();

-- ============================================================================
-- FUNÇÕES DE GERENCIAMENTO
-- ============================================================================

-- Resolver alerta
CREATE OR REPLACE FUNCTION public.resolver_alerta(
  p_alerta_id UUID,
  p_observacao TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.alertas
  SET
    resolvido = TRUE,
    resolvido_por = auth.uid(),
    resolvido_em = NOW(),
    observacao_resolucao = p_observacao
  WHERE id = p_alerta_id AND resolvido = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar notificação lida
CREATE OR REPLACE FUNCTION public.marcar_notificacao_lida(
  p_notificacao_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notificacoes
  SET lida = TRUE, lida_em = NOW()
  WHERE id = p_notificacao_id AND user_id = auth.uid() AND lida = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.config_frequencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- CONFIG: Apenas admins
CREATE POLICY "Admins gerenciam config"
  ON public.config_frequencia FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ALERTAS: Admin vê tudo, instrutor vê relacionados
CREATE POLICY "Admins veem todos alertas"
  ON public.alertas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Instrutores veem alertas relacionados"
  ON public.alertas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'instrutor'
    )
  );

CREATE POLICY "Instrutores podem resolver"
  ON public.alertas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('instrutor', 'admin')
    )
  );

-- NOTIFICACOES: Cada um vê as suas
CREATE POLICY "Usuarios veem suas notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios atualizam suas notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- CONFIGURAÇÕES PADRÃO (Criar para turmas existentes)
-- ============================================================================
INSERT INTO public.config_frequencia (turma_id, disciplina_id, limite_alerta, limite_critico)
SELECT id, NULL, 3, 5
FROM public.turmas
ON CONFLICT (turma_id, disciplina_id) DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.config_frequencia IS 'Configurações de limites por turma/disciplina';
COMMENT ON TABLE public.alertas IS 'Alertas de frequência gerados automaticamente';
COMMENT ON TABLE public.notificacoes IS 'Notificações in-app';
COMMENT ON FUNCTION public.processar_alertas_ausencia IS 'Processa alertas ao registrar ausência';
