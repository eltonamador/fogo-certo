-- Create a secure view for students that hides correct answers
CREATE OR REPLACE VIEW public.questoes_aluno AS
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

-- Update the questoes table policy to restrict students from seeing correct answers
DROP POLICY IF EXISTS "Todos autenticados podem ver questões" ON public.questoes;

-- Only instructors and admins can see the full questoes table (with answers)
CREATE POLICY "Instrutores e admins podem ver questões completas" 
ON public.questoes 
FOR SELECT 
USING (has_role(auth.uid(), 'instrutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));