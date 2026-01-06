-- ============================================
-- MIGRAÇÃO: Adicionar campos completos ao perfil
-- Data: 2026-01-05
-- Descrição: Sistema de ficha completa com wizard
-- ============================================

-- 1. Adicionar novos campos na tabela profiles
ALTER TABLE public.profiles
  -- Identificação
  ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar')),
  ADD COLUMN IF NOT EXISTS tipo_sanguineo TEXT CHECK (tipo_sanguineo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

  -- Contato de Emergencia (JSONB)
  -- Estrutura: {nome: string, parentesco: string, telefone: string}
  ADD COLUMN IF NOT EXISTS contato_emergencia JSONB,

  -- Endereco (JSONB)
  -- Estrutura: {cep: string, logradouro: string, numero: string, complemento?: string,
  --             bairro: string, cidade: string, uf: string}
  ADD COLUMN IF NOT EXISTS endereco JSONB,

  -- Cursos Operacionais
  ADD COLUMN IF NOT EXISTS cursos_operacionais JSONB, -- array de strings
  ADD COLUMN IF NOT EXISTS cursos_operacionais_outros TEXT,

  -- Formacao Academica (JSONB array)
  -- Estrutura: [{nivel: string, curso: string, instituicao: string, ano: string}]
  ADD COLUMN IF NOT EXISTS formacao_academica JSONB,

  -- Experiencia Profissional (JSONB array)
  -- Estrutura: [{cargo: string, instituicao_empresa: string, periodo_inicio: string,
  --              periodo_fim: string, descricao: string}]
  ADD COLUMN IF NOT EXISTS experiencia_profissional JSONB,

  -- Saude (JSONB - dados sensíveis)
  -- Estrutura: {
  --   doenca_cronica: boolean,
  --   doenca_cronica_qual?: string,
  --   alergias?: string,
  --   medicamentos_uso?: string,
  --   restricao_fisica?: string,
  --   observacoes_medicas?: string,
  --   consentimento_data: timestamp
  -- }
  ADD COLUMN IF NOT EXISTS saude JSONB,

  -- Controle de completude do perfil
  ADD COLUMN IF NOT EXISTS perfil_completo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS perfil_completado_em TIMESTAMP WITH TIME ZONE;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_perfil_completo ON public.profiles(perfil_completo);
CREATE INDEX IF NOT EXISTS idx_profiles_data_nascimento ON public.profiles(data_nascimento) WHERE data_nascimento IS NOT NULL;

-- 3. Criar funcao para validar CPF (formato basico)
CREATE OR REPLACE FUNCTION public.validar_cpf(cpf_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cpf_limpo TEXT;
  soma INTEGER;
  resto INTEGER;
  digito1 INTEGER;
  digito2 INTEGER;
BEGIN
  -- Remove pontos e tracos
  cpf_limpo := regexp_replace(cpf_input, '[^0-9]', '', 'g');

  -- Verifica se tem 11 digitos
  IF length(cpf_limpo) != 11 THEN
    RETURN FALSE;
  END IF;

  -- Verifica se todos os digitos sao iguais (ex: 111.111.111-11)
  IF cpf_limpo ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;

  -- Validacao do primeiro digito verificador
  soma := 0;
  FOR i IN 1..9 LOOP
    soma := soma + (substring(cpf_limpo from i for 1)::INTEGER * (11 - i));
  END LOOP;
  resto := soma % 11;
  IF resto < 2 THEN
    digito1 := 0;
  ELSE
    digito1 := 11 - resto;
  END IF;

  IF digito1 != substring(cpf_limpo from 10 for 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  -- Validacao do segundo digito verificador
  soma := 0;
  FOR i IN 1..10 LOOP
    soma := soma + (substring(cpf_limpo from i for 1)::INTEGER * (12 - i));
  END LOOP;
  resto := soma % 11;
  IF resto < 2 THEN
    digito2 := 0;
  ELSE
    digito2 := 11 - resto;
  END IF;

  IF digito2 != substring(cpf_limpo from 11 for 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. Adicionar constraint para validacao de CPF
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_cpf_valido'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_cpf_valido
      CHECK (cpf IS NULL OR validar_cpf(cpf));
  END IF;
END $$;

-- 5. Adicionar constraint para validacao de data de nascimento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_data_nascimento_valida'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_data_nascimento_valida
      CHECK (data_nascimento IS NULL OR (
        data_nascimento <= CURRENT_DATE AND
        data_nascimento >= '1900-01-01'::DATE AND
        AGE(data_nascimento) >= INTERVAL '16 years'
      ));
  END IF;
END $$;

-- 6. Criar funcao para calcular idade
CREATE OR REPLACE FUNCTION public.calcular_idade(data_nasc DATE)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT EXTRACT(YEAR FROM AGE(data_nasc))::INTEGER;
$$;

-- 7. Criar funcao para marcar perfil como completo
CREATE OR REPLACE FUNCTION public.marcar_perfil_completo(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    perfil_completo = TRUE,
    perfil_completado_em = CASE
      WHEN perfil_completado_em IS NULL THEN NOW()
      ELSE perfil_completado_em
    END,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 8. Criar funcao para verificar se perfil esta completo
CREATE OR REPLACE FUNCTION public.verificar_perfil_completo(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar campos obrigatorios
  IF profile_record.cpf IS NULL OR
     profile_record.data_nascimento IS NULL OR
     profile_record.tipo_sanguineo IS NULL OR
     profile_record.contato_emergencia IS NULL OR
     profile_record.endereco IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar campos obrigatorios dentro do JSONB contato_emergencia
  IF NOT (profile_record.contato_emergencia ? 'nome' AND
          profile_record.contato_emergencia ? 'parentesco' AND
          profile_record.contato_emergencia ? 'telefone') THEN
    RETURN FALSE;
  END IF;

  -- Verificar campos obrigatorios dentro do JSONB endereco
  IF NOT (profile_record.endereco ? 'cep' AND
          profile_record.endereco ? 'logradouro' AND
          profile_record.endereco ? 'numero' AND
          profile_record.endereco ? 'bairro' AND
          profile_record.endereco ? 'cidade' AND
          profile_record.endereco ? 'uf') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 9. Comentarios nas colunas para documentacao
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuario (formato: 000.000.000-00), unico';
COMMENT ON COLUMN public.profiles.data_nascimento IS 'Data de nascimento (minimo 16 anos)';
COMMENT ON COLUMN public.profiles.sexo IS 'Sexo/genero do usuario';
COMMENT ON COLUMN public.profiles.tipo_sanguineo IS 'Tipo sanguineo';
COMMENT ON COLUMN public.profiles.contato_emergencia IS 'Contato de emergencia: {nome, parentesco, telefone}';
COMMENT ON COLUMN public.profiles.endereco IS 'Endereco completo: {cep, logradouro, numero, complemento, bairro, cidade, uf}';
COMMENT ON COLUMN public.profiles.cursos_operacionais IS 'Array de strings com cursos operacionais';
COMMENT ON COLUMN public.profiles.cursos_operacionais_outros IS 'Outros cursos nao listados';
COMMENT ON COLUMN public.profiles.formacao_academica IS 'Array de objetos: [{nivel, curso, instituicao, ano}]';
COMMENT ON COLUMN public.profiles.experiencia_profissional IS 'Array de objetos: [{cargo, instituicao_empresa, periodo_inicio, periodo_fim, descricao}]';
COMMENT ON COLUMN public.profiles.saude IS 'Dados de saude (sensivel): {doenca_cronica, doenca_cronica_qual, alergias, medicamentos_uso, restricao_fisica, observacoes_medicas, consentimento_data}';
COMMENT ON COLUMN public.profiles.perfil_completo IS 'Flag indicando se o perfil foi completamente preenchido';
COMMENT ON COLUMN public.profiles.perfil_completado_em IS 'Data/hora quando o perfil foi completado pela primeira vez';
