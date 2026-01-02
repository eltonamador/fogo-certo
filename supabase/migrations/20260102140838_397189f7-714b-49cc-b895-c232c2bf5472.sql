
-- Create new enums
CREATE TYPE public.tipo_aula AS ENUM ('aula', 'simulado', 'avaliacao');
CREATE TYPE public.publico_aviso AS ENUM ('geral', 'pelotao', 'disciplina');
CREATE TYPE public.prioridade_aviso AS ENUM ('normal', 'urgente');
CREATE TYPE public.status_usuario AS ENUM ('ativo', 'inativo');

-- Create turmas table
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on turmas
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- RLS policies for turmas
CREATE POLICY "Todos autenticados podem ver turmas" ON public.turmas
FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar turmas" ON public.turmas
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add turma_id to pelotoes
ALTER TABLE public.pelotoes ADD COLUMN turma_id UUID REFERENCES public.turmas(id);

-- Add status to profiles
ALTER TABLE public.profiles ADD COLUMN status status_usuario NOT NULL DEFAULT 'ativo';

-- Add turma_id to disciplinas
ALTER TABLE public.disciplinas ADD COLUMN turma_id UUID REFERENCES public.turmas(id);

-- Update aulas table with new fields
ALTER TABLE public.aulas ADD COLUMN tipo tipo_aula NOT NULL DEFAULT 'aula';
ALTER TABLE public.aulas RENAME COLUMN data_hora TO data_hora_inicio;

-- Update avisos table with new fields
ALTER TABLE public.avisos ADD COLUMN publico publico_aviso NOT NULL DEFAULT 'geral';
ALTER TABLE public.avisos ADD COLUMN prioridade prioridade_aviso NOT NULL DEFAULT 'normal';

-- Update avaliacoes with new required fields
ALTER TABLE public.avaliacoes ADD COLUMN tempo_min INTEGER NOT NULL DEFAULT 60;
ALTER TABLE public.avaliacoes ADD COLUMN peso NUMERIC NOT NULL DEFAULT 1.0;

-- Update questoes to have individual alternative columns instead of JSON
ALTER TABLE public.questoes ADD COLUMN alternativa_a TEXT;
ALTER TABLE public.questoes ADD COLUMN alternativa_b TEXT;
ALTER TABLE public.questoes ADD COLUMN alternativa_c TEXT;
ALTER TABLE public.questoes ADD COLUMN alternativa_d TEXT;
ALTER TABLE public.questoes ADD COLUMN correta_letra CHAR(1);

-- Update tarefas with instrucoes
ALTER TABLE public.tarefas ADD COLUMN instrucoes TEXT;

-- Update triggers for turmas
CREATE TRIGGER update_turmas_updated_at
BEFORE UPDATE ON public.turmas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
