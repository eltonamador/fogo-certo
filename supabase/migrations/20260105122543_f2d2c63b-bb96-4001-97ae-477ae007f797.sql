-- Create function to handle new user role assignment with validation
-- This function ensures:
-- 1. Only 'aluno' or 'instrutor' roles are allowed during signup
-- 2. Bootstrap admin email gets 'admin' role automatically
-- 3. Pelotao is required for alunos

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _requested_role text;
  _pelotao_id uuid;
  _bootstrap_email text := 'elton.amador@gmail.com';
BEGIN
  -- Get requested role from metadata (default to 'aluno')
  _requested_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'aluno');
  
  -- Get pelotao_id from metadata
  _pelotao_id := (NEW.raw_user_meta_data ->> 'pelotao_id')::uuid;
  
  -- Check if this is the bootstrap admin
  IF NEW.email = _bootstrap_email THEN
    _role := 'admin';
  -- Only allow 'aluno' or 'instrutor' during signup
  ELSIF _requested_role IN ('aluno', 'instrutor') THEN
    _role := _requested_role::app_role;
  ELSE
    -- Force to 'aluno' if invalid role was attempted
    _role := 'aluno';
  END IF;
  
  -- Validate pelotao for alunos
  IF _role = 'aluno' AND _pelotao_id IS NULL THEN
    RAISE EXCEPTION 'Pelotão é obrigatório para alunos';
  END IF;
  
  -- Update profile with pelotao_id if aluno
  IF _role = 'aluno' AND _pelotao_id IS NOT NULL THEN
    UPDATE public.profiles
    SET pelotao_id = _pelotao_id
    WHERE id = NEW.id;
  END IF;
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment (runs after handle_new_user creates profile)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Add unique constraint on user_id in user_roles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create function for admin to change user roles (with validation)
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  _target_user_id uuid,
  _new_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_role app_role;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar papéis';
  END IF;
  
  -- Get current role
  SELECT role INTO _current_role
  FROM public.user_roles
  WHERE user_id = _target_user_id;
  
  -- Prevent aluno from becoming admin directly
  IF _current_role = 'aluno' AND _new_role = 'admin' THEN
    RAISE EXCEPTION 'Aluno não pode ser promovido diretamente a admin. Promova primeiro a instrutor.';
  END IF;
  
  -- Update role
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _target_user_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_change_user_role TO authenticated;