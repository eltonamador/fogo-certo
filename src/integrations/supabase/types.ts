export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aulas: {
        Row: {
          anexos: string[] | null
          created_at: string | null
          data_hora_inicio: string
          descricao: string | null
          disciplina_id: string
          duracao_minutos: number | null
          id: string
          instrutor_id: string
          local: string | null
          objetivo: string | null
          tipo: Database["public"]["Enums"]["tipo_aula"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          anexos?: string[] | null
          created_at?: string | null
          data_hora_inicio: string
          descricao?: string | null
          disciplina_id: string
          duracao_minutos?: number | null
          id?: string
          instrutor_id: string
          local?: string | null
          objetivo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_aula"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          anexos?: string[] | null
          created_at?: string | null
          data_hora_inicio?: string
          descricao?: string | null
          disciplina_id?: string
          duracao_minutos?: number | null
          id?: string
          instrutor_id?: string
          local?: string | null
          objetivo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_aula"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          created_at: string | null
          data_hora: string
          descricao: string | null
          disciplina_id: string
          duracao_minutos: number | null
          id: string
          instrutor_id: string
          nota_maxima: number | null
          peso: number
          tempo_min: number
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora: string
          descricao?: string | null
          disciplina_id: string
          duracao_minutos?: number | null
          id?: string
          instrutor_id: string
          nota_maxima?: number | null
          peso?: number
          tempo_min?: number
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string
          descricao?: string | null
          disciplina_id?: string
          duracao_minutos?: number | null
          id?: string
          instrutor_id?: string
          nota_maxima?: number | null
          peso?: number
          tempo_min?: number
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string | null
          disciplina_id: string | null
          fixado: boolean | null
          id: string
          pelotao_id: string | null
          prioridade: Database["public"]["Enums"]["prioridade_aviso"]
          publico: Database["public"]["Enums"]["publico_aviso"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string | null
          disciplina_id?: string | null
          fixado?: boolean | null
          id?: string
          pelotao_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_aviso"]
          publico?: Database["public"]["Enums"]["publico_aviso"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string | null
          disciplina_id?: string | null
          fixado?: boolean | null
          id?: string
          pelotao_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_aviso"]
          publico?: Database["public"]["Enums"]["publico_aviso"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avisos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_pelotao_id_fkey"
            columns: ["pelotao_id"]
            isOneToOne: false
            referencedRelation: "pelotoes"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas: {
        Row: {
          carga_horaria: number
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          carga_horaria?: number
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          carga_horaria?: number
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          aluno_id: string
          arquivo_path: string | null
          comentario: string | null
          created_at: string | null
          data_entrega: string | null
          feedback: string | null
          id: string
          nota: number | null
          status: Database["public"]["Enums"]["status_entrega"]
          tarefa_id: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          arquivo_path?: string | null
          comentario?: string | null
          created_at?: string | null
          data_entrega?: string | null
          feedback?: string | null
          id?: string
          nota?: number | null
          status?: Database["public"]["Enums"]["status_entrega"]
          tarefa_id: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          arquivo_path?: string | null
          comentario?: string | null
          created_at?: string | null
          data_entrega?: string | null
          feedback?: string | null
          id?: string
          nota?: number | null
          status?: Database["public"]["Enums"]["status_entrega"]
          tarefa_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          arquivo_path: string | null
          created_at: string | null
          descricao: string | null
          disciplina_id: string
          id: string
          instrutor_id: string
          tipo: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          arquivo_path?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id: string
          id?: string
          instrutor_id: string
          tipo?: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          arquivo_path?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id?: string
          id?: string
          instrutor_id?: string
          tipo?: Database["public"]["Enums"]["tipo_material"]
          titulo?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      pelotoes: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          turma: string
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          turma: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          turma?: string
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pelotoes_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string | null
          id: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_presenca"]
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_presenca"]
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_presenca"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          matricula: string | null
          nome: string
          pelotao_id: string | null
          status: Database["public"]["Enums"]["status_usuario"]
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          matricula?: string | null
          nome: string
          pelotao_id?: string | null
          status?: Database["public"]["Enums"]["status_usuario"]
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          matricula?: string | null
          nome?: string
          pelotao_id?: string | null
          status?: Database["public"]["Enums"]["status_usuario"]
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_pelotao_id_fkey"
            columns: ["pelotao_id"]
            isOneToOne: false
            referencedRelation: "pelotoes"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes: {
        Row: {
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          alternativas: Json
          avaliacao_id: string
          correta: number
          correta_letra: string | null
          created_at: string | null
          enunciado: string
          id: string
          ordem: number | null
          peso: number | null
        }
        Insert: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativas: Json
          avaliacao_id: string
          correta: number
          correta_letra?: string | null
          created_at?: string | null
          enunciado: string
          id?: string
          ordem?: number | null
          peso?: number | null
        }
        Update: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativas?: Json
          avaliacao_id?: string
          correta?: number
          correta_letra?: string | null
          created_at?: string | null
          enunciado?: string
          id?: string
          ordem?: number | null
          peso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas: {
        Row: {
          aluno_id: string
          avaliacao_id: string
          created_at: string | null
          data_submissao: string | null
          id: string
          nota: number | null
          respostas: Json | null
        }
        Insert: {
          aluno_id: string
          avaliacao_id: string
          created_at?: string | null
          data_submissao?: string | null
          id?: string
          nota?: number | null
          respostas?: Json | null
        }
        Update: {
          aluno_id?: string
          avaliacao_id?: string
          created_at?: string | null
          data_submissao?: string | null
          id?: string
          nota?: number | null
          respostas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          anexos: string[] | null
          created_at: string | null
          descricao: string | null
          disciplina_id: string
          id: string
          instrucoes: string | null
          instrutor_id: string
          prazo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          anexos?: string[] | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id: string
          id?: string
          instrucoes?: string | null
          instrutor_id: string
          prazo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          anexos?: string[] | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id?: string
          id?: string
          instrucoes?: string | null
          instrutor_id?: string
          prazo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ano: number
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      questoes_aluno: {
        Row: {
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          avaliacao_id: string | null
          created_at: string | null
          enunciado: string | null
          id: string | null
          ordem: number | null
          peso: number | null
        }
        Insert: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          avaliacao_id?: string | null
          created_at?: string | null
          enunciado?: string | null
          id?: string | null
          ordem?: number | null
          peso?: number | null
        }
        Update: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          avaliacao_id?: string | null
          created_at?: string | null
          enunciado?: string | null
          id?: string | null
          ordem?: number | null
          peso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_change_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: boolean
      }
      can_toggle_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      toggle_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "instrutor" | "aluno"
      prioridade_aviso: "normal" | "urgente"
      publico_aviso: "geral" | "pelotao" | "disciplina"
      status_entrega: "pendente" | "entregue" | "avaliado" | "atrasado"
      status_presenca: "presente" | "ausente" | "justificado"
      status_usuario: "ativo" | "inativo"
      tipo_aula: "aula" | "simulado" | "avaliacao"
      tipo_material: "pdf" | "video" | "link" | "documento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instrutor", "aluno"],
      prioridade_aviso: ["normal", "urgente"],
      publico_aviso: ["geral", "pelotao", "disciplina"],
      status_entrega: ["pendente", "entregue", "avaliado", "atrasado"],
      status_presenca: ["presente", "ausente", "justificado"],
      status_usuario: ["ativo", "inativo"],
      tipo_aula: ["aula", "simulado", "avaliacao"],
      tipo_material: ["pdf", "video", "link", "documento"],
    },
  },
} as const
