export type TipoAlerta = 'IMEDIATO' | 'LIMIAR';
export type SeveridadeAlerta = 'INFO' | 'ALERTA' | 'CRITICO';

export interface ConfigFrequencia {
  id: string;
  turma_id: string;
  disciplina_id: string | null;
  limite_alerta: number;
  limite_critico: number;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;

  // Relações (quando incluídas)
  turma?: {
    id: string;
    nome: string;
  };
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface Alerta {
  id: string;
  aluno_id: string;
  pelotao_id: string | null;
  turma_id: string | null;
  disciplina_id: string | null;
  aula_id: string | null;
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  motivo: string;
  contagem_faltas: number | null;
  instrutor_id: string | null;
  resolvido: boolean;
  resolvido_por: string | null;
  resolvido_em: string | null;
  observacao_resolucao: string | null;
  created_at: string;
  created_by: string | null;

  // Relações (quando incluídas)
  aluno?: {
    id: string;
    nome: string;
    matricula: string | null;
    email: string;
  };
  pelotao?: {
    id: string;
    nome: string;
    turma: string;
  };
  turma?: {
    id: string;
    nome: string;
  };
  disciplina?: {
    id: string;
    nome: string;
    codigo: string;
  };
  aula?: {
    id: string;
    titulo: string;
    data_aula: string;
    hora_inicio: string;
  };
  instrutor?: {
    id: string;
    nome: string;
  };
  resolvido_por_usuario?: {
    id: string;
    nome: string;
  };
}

export interface Notificacao {
  id: string;
  user_id: string;
  alerta_id: string | null;
  titulo: string;
  corpo: string | null;
  url: string | null;
  lida: boolean;
  lida_em: string | null;
  created_at: string;

  // Relações (quando incluídas)
  alerta?: Alerta;
}

export interface FiltrosAlertas {
  turma_id: string;
  pelotao_id: string;
  disciplina_id: string;
  severidade: SeveridadeAlerta | 'TODOS';
  tipo: TipoAlerta | 'TODOS';
  resolvido: 'sim' | 'nao' | 'todos';
  data_inicio: string;
  data_fim: string;
  aluno_id: string;
}

export interface ResumoAlertas {
  total: number;
  imediatos: number;
  limiares: number;
  info: number;
  alerta: number;
  critico: number;
  nao_resolvidos: number;
}
