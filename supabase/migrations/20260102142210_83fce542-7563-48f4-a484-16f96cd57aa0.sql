-- Drop and recreate view with SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.questoes_aluno;

CREATE VIEW public.questoes_aluno 
WITH (security_invoker = true)
AS
SELECT 
  id,
  avaliacao_id,
  enunciado,
  alternativa_a,
  alternativa_b,
  alternativa_c,
  alternativa_d,
  peso,
  ordem,
  created_at
FROM public.questoes;

-- Grant access to the view
GRANT SELECT ON public.questoes_aluno TO authenticated;