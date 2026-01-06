-- ============================================================================
-- SISTEMA DE ALERTAS/NOTIFICAÇÕES DE FREQUÊNCIA
-- ============================================================================

-- ============================================================================
-- TIPOS ENUM
-- ============================================================================
CREATE TYPE tipo_alerta AS ENUM ('IMEDIATO', 'LIMIAR');
CREATE TYPE severidade_alerta AS ENUM ('INFO', 'ALERTA', 'CRITICO');

-- ============================================================================
-- TABELA: config_frequencia
-- Configurações de limites por turma/disciplina
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.config_frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,

  -- Limites
  limite_alerta INTEGER NOT NULL DEFAULT 3,
  limite_critico INTEGER NOT NULL DEFAULT 5,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id),

  -- Constraint: disciplina_id null = padrão da turma
  CONSTRAINT config_unica UNIQUE (turma_id, disciplina_id)
);

CREATE INDEX idx_config_frequencia_turma ON public.config_frequencia(turma_id);
CREATE INDEX idx_config_frequencia_disciplina ON public.config_frequencia(disciplina_id);

-- ============================================================================
-- TABELA: alertas
-- Registros de alertas gerados
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contexto do alerta
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pelotao_id UUID REFERENCES public.pelotoes(id) ON DELETE SET NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,

  -- Tipo e severidade
  tipo tipo_alerta NOT NULL,
  severidade severidade_alerta NOT NULL DEFAULT 'INFO',

  -- Detalhes
  motivo TEXT NOT NULL,
  contagem_faltas INTEGER,
  instrutor_id UUID REFERENCES public.profiles(id),

  -- Resolução
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido_por UUID REFERENCES public.profiles(id),
  resolvido_em TIMESTAMPTZ,
  observacao_resolucao TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Índices
CREATE INDEX idx_alertas_aluno ON public.alertas(aluno_id);
CREATE INDEX idx_alertas_pelotao ON public.alertas(pelotao_id);
CREATE INDEX idx_alertas_turma ON public.alertas(turma_id);
CREATE INDEX idx_alertas_disciplina ON public.alertas(disciplina_id);
CREATE INDEX idx_alertas_aula ON public.alertas(aula_id);
CREATE INDEX idx_alertas_tipo ON public.alertas(tipo);
CREATE INDEX idx_alertas_severidade ON public.alertas(severidade);
CREATE INDEX idx_alertas_resolvido ON public.alertas(resolvido) WHERE resolvido = FALSE;
CREATE INDEX idx_alertas_created ON public.alertas(created_at DESC);

-- Índices únicos parciais para deduplicação
CREATE UNIQUE INDEX idx_alerta_imediato_unico
  ON public.alertas(aula_id, aluno_id, tipo)
  WHERE tipo = 'IMEDIATO' AND resolvido = FALSE;

CREATE UNIQUE INDEX idx_alerta_limiar_unico
  ON public.alertas(aluno_id, disciplina_id, tipo, severidade)
  WHERE tipo = 'LIMIAR' AND resolvido = FALSE;

-- ============================================================================
-- TABELA: notificacoes
-- Notificações in-app para usuários
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinatário
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Referência
  alerta_id UUID REFERENCES public.alertas(id) ON DELETE CASCADE,

  -- Conteúdo
  titulo TEXT NOT NULL,
  corpo TEXT,
  url TEXT, -- Link para navegar ao clicar

  -- Status
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notificacoes_user ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_alerta ON public.notificacoes(alerta_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida) WHERE lida = FALSE;
CREATE INDEX idx_notificacoes_created ON public.notificacoes(created_at DESC);

-- ============================================================================
-- FUNÇÃO: Obter configuração de limites
-- ============================================================================
CREATE OR REPLACE FUNCTION public.obter_config_limites(
  p_turma_id UUID,
  p_disciplina_id UUID DEFAULT NULL
)
RETURNS TABLE (
  limite_alerta INTEGER,
  limite_critico INTEGER
) AS $$
BEGIN
  -- Tentar buscar configuração específica da disciplina
  IF p_disciplina_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.limite_alerta, c.limite_critico
    FROM public.config_frequencia c
    WHERE c.turma_id = p_turma_id
      AND c.disciplina_id = p_disciplina_id
    LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Caso contrário, buscar configuração padrão da turma
  RETURN QUERY
  SELECT c.limite_alerta, c.limite_critico
  FROM public.config_frequencia c
  WHERE c.turma_id = p_turma_id
    AND c.disciplina_id IS NULL
  LIMIT 1;

  -- Se não houver configuração, retornar padrões
  IF NOT FOUND THEN
    RETURN QUERY SELECT 3, 5;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: Contar faltas do aluno
