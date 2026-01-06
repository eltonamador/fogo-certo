-- ============================================================================
-- SISTEMA DE FREQUÊNCIA/CHAMADA
-- ============================================================================

-- Tipos ENUM
CREATE TYPE tipo_aula AS ENUM ('AULA', 'PROVA', 'AVALIACAO', 'SIMULADO', 'ATIVIDADE_PRATICA');
CREATE TYPE status_presenca AS ENUM ('PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATRASO');
CREATE TYPE status_aula AS ENUM ('RASCUNHO', 'PUBLICADA', 'FINALIZADA');

-- ============================================================================
-- TABELA: aulas
-- Registra cada aula/evento de uma disciplina
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  instrutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  pelotao_id UUID REFERENCES public.pelotoes(id) ON DELETE SET NULL,
  turma TEXT,

  -- Dados da aula
  data_aula DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME,
  tipo tipo_aula NOT NULL DEFAULT 'AULA',
  titulo TEXT NOT NULL,
  descricao TEXT,
  local TEXT,

  -- Controle de status
  status status_aula NOT NULL DEFAULT 'RASCUNHO',
  total_alunos INTEGER DEFAULT 0,
  total_presentes INTEGER DEFAULT 0,
  total_ausentes INTEGER DEFAULT 0,
  total_justificados INTEGER DEFAULT 0,
  total_atrasos INTEGER DEFAULT 0,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id),
  publicada_at TIMESTAMPTZ,
  publicada_by UUID REFERENCES public.profiles(id),

  -- Constraints
  CONSTRAINT aula_hora_valida CHECK (hora_fim IS NULL OR hora_fim > hora_inicio),
  CONSTRAINT aula_data_valida CHECK (data_aula >= '2020-01-01' AND data_aula <= CURRENT_DATE + INTERVAL '1 year')
);

-- Índices para performance
CREATE INDEX idx_aulas_disciplina ON public.aulas(disciplina_id);
CREATE INDEX idx_aulas_instrutor ON public.aulas(instrutor_id);
CREATE INDEX idx_aulas_pelotao ON public.aulas(pelotao_id);
CREATE INDEX idx_aulas_data ON public.aulas(data_aula DESC);
CREATE INDEX idx_aulas_status ON public.aulas(status);
CREATE INDEX idx_aulas_tipo ON public.aulas(tipo);

-- ============================================================================
-- TABELA: presencas
-- Registra a presença de cada aluno em cada aula
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Status da presença
  status status_presenca NOT NULL DEFAULT 'AUSENTE',
  observacao TEXT,
  justificativa_url TEXT, -- URL do documento de justificativa
  justificativa_anexo TEXT, -- Nome do arquivo

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id),

  -- Constraints
  CONSTRAINT presenca_unica UNIQUE (aula_id, aluno_id)
);

-- Índices para performance
CREATE INDEX idx_presencas_aula ON public.presencas(aula_id);
CREATE INDEX idx_presencas_aluno ON public.presencas(aluno_id);
CREATE INDEX idx_presencas_status ON public.presencas(status);

