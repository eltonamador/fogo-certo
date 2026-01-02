-- Enum para papéis de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'instrutor', 'aluno');

-- Enum para status de presença
CREATE TYPE public.status_presenca AS ENUM ('presente', 'ausente', 'justificado');

-- Enum para status de entrega
CREATE TYPE public.status_entrega AS ENUM ('pendente', 'entregue', 'avaliado', 'atrasado');

-- Enum para tipo de material
CREATE TYPE public.tipo_material AS ENUM ('pdf', 'video', 'link', 'documento');

-- Tabela de Pelotões
CREATE TABLE public.pelotoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  turma TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  pelotao_id UUID REFERENCES public.pelotoes(id),
  avatar_url TEXT,
  matricula TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Papéis (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'aluno',
  UNIQUE(user_id, role)
);

-- Tabela de Disciplinas
CREATE TABLE public.disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  carga_horaria INTEGER NOT NULL DEFAULT 0,
  cor TEXT DEFAULT '#1e3a5f',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Aulas
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  instrutor_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  objetivo TEXT,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  local TEXT,
  anexos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Materiais
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  instrutor_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo tipo_material NOT NULL DEFAULT 'pdf',
  url TEXT,
  arquivo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Presenças
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status status_presenca NOT NULL DEFAULT 'presente',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(aula_id, aluno_id)
);

-- Tabela de Avaliações
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  instrutor_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  nota_maxima DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Questões
CREATE TABLE public.questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE CASCADE NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  correta INTEGER NOT NULL,
  peso DECIMAL(3,2) DEFAULT 1.00,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Respostas
CREATE TABLE public.respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB,
  nota DECIMAL(5,2),
  data_submissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(avaliacao_id, aluno_id)
);

-- Tabela de Tarefas
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  instrutor_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prazo TIMESTAMP WITH TIME ZONE NOT NULL,
  anexos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Entregas
CREATE TABLE public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES public.tarefas(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  arquivo_path TEXT,
  comentario TEXT,
  nota DECIMAL(5,2),
  feedback TEXT,
  status status_entrega NOT NULL DEFAULT 'pendente',
  data_entrega TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tarefa_id, aluno_id)
);

-- Tabela de Avisos
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID REFERENCES auth.users(id) NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  fixado BOOLEAN DEFAULT false,
  pelotao_id UUID REFERENCES public.pelotoes(id),
  disciplina_id UUID REFERENCES public.disciplinas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para verificar papel do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter papel do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pelotoes_updated_at BEFORE UPDATE ON public.pelotoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presencas_updated_at BEFORE UPDATE ON public.presencas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelotoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins podem atualizar qualquer perfil" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para User Roles (apenas admins)
CREATE POLICY "Usuários podem ver seu próprio papel" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins podem ver todos os papéis" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem gerenciar papéis" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Pelotões
CREATE POLICY "Todos autenticados podem ver pelotões" ON public.pelotoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar pelotões" ON public.pelotoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Disciplinas
CREATE POLICY "Todos autenticados podem ver disciplinas" ON public.disciplinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem gerenciar disciplinas" ON public.disciplinas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Aulas
CREATE POLICY "Todos autenticados podem ver aulas" ON public.aulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores podem criar aulas" ON public.aulas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Instrutores podem editar próprias aulas" ON public.aulas FOR UPDATE TO authenticated USING (instrutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar aulas" ON public.aulas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Materiais
CREATE POLICY "Todos autenticados podem ver materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores podem gerenciar materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Instrutores podem editar próprios materiais" ON public.materiais FOR UPDATE TO authenticated USING (instrutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar materiais" ON public.materiais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR instrutor_id = auth.uid());

-- Políticas RLS para Presenças
CREATE POLICY "Alunos podem ver própria presença" ON public.presencas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Instrutores podem gerenciar presenças" ON public.presencas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Avaliações
CREATE POLICY "Todos autenticados podem ver avaliações" ON public.avaliacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores podem gerenciar avaliações" ON public.avaliacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Questões
CREATE POLICY "Todos autenticados podem ver questões" ON public.questoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores podem gerenciar questões" ON public.questoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Respostas
CREATE POLICY "Alunos podem ver próprias respostas" ON public.respostas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos podem criar próprias respostas" ON public.respostas FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "Instrutores podem gerenciar respostas" ON public.respostas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Tarefas
CREATE POLICY "Todos autenticados podem ver tarefas" ON public.tarefas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores podem gerenciar tarefas" ON public.tarefas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Entregas
CREATE POLICY "Alunos podem ver próprias entregas" ON public.entregas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos podem criar próprias entregas" ON public.entregas FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "Alunos podem atualizar próprias entregas" ON public.entregas FOR UPDATE TO authenticated USING (aluno_id = auth.uid() OR public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para Avisos
CREATE POLICY "Todos autenticados podem ver avisos" ON public.avisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instrutores e admins podem criar avisos" ON public.avisos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'instrutor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autores podem editar próprios avisos" ON public.avisos FOR UPDATE TO authenticated USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar avisos" ON public.avisos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR autor_id = auth.uid());