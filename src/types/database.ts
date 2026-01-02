export type AppRole = 'admin' | 'instrutor' | 'aluno';
export type StatusPresenca = 'presente' | 'ausente' | 'justificado';
export type StatusEntrega = 'pendente' | 'entregue' | 'avaliado' | 'atrasado';
export type TipoMaterial = 'pdf' | 'video' | 'link' | 'documento';
export type TipoAula = 'aula' | 'simulado' | 'avaliacao';
export type PublicoAviso = 'geral' | 'pelotao' | 'disciplina';
export type PrioridadeAviso = 'normal' | 'urgente';
export type StatusUsuario = 'ativo' | 'inativo';

export interface Turma {
  id: string;
  nome: string;
  ano: number;
  data_inicio: string;
  data_fim: string;
  created_at: string;
  updated_at: string;
}

export interface Pelotao {
  id: string;
  nome: string;
  turma: string;
  turma_id: string | null;
  created_at: string;
  updated_at: string;
  turma_obj?: Turma;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  pelotao_id: string | null;
  avatar_url: string | null;
  matricula: string | null;
  telefone: string | null;
  status: StatusUsuario;
  created_at: string;
  updated_at: string;
  pelotao?: Pelotao;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Disciplina {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  cor: string;
  turma_id: string | null;
  created_at: string;
  updated_at: string;
  turma?: Turma;
}

export interface Aula {
  id: string;
  disciplina_id: string;
  instrutor_id: string;
  titulo: string;
  objetivo: string | null;
  descricao: string | null;
  data_hora_inicio: string;
  duracao_minutos: number;
  local: string | null;
  tipo: TipoAula;
  anexos: string[] | null;
  created_at: string;
  updated_at: string;
  disciplina?: Disciplina;
  instrutor?: Profile;
}

export interface Material {
  id: string;
  disciplina_id: string;
  instrutor_id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoMaterial;
  url: string | null;
  arquivo_path: string | null;
  created_at: string;
  updated_at: string;
  disciplina?: Disciplina;
}

export interface Presenca {
  id: string;
  aula_id: string;
  aluno_id: string;
  status: StatusPresenca;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  aluno?: Profile;
  aula?: Aula;
}

export interface Avaliacao {
  id: string;
  disciplina_id: string;
  instrutor_id: string;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  duracao_minutos: number;
  nota_maxima: number;
  tempo_min: number;
  peso: number;
  created_at: string;
  updated_at: string;
  disciplina?: Disciplina;
  questoes?: Questao[];
}

export interface Questao {
  id: string;
  avaliacao_id: string;
  enunciado: string;
  alternativas: string[];
  alternativa_a: string | null;
  alternativa_b: string | null;
  alternativa_c: string | null;
  alternativa_d: string | null;
  correta: number;
  correta_letra: string | null;
  peso: number;
  ordem: number;
  created_at: string;
}

export interface Resposta {
  id: string;
  avaliacao_id: string;
  aluno_id: string;
  respostas: Record<string, number> | null;
  nota: number | null;
  data_submissao: string;
  created_at: string;
  avaliacao?: Avaliacao;
}

export interface Tarefa {
  id: string;
  disciplina_id: string;
  instrutor_id: string;
  titulo: string;
  descricao: string | null;
  instrucoes: string | null;
  prazo: string;
  anexos: string[] | null;
  created_at: string;
  updated_at: string;
  disciplina?: Disciplina;
}

export interface Entrega {
  id: string;
  tarefa_id: string;
  aluno_id: string;
  arquivo_path: string | null;
  comentario: string | null;
  nota: number | null;
  feedback: string | null;
  status: StatusEntrega;
  data_entrega: string | null;
  created_at: string;
  updated_at: string;
  tarefa?: Tarefa;
  aluno?: Profile;
}

export interface Aviso {
  id: string;
  autor_id: string;
  titulo: string;
  conteudo: string;
  fixado: boolean;
  publico: PublicoAviso;
  prioridade: PrioridadeAviso;
  pelotao_id: string | null;
  disciplina_id: string | null;
  created_at: string;
  updated_at: string;
  autor?: Profile;
  pelotao?: Pelotao;
  disciplina?: Disciplina;
}