-- ============================================================================
CREATE OR REPLACE FUNCTION public.contar_faltas_aluno(
  p_aluno_id UUID,
  p_disciplina_id UUID DEFAULT NULL,
  p_data_inicio DATE DEFAULT NULL
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
    AND (p_disciplina_id IS NULL OR a.disciplina_id = p_disciplina_id)
    AND (p_data_inicio IS NULL OR a.data_aula >= p_data_inicio);

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: Criar notificação para coordenadores
-- ============================================================================
CREATE OR REPLACE FUNCTION public.criar_notificacoes_alerta(
  p_alerta_id UUID,
  p_pelotao_id UUID,
  p_titulo TEXT,
  p_corpo TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_temp INTEGER;
BEGIN
  -- Notificar coordenador do pelotão
  INSERT INTO public.notificacoes (user_id, alerta_id, titulo, corpo, url)
  SELECT
    pel.coordenador_id,
    p_alerta_id,
    p_titulo,
    p_corpo,
    '/alertas/' || p_alerta_id
  FROM public.pelotoes pel
  WHERE pel.id = p_pelotao_id
    AND pel.coordenador_id IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Notificar todos os admins
  INSERT INTO public.notificacoes (user_id, alerta_id, titulo, corpo, url)
  SELECT
    ur.user_id,
    p_alerta_id,
    p_titulo,
    p_corpo,
    '/alertas/' || p_alerta_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  GET DIAGNOSTICS v_temp = ROW_COUNT;
  v_count := v_count + v_temp;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO: Processar alertas ao registrar ausência
-- ============================================================================
CREATE OR REPLACE FUNCTION public.processar_alertas_ausencia(
  p_presenca_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_presenca RECORD;
  v_aula RECORD;
  v_aluno RECORD;
  v_config RECORD;
  v_faltas INTEGER;
  v_alerta_id UUID;
  v_titulo TEXT;
  v_corpo TEXT;
  v_motivo TEXT;
BEGIN
  -- Buscar dados da presença
  SELECT pr.*, a.*
  INTO v_presenca
  FROM public.presencas pr
  INNER JOIN public.aulas a ON a.id = pr.aula_id
  WHERE pr.id = p_presenca_id
    AND pr.status = 'AUSENTE';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Buscar dados do aluno
  SELECT p.*, pel.turma_id
  INTO v_aluno
  FROM public.profiles p
  LEFT JOIN public.pelotoes pel ON pel.id = p.pelotao_id
  WHERE p.id = v_presenca.aluno_id;

  -- ========================================
  -- 1) ALERTA IMEDIATO
  -- ========================================
  v_motivo := format(
    'Aluno %s faltou na aula "%s" em %s',
    v_aluno.nome,
    v_presenca.titulo,
    TO_CHAR(v_presenca.data_aula, 'DD/MM/YYYY')
  );

  -- Inserir alerta imediato (deduplicação via constraint)
  INSERT INTO public.alertas (
    aluno_id,
    pelotao_id,
    turma_id,
    disciplina_id,
    aula_id,
    tipo,
    severidade,
    motivo,
    instrutor_id,
    created_by
  )
  VALUES (
    v_presenca.aluno_id,
    v_aluno.pelotao_id,
    v_aluno.turma_id,
    v_presenca.disciplina_id,
    v_presenca.aula_id,
    'IMEDIATO',
    'INFO',
    v_motivo,
    v_presenca.instrutor_id,
    auth.uid()
  )
  ON CONFLICT (aula_id, aluno_id, tipo) WHERE (tipo = 'IMEDIATO' AND resolvido = FALSE) DO NOTHING
  RETURNING id INTO v_alerta_id;

  -- Se alerta foi criado, enviar notificações
  IF v_alerta_id IS NOT NULL THEN
    v_titulo := 'Falta Registrada';
    v_corpo := v_motivo;

    PERFORM public.criar_notificacoes_alerta(
      v_alerta_id,
      v_aluno.pelotao_id,
      v_titulo,
      v_corpo
    );
  END IF;

  -- ========================================
  -- 2) ALERTAS POR LIMIAR
  -- ========================================

  -- Contar faltas por disciplina
  v_faltas := public.contar_faltas_aluno(
    v_presenca.aluno_id,
    v_presenca.disciplina_id
  );

  -- Obter configuração de limites
  SELECT * INTO v_config
  FROM public.obter_config_limites(v_aluno.turma_id, v_presenca.disciplina_id);

  -- Verificar se atingiu limite CRÍTICO
  IF v_faltas >= v_config.limite_critico THEN
    v_motivo := format(
      'Aluno %s atingiu %s faltas (CRÍTICO) na disciplina',
      v_aluno.nome,
      v_faltas
    );

    -- Tentar elevar alerta existente ou criar novo
    UPDATE public.alertas
    SET
      severidade = 'CRITICO',
      contagem_faltas = v_faltas,
      motivo = v_motivo
    WHERE aluno_id = v_presenca.aluno_id
      AND disciplina_id = v_presenca.disciplina_id
      AND tipo = 'LIMIAR'
      AND resolvido = FALSE
      AND severidade != 'CRITICO';

    IF NOT FOUND THEN
      -- Criar novo alerta CRÍTICO
      INSERT INTO public.alertas (
        aluno_id,
        pelotao_id,
        turma_id,
        disciplina_id,
        tipo,
        severidade,
        motivo,
        contagem_faltas,
        instrutor_id,
        created_by
      )
      VALUES (
        v_presenca.aluno_id,
        v_aluno.pelotao_id,
        v_aluno.turma_id,
        v_presenca.disciplina_id,
        'LIMIAR',
        'CRITICO',
        v_motivo,
        v_faltas,
        v_presenca.instrutor_id,
        auth.uid()
      )
      ON CONFLICT (aluno_id, disciplina_id, tipo, severidade) WHERE (tipo = 'LIMIAR' AND resolvido = FALSE) DO UPDATE
      SET contagem_faltas = v_faltas, motivo = v_motivo
      RETURNING id INTO v_alerta_id;

      -- Enviar notificações
      IF v_alerta_id IS NOT NULL THEN
        v_titulo := '🚨 Alerta CRÍTICO de Frequência';
        v_corpo := v_motivo;

        PERFORM public.criar_notificacoes_alerta(
          v_alerta_id,
          v_aluno.pelotao_id,
          v_titulo,
          v_corpo
        );
      END IF;
    END IF;

  -- Verificar se atingiu limite ALERTA
  ELSIF v_faltas >= v_config.limite_alerta THEN
    v_motivo := format(
      'Aluno %s atingiu %s faltas (ALERTA) na disciplina',
      v_aluno.nome,
      v_faltas
    );

    INSERT INTO public.alertas (
      aluno_id,
      pelotao_id,
      turma_id,
      disciplina_id,
      tipo,
      severidade,
      motivo,
      contagem_faltas,
      instrutor_id,
      created_by
    )
    VALUES (
      v_presenca.aluno_id,
      v_aluno.pelotao_id,
      v_aluno.turma_id,
      v_presenca.disciplina_id,
      'LIMIAR',
      'ALERTA',
      v_motivo,
      v_faltas,
      v_presenca.instrutor_id,
      auth.uid()
    )
    ON CONFLICT (aluno_id, disciplina_id, tipo, severidade) WHERE (tipo = 'LIMIAR' AND resolvido = FALSE) DO UPDATE
    SET contagem_faltas = v_faltas, motivo = v_motivo
    RETURNING id INTO v_alerta_id;

    -- Enviar notificações
    IF v_alerta_id IS NOT NULL THEN
      v_titulo := '⚠️ Alerta de Frequência';
      v_corpo := v_motivo;

      PERFORM public.criar_notificacoes_alerta(
        v_alerta_id,
        v_aluno.pelotao_id,
        v_titulo,
        v_corpo
      );
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Processar alertas após inserir/atualizar presença
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_processar_alertas()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processar se status for AUSENTE e aula estiver PUBLICADA
  IF NEW.status = 'AUSENTE' THEN
    -- Executar em background para não travar a inserção
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
-- FUNÇÃO: Resolver alerta
-- ============================================================================
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
  WHERE id = p_alerta_id
    AND resolvido = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO: Marcar notificação como lida
-- ============================================================================
CREATE OR REPLACE FUNCTION public.marcar_notificacao_lida(
  p_notificacao_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notificacoes
  SET
    lida = TRUE,
    lida_em = NOW()
  WHERE id = p_notificacao_id
    AND user_id = auth.uid()
    AND lida = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- CONFIG_FREQUENCIA
ALTER TABLE public.config_frequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam config"
  ON public.config_frequencia FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Coordenadores veem config de sua turma"
  ON public.config_frequencia FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pelotoes pel
      INNER JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE pel.turma_id = config_frequencia.turma_id
        AND pel.coordenador_id = auth.uid()
        AND ur.role = 'coordenador'
    )
  );

