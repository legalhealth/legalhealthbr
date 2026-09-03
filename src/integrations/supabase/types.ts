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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_items_done: {
        Row: {
          done: boolean
          id: string
          item_key: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          done?: boolean
          id?: string
          item_key: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          done?: boolean
          id?: string
          item_key?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      action_plans: {
        Row: {
          created_at: string
          id: string
          prioridades: Json | null
          result_id: string
          resumo: string | null
          status: string
          user_id: string
          versao: number
        }
        Insert: {
          created_at?: string
          id?: string
          prioridades?: Json | null
          result_id: string
          resumo?: string | null
          status?: string
          user_id: string
          versao?: number
        }
        Update: {
          created_at?: string
          id?: string
          prioridades?: Json | null
          result_id?: string
          resumo?: string | null
          status?: string
          user_id?: string
          versao?: number
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          content: string
          created_at: string
          id: string
          origem: string
          status: string
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          origem?: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          origem?: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          source: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chatbot_public_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_public_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chatbot_public_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_public_sessions: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          session_key: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          session_key: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          session_key?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          analisado_em: string | null
          analise: Json | null
          created_at: string
          id: string
          mime: string | null
          nome: string
          size_bytes: number | null
          storage_path: string
          tag: string
          texto: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analisado_em?: string | null
          analise?: Json | null
          created_at?: string
          id?: string
          mime?: string | null
          nome: string
          size_bytes?: number | null
          storage_path: string
          tag?: string
          texto?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analisado_em?: string | null
          analise?: Json | null
          created_at?: string
          id?: string
          mime?: string | null
          nome?: string
          size_bytes?: number | null
          storage_path?: string
          tag?: string
          texto?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_docs: {
        Row: {
          conteudo: string | null
          contexto: Json | null
          created_at: string
          id: string
          origem: string | null
          status: string
          tipo: string | null
          titulo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          contexto?: Json | null
          created_at?: string
          id?: string
          origem?: string | null
          status?: string
          tipo?: string | null
          titulo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string | null
          contexto?: Json | null
          created_at?: string
          id?: string
          origem?: string | null
          status?: string
          tipo?: string | null
          titulo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      juriscore_results: {
        Row: {
          answers: Json | null
          by_pillar: Json | null
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          by_pillar?: Json | null
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          by_pillar?: Json | null
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      legal_qa: {
        Row: {
          busca: unknown
          categoria: string
          created_at: string
          fundamentacao: string[]
          id: string
          pergunta: string
          pilar: string | null
          resposta: string
          status: string
          tags: string[]
          updated_at: string
          usos: number
          variacoes: string[]
        }
        Insert: {
          busca?: unknown
          categoria?: string
          created_at?: string
          fundamentacao?: string[]
          id?: string
          pergunta: string
          pilar?: string | null
          resposta: string
          status?: string
          tags?: string[]
          updated_at?: string
          usos?: number
          variacoes?: string[]
        }
        Update: {
          busca?: unknown
          categoria?: string
          created_at?: string
          fundamentacao?: string[]
          id?: string
          pergunta?: string
          pilar?: string | null
          resposta?: string
          status?: string
          tags?: string[]
          updated_at?: string
          usos?: number
          variacoes?: string[]
        }
        Relationships: []
      }
      legal_qa_lacunas: {
        Row: {
          created_at: string
          id: string
          ocorrencias: number
          origem: string
          pergunta: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ocorrencias?: number
          origem?: string
          pergunta: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ocorrencias?: number
          origem?: string
          pergunta?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_reminders: {
        Row: {
          channel: string
          created_at: string
          due_date: string
          id: string
          offset_days: number
          pilar: string | null
          plan_id: string
          priority_index: number
          read_at: string | null
          risco: string
          sent_at: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          due_date: string
          id?: string
          offset_days: number
          pilar?: string | null
          plan_id: string
          priority_index: number
          read_at?: string | null
          risco?: string
          sent_at?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          due_date?: string
          id?: string
          offset_days?: number
          pilar?: string | null
          plan_id?: string
          priority_index?: number
          read_at?: string | null
          risco?: string
          sent_at?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_reminders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          biometria: boolean
          cidade: string | null
          clinica: string | null
          created_at: string
          crm: string | null
          email_alerts: boolean
          especialidade: string | null
          id: string
          new_jurisprudence: boolean
          nome: string | null
          offline: boolean
          plano: string
          push: boolean
          risk_notifications: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          biometria?: boolean
          cidade?: string | null
          clinica?: string | null
          created_at?: string
          crm?: string | null
          email_alerts?: boolean
          especialidade?: string | null
          id?: string
          new_jurisprudence?: boolean
          nome?: string | null
          offline?: boolean
          plano?: string
          push?: boolean
          risk_notifications?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          biometria?: boolean
          cidade?: string | null
          clinica?: string | null
          created_at?: string
          crm?: string | null
          email_alerts?: boolean
          especialidade?: string | null
          id?: string
          new_jurisprudence?: boolean
          nome?: string | null
          offline?: boolean
          plano?: string
          push?: boolean
          risk_notifications?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      revisao_comentarios: {
        Row: {
          autor: string
          conteudo: string
          created_at: string
          id: string
          papel: string
          revisao_id: string
        }
        Insert: {
          autor: string
          conteudo: string
          created_at?: string
          id?: string
          papel?: string
          revisao_id: string
        }
        Update: {
          autor?: string
          conteudo?: string
          created_at?: string
          id?: string
          papel?: string
          revisao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisao_comentarios_revisao_id_fkey"
            columns: ["revisao_id"]
            isOneToOne: false
            referencedRelation: "revisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      revisao_tokens: {
        Row: {
          created_at: string
          expires_at: string
          first_opened_at: string | null
          id: string
          opens: number
          revisao_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          first_opened_at?: string | null
          id?: string
          opens?: number
          revisao_id: string
          revoked_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          first_opened_at?: string | null
          id?: string
          opens?: number
          revisao_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisao_tokens_revisao_id_fkey"
            columns: ["revisao_id"]
            isOneToOne: false
            referencedRelation: "revisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      revisoes: {
        Row: {
          advogado_email: string
          advogado_nome: string
          advogado_oab: string | null
          concluido_em: string | null
          created_at: string
          doc_id: string
          document_ids: string[]
          enviado_em: string
          id: string
          mensagem: string | null
          parecer: string | null
          parecer_em: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advogado_email: string
          advogado_nome: string
          advogado_oab?: string | null
          concluido_em?: string | null
          created_at?: string
          doc_id: string
          document_ids?: string[]
          enviado_em?: string
          id?: string
          mensagem?: string | null
          parecer?: string | null
          parecer_em?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advogado_email?: string
          advogado_nome?: string
          advogado_oab?: string | null
          concluido_em?: string | null
          created_at?: string
          doc_id?: string
          document_ids?: string[]
          enviado_em?: string
          id?: string
          mensagem?: string | null
          parecer?: string | null
          parecer_em?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "generated_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_legal_qa: {
        Args: { consulta: string; limite?: number }
        Returns: {
          categoria: string
          fundamentacao: string[]
          id: string
          pergunta: string
          pilar: string
          resposta: string
          score: number
          tags: string[]
        }[]
      }
      registrar_lacuna_legal_qa: {
        Args: { origem_in?: string; texto: string }
        Returns: undefined
      }
      registrar_uso_legal_qa: { Args: { qa_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "medico" | "advogado" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["medico", "advogado", "admin"],
    },
  },
} as const
