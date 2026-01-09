-- ============================================
-- MIGRAÇÃO: Adicionar campo nome_guerra ao perfil
-- Data: 2026-01-07
-- Descrição: Adiciona campo para nome de guerra na tabela profiles
-- ============================================

-- Adicionar coluna nome_guerra na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome_guerra TEXT;

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.nome_guerra IS 'Nome de guerra utilizado em contextos militares e operacionais';
