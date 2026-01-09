-- ============================================
-- MIGRAÇÃO: Adicionar campos CNH, Estado Civil e Lotação ao perfil
-- Data: 2026-01-07
-- Descrição: Adiciona campos para CNH, estado civil e lotação na tabela profiles
-- ============================================

-- Adicionar colunas na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS possui_cnh BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS categoria_cnh TEXT,
  ADD COLUMN IF NOT EXISTS estado_civil TEXT,
  ADD COLUMN IF NOT EXISTS lotacao TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN public.profiles.possui_cnh IS 'Indica se o usuário possui CNH';
COMMENT ON COLUMN public.profiles.categoria_cnh IS 'Categoria da CNH (A, B, AB, C, D, E)';
COMMENT ON COLUMN public.profiles.estado_civil IS 'Estado civil do usuário';
COMMENT ON COLUMN public.profiles.lotacao IS 'Lotação/unidade do usuário';