-- ============================================================================
-- FUNÇÃO: Atualizar contadores de presença na aula
-- ============================================================================
CREATE OR REPLACE FUNCTION public.atualizar_contadores_aula()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.aulas
  SET
    total_presentes = (
      SELECT COUNT(*) FROM public.presencas
      WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id) AND status = 'PRESENTE'
    ),
    total_ausentes = (
      SELECT COUNT(*) FROM public.presencas
      WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id) AND status = 'AUSENTE'
    ),
    total_justificados = (
      SELECT COUNT(*) FROM public.presencas
      WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id) AND status = 'JUSTIFICADO'
    ),
    total_atrasos = (
      SELECT COUNT(*) FROM public.presencas
      WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id) AND status = 'ATRASO'
    ),
    total_alunos = (
      SELECT COUNT(*) FROM public.presencas
      WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.aula_id, OLD.aula_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contadores
CREATE TRIGGER trigger_atualizar_contadores_aula
AFTER INSERT OR UPDATE OR DELETE ON public.presencas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_contadores_aula();

-- ============================================================================
-- FUNÇÃO: Criar presenças para todos os alunos do pelotão
-- ============================================================================
CREATE OR REPLACE FUNCTION public.criar_presencas_pelotao(
  p_aula_id UUID,
  p_pelotao_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Inserir presença AUSENTE para todos os alunos do pelotão
  INSERT INTO public.presencas (aula_id, aluno_id, status, created_by)
  SELECT
    p_aula_id,
    p.id,
    'AUSENTE'::status_presenca,
    auth.uid()
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.pelotao_id = p_pelotao_id
    AND ur.role = 'aluno'
    AND NOT EXISTS (
      SELECT 1 FROM public.presencas
      WHERE aula_id = p_aula_id AND aluno_id = p.id
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO: Publicar chamada (rascunho -> publicada)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.publicar_chamada(p_aula_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.aulas
  SET
    status = 'PUBLICADA',
    publicada_at = NOW(),
    publicada_by = auth.uid(),
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_aula_id
    AND status = 'RASCUNHO';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO: Calcular percentual de presença de um aluno
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calcular_percentual_presenca(
  p_aluno_id UUID,
  p_disciplina_id UUID DEFAULT NULL,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_presentes INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE a.status = 'PUBLICADA'),
    COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND (p.status = 'PRESENTE' OR p.status = 'ATRASO'))
  INTO v_total, v_presentes
  FROM public.presencas p
  INNER JOIN public.aulas a ON a.id = p.aula_id
  WHERE p.aluno_id = p_aluno_id
    AND (p_disciplina_id IS NULL OR a.disciplina_id = p_disciplina_id)
    AND (p_data_inicio IS NULL OR a.data_aula >= p_data_inicio)
    AND (p_data_fim IS NULL OR a.data_aula <= p_data_fim);

  IF v_total = 0 THEN
    RETURN 100;
  END IF;

  RETURN ROUND((v_presentes::NUMERIC / v_total::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Resumo de frequência por aluno e disciplina
-- ============================================================================
CREATE OR REPLACE VIEW public.resumo_frequencia_aluno AS
SELECT
  p.aluno_id,
  a.disciplina_id,
  prof.nome as aluno_nome,
  prof.matricula as aluno_matricula,
  d.nome as disciplina_nome,
  COUNT(*) FILTER (WHERE a.status = 'PUBLICADA') as total_aulas,
  COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND p.status = 'PRESENTE') as total_presentes,
  COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND p.status = 'AUSENTE') as total_ausentes,
  COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND p.status = 'JUSTIFICADO') as total_justificados,
  COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND p.status = 'ATRASO') as total_atrasos,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'PUBLICADA' AND (p.status = 'PRESENTE' OR p.status = 'ATRASO'))::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE a.status = 'PUBLICADA'), 0)::NUMERIC) * 100,
    2
  ) as percentual_presenca
FROM public.presencas p
INNER JOIN public.aulas a ON a.id = p.aula_id
INNER JOIN public.profiles prof ON prof.id = p.aluno_id
INNER JOIN public.disciplinas d ON d.id = a.disciplina_id
GROUP BY p.aluno_id, a.disciplina_id, prof.nome, prof.matricula, d.nome;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- POLICIES para AULAS
-- Admins podem tudo
CREATE POLICY "Admins podem ver todas as aulas"
  ON public.aulas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem criar aulas"
  ON public.aulas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem editar todas as aulas"
  ON public.aulas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Instrutores veem suas próprias aulas e podem criar
CREATE POLICY "Instrutores veem suas aulas"
  ON public.aulas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND (role = 'instrutor' OR role = 'admin')
    ) AND (
      instrutor_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Instrutores podem criar aulas"
  ON public.aulas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND (role = 'instrutor' OR role = 'admin')
    ) AND instrutor_id = auth.uid()
  );

CREATE POLICY "Instrutores podem editar suas aulas"
  ON public.aulas FOR UPDATE
  TO authenticated
  USING (
    instrutor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND (role = 'instrutor' OR role = 'admin')
    )
  );

-- Alunos veem aulas do seu pelotão (publicadas)
CREATE POLICY "Alunos veem aulas do pelotao"
  ON public.aulas FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLICADA' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.pelotao_id = aulas.pelotao_id
    )
  );

-- POLICIES para PRESENCAS
-- Admins podem tudo
CREATE POLICY "Admins podem ver todas as presencas"
  ON public.presencas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Instrutores podem gerenciar presenças de suas aulas
CREATE POLICY "Instrutores gerenciam presencas de suas aulas"
  ON public.presencas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.aulas a
      INNER JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = presencas.aula_id
        AND a.instrutor_id = auth.uid()
        AND (ur.role = 'instrutor' OR ur.role = 'admin')
    )
  );

-- Alunos veem apenas sua própria presença
CREATE POLICY "Alunos veem sua presenca"
  ON public.presencas FOR SELECT
  TO authenticated
  USING (
    aluno_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.aulas a
      WHERE a.id = presencas.aula_id AND a.status = 'PUBLICADA'
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.aulas IS 'Registro de aulas/eventos de disciplinas';
COMMENT ON TABLE public.presencas IS 'Registro de presença de alunos em aulas';
COMMENT ON FUNCTION public.criar_presencas_pelotao IS 'Cria registros de presença para todos alunos do pelotão';
COMMENT ON FUNCTION public.publicar_chamada IS 'Publica uma chamada (rascunho -> publicada)';
COMMENT ON FUNCTION public.calcular_percentual_presenca IS 'Calcula percentual de presença de um aluno';
