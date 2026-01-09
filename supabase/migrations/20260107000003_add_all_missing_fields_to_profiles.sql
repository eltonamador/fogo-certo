-- ============================================
-- MIGRAÇÃO: Adicionar TODOS os campos faltantes ao perfil
-- Data: 2026-01-07
-- Descrição: Adiciona todos os campos novos na tabela profiles de uma vez
-- ============================================

-- Adicionar todas as colunas de uma vez
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome_guerra TEXT,
  ADD COLUMN IF NOT EXISTS posto_graduacao TEXT,
  ADD COLUMN IF NOT EXISTS possui_cnh BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS categoria_cnh TEXT,
  ADD COLUMN IF NOT EXISTS estado_civil TEXT,
  ADD COLUMN IF NOT EXISTS lotacao TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN public.profiles.nome_guerra IS 'Nome de guerra utilizado em contextos militares e operacionais';
COMMENT ON COLUMN public.profiles.posto_graduacao IS 'Posto ou graduação militar do usuário';
COMMENT ON COLUMN public.profiles.possui_cnh IS 'Indica se o usuário possui CNH';
COMMENT ON COLUMN public.profiles.categoria_cnh IS 'Categoria da CNH (A, B, AB, C, D, E)';
COMMENT ON COLUMN public.profiles.estado_civil IS 'Estado civil do usuário';
COMMENT ON COLUMN public.profiles.lotacao IS 'Lotação/unidade do usuário';
