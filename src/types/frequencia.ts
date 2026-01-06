export type TipoAula = 'AULA' | 'PROVA' | 'AVALIACAO' | 'SIMULADO' | 'ATIVIDADE_PRATICA';
export type StatusPresenca = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | 'ATRASO';
export type StatusAula = 'RASCUNHO' | 'PUBLICADA' | 'FINALIZADA';

export interface Aula {
  id: string;
  disciplina_id: string;
  instrutor_id: string;
  pelotao_id: string | null;
  turma: string | null;

  // Dados da aula
  data_aula: string; // DATE
  hora_inicio: string; // TIME
  hora_fim: string | null; // TIME
  tipo: TipoAula;
  titulo: string;
  descricao: string | null;
  local: string | null;

  // Controle de status
  status: StatusAula;
  total_alunos: number;
  total_presentes: number;
  total_ausentes: number;
  total_justificados: number;
  total_atrasos: number;

  // Auditoria
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  publicada_at: string | null;
  publicada_by: string | null;

  // Relações (quando incluídas)
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
  };
  instrutor?: {
    id: string;
    nome: string;
  };
  pelotao?: {
    id: string;
    nome: string;
    turma: string;
  };
}

export interface Presenca {
  id: string;
  aula_id: string;
  aluno_id: string;

  // Status da presença
  status: StatusPresenca;
  observacao: string | null;
  justificativa_url: string | null;
  justificativa_anexo: string | null;

  // Auditoria
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;

  // Relações (quando incluídas)
  aluno?: {
    id: string;
    nome: string;
    matricula: string | null;
    email: string;
  };
  aula?: Aula;
}

export interface ResumoFrequenciaAluno {
  aluno_id: string;
  disciplina_id: string;
  aluno_nome: string;
  aluno_matricula: string | null;
  disciplina_nome: string;
  total_aulas: number;
  total_presentes: number;
  total_ausentes: number;
  total_justificados: number;
  total_atrasos: number;
  percentual_presenca: number;
}

export interface FiltrosChamada {
  data: string;
  turma: string;
  pelotao_id: string;
  disciplina_id: string;
  tipo: TipoAula | 'TODOS';
  instrutor_id: string;
}

export interface DadosChamada {
  aula: Aula;
  presencas: Presenca[];
}
