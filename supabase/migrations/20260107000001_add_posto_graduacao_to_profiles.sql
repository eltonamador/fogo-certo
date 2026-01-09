-- ============================================
-- MIGRAÇÃO: Adicionar campo posto_graduacao ao perfil
-- Data: 2026-01-07
-- Descrição: Adiciona campo para posto/graduação na tabela profiles
-- ============================================

-- Adicionar coluna posto_graduacao na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS posto_graduacao TEXT;

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.posto_graduacao IS 'Posto ou graduação militar do usuário';