-- ALERTAS
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem todos alertas"
  ON public.alertas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Coordenadores veem alertas de seus pelotoes"
  ON public.alertas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pelotoes pel
      INNER JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE pel.id = alertas.pelotao_id
        AND pel.coordenador_id = auth.uid()
        AND ur.role = 'coordenador'
    )
  );

CREATE POLICY "Coordenadores podem resolver alertas"
  ON public.alertas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pelotoes pel
      INNER JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE pel.id = alertas.pelotao_id
        AND pel.coordenador_id = auth.uid()
        AND ur.role = 'coordenador'
    )
  );

CREATE POLICY "Instrutores veem alertas relacionados"
  ON public.alertas FOR SELECT TO authenticated
  USING (
    instrutor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'instrutor')
  );

-- NOTIFICACOES
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem suas notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem atualizar suas notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.config_frequencia IS 'Configurações de limites de frequência por turma/disciplina';
COMMENT ON TABLE public.alertas IS 'Alertas de frequência gerados automaticamente';
COMMENT ON TABLE public.notificacoes IS 'Notificações in-app para usuários';
COMMENT ON FUNCTION public.processar_alertas_ausencia IS 'Processa alertas ao registrar ausência';
COMMENT ON FUNCTION public.resolver_alerta IS 'Marca alerta como resolvido';
