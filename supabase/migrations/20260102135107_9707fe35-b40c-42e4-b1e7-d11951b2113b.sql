-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- Create a more restrictive SELECT policy
-- Users can only see their own profile, OR admins/instructors can see all profiles
CREATE POLICY "Usuários podem ver perfis de forma restrita" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'instrutor'::app_role)
);