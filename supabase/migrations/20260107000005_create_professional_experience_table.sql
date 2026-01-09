-- ============================================
-- MIGRAÇÃO: Criar tabela professional_experience
-- Data: 2026-01-07
-- Descrição: Tabela para experiência profissional dos usuários
-- ============================================

CREATE TABLE IF NOT EXISTS public.professional_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  organizacao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Militar', 'Civil', 'Voluntário')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  local TEXT,
  atividades TEXT,
  competencias JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_professional_experience_user_id ON public.professional_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_experience_created_at ON public.professional_experience(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_experience_data_inicio ON public.professional_experience(data_inicio DESC);

-- RLS
ALTER TABLE public.professional_experience ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias experiências"
  ON public.professional_experience FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias experiências"
  ON public.professional_experience FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias experiências"
  ON public.professional_experience FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias experiências"
  ON public.professional_experience FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas
CREATE POLICY "Admins podem ver todas as experiências"
  ON public.professional_experience FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem editar todas
CREATE POLICY "Admins podem editar todas as experiências"
  ON public.professional_experience FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_professional_experience_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER professional_experience_updated_at
  BEFORE UPDATE ON public.professional_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_experience_updated_at();

-- Comentários
COMMENT ON TABLE public.professional_experience IS 'Experiência profissional dos usuários';
COMMENT ON COLUMN public.professional_experience.tipo IS 'Tipo de experiência: Militar, Civil, Voluntário';
COMMENT ON COLUMN public.professional_experience.data_fim IS 'Se NULL, indica que é a experiência atual';
COMMENT ON COLUMN public.professional_experience.competencias IS 'Array JSON de competências/habilidades';
