-- ============================================
-- MIGRAÇÃO: Criar tabela academic_education
-- Data: 2026-01-07
-- Descrição: Tabela para formação acadêmica dos usuários
-- ============================================

CREATE TABLE IF NOT EXISTS public.academic_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL CHECK (nivel IN ('Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-graduação', 'Mestrado', 'Doutorado')),
  curso TEXT NOT NULL,
  instituicao TEXT NOT NULL,
  situacao TEXT NOT NULL CHECK (situacao IN ('Concluído', 'Em andamento', 'Trancado')),
  ano_inicio TEXT,
  ano_conclusao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_academic_education_user_id ON public.academic_education(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_education_created_at ON public.academic_education(created_at DESC);

-- RLS
ALTER TABLE public.academic_education ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias formações"
  ON public.academic_education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias formações"
  ON public.academic_education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias formações"
  ON public.academic_education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias formações"
  ON public.academic_education FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas
CREATE POLICY "Admins podem ver todas as formações"
  ON public.academic_education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem editar todas
CREATE POLICY "Admins podem editar todas as formações"
  ON public.academic_education FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_academic_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER academic_education_updated_at
  BEFORE UPDATE ON public.academic_education
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_education_updated_at();

-- Comentários
COMMENT ON TABLE public.academic_education IS 'Formação acadêmica dos usuários';
COMMENT ON COLUMN public.academic_education.nivel IS 'Nível de formação: Fundamental, Médio, Técnico, Superior, Pós-graduação, Mestrado, Doutorado';
COMMENT ON COLUMN public.academic_education.situacao IS 'Situação: Concluído, Em andamento, Trancado';
