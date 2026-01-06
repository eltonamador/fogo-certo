-- Create function to toggle between instrutor and admin roles
-- Only works for bootstrap admin email (elton.amador@gmail.com)
-- Instrutor can become admin temporarily, and admin can go back to instrutor

CREATE OR REPLACE FUNCTION public.toggle_admin_role()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _current_role app_role;
  _new_role app_role;
  _bootstrap_email text := 'elton.amador@gmail.com';
BEGIN
  -- Get current user
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Get user email
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = _user_id;

  -- Check if user is the bootstrap admin
  IF _user_email != _bootstrap_email THEN
    RAISE EXCEPTION 'Apenas o usuário autorizado pode alternar para admin';
  END IF;

  -- Get current role
  SELECT role INTO _current_role
  FROM public.user_roles
  WHERE user_id = _user_id;

  -- Toggle between instrutor and admin
  IF _current_role = 'instrutor' THEN
    _new_role := 'admin';
  ELSIF _current_role = 'admin' THEN
    _new_role := 'instrutor';
  ELSE
    RAISE EXCEPTION 'Apenas instrutores podem alternar para admin';
  END IF;

  -- Update role
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _user_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'previous_role', _current_role,
    'new_role', _new_role,
    'message',
      CASE
        WHEN _new_role = 'admin' THEN 'Modo administrativo ativado'
        ELSE 'Voltou para modo instrutor'
      END
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_admin_role TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.toggle_admin_role IS
'Allows bootstrap admin to toggle between instrutor and admin roles.
Only works for elton.amador@gmail.com';

-- Create helper function to check if user can toggle admin
CREATE OR REPLACE FUNCTION public.can_toggle_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _current_role app_role;
  _bootstrap_email text := 'elton.amador@gmail.com';
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get user email
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = _user_id;

  -- Check if bootstrap admin
  IF _user_email != _bootstrap_email THEN
    RETURN false;
  END IF;

  -- Get current role
  SELECT role INTO _current_role
  FROM public.user_roles
  WHERE user_id = _user_id;

  -- Can toggle if instrutor or admin
  RETURN _current_role IN ('instrutor', 'admin');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_toggle_admin TO authenticated;

COMMENT ON FUNCTION public.can_toggle_admin IS
'Checks if current user can toggle between instrutor and admin roles';
