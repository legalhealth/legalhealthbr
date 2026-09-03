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
      ai_answer_audit: {
        Row: {
          base_snapshot: string
          citacoes: Json | null
          created_at: string
          exige_advogado: boolean
          fonte: string
          id: string
          nivel_risco: Database["public"]["Enums"]["legal_risk_level"] | null
          origem: string
          pergunta: string
          qa_id: string | null
          user_id: string | null
          version_ids: string[]
        }
        Insert: {
          base_snapshot?: string
          citacoes?: Json | null
          created_at?: string
          exige_advogado?: boolean
          fonte?: string
          id?: string
          nivel_risco?: Database["public"]["Enums"]["legal_risk_level"] | null
          origem?: string
          pergunta: string
          qa_id?: string | null
          user_id?: string | null
          version_ids?: string[]
        }
        Update: {
          base_snapshot?: string
          citacoes?: Json | null
          created_at?: string
          exige_advogado?: boolean
          fonte?: string
          id?: string
          nivel_risco?: Database["public"]["Enums"]["legal_risk_level"] | null
          origem?: string
          pergunta?: string
          qa_id?: string | null
          user_id?: string | null
          version_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "ai_answer_audit_qa_id_fkey"
            columns: ["qa_id"]
            isOneToOne: false
            referencedRelation: "legal_qa"
            referencedColumns: ["id"]
          },
        ]
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
      ambassador_applications: {
        Row: {
          aceite_regulamento: boolean
          cidade: string | null
          ciencia_nao_substitui_advogado: boolean
          comunidade_tamanho: string | null
          consentimento_contato: boolean
          created_at: string
          email: string
          estado: string
          id: string
          link_profissional: string | null
          motivo: string
          nome: string
          profissao: string
          status: string
          tipo_atuacao: string | null
        }
        Insert: {
          aceite_regulamento?: boolean
          cidade?: string | null
          ciencia_nao_substitui_advogado?: boolean
          comunidade_tamanho?: string | null
          consentimento_contato?: boolean
          created_at?: string
          email: string
          estado: string
          id?: string
          link_profissional?: string | null
          motivo: string
          nome: string
          profissao: string
          status?: string
          tipo_atuacao?: string | null
        }
        Update: {
          aceite_regulamento?: boolean
          cidade?: string | null
          ciencia_nao_substitui_advogado?: boolean
          comunidade_tamanho?: string | null
          consentimento_contato?: boolean
          created_at?: string
          email?: string
          estado?: string
          id?: string
          link_profissional?: string | null
          motivo?: string
          nome?: string
          profissao?: string
          status?: string
          tipo_atuacao?: string | null
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
      legal_change_alerts: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          notified_at: string | null
          official_url: string | null
          read_at: string | null
          source_id: string
          tipo: string
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          notified_at?: string | null
          official_url?: string | null
          read_at?: string | null
          source_id: string
          tipo: string
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          notified_at?: string | null
          official_url?: string | null
          read_at?: string | null
          source_id?: string
          tipo?: string
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      legal_chunks: {
        Row: {
          artigo: string | null
          busca: unknown
          contexto_aplicacao: string | null
          created_at: string
          excecoes: string | null
          exige_advogado: boolean
          id: string
          nivel_risco: Database["public"]["Enums"]["legal_risk_level"]
          ordem: number
          pilar: string | null
          secao: string | null
          source_uuid: string
          temas: string[]
          termos_juridicos: string[]
          termos_medicos: string[]
          texto: string
          updated_at: string
          version_id: string
        }
        Insert: {
          artigo?: string | null
          busca?: unknown
          contexto_aplicacao?: string | null
          created_at?: string
          excecoes?: string | null
          exige_advogado?: boolean
          id?: string
          nivel_risco?: Database["public"]["Enums"]["legal_risk_level"]
          ordem?: number
          pilar?: string | null
          secao?: string | null
          source_uuid: string
          temas?: string[]
          termos_juridicos?: string[]
          termos_medicos?: string[]
          texto: string
          updated_at?: string
          version_id: string
        }
        Update: {
          artigo?: string | null
          busca?: unknown
          contexto_aplicacao?: string | null
          created_at?: string
          excecoes?: string | null
          exige_advogado?: boolean
          id?: string
          nivel_risco?: Database["public"]["Enums"]["legal_risk_level"]
          ordem?: number
          pilar?: string | null
          secao?: string | null
          source_uuid?: string
          temas?: string[]
          termos_juridicos?: string[]
          termos_medicos?: string[]
          texto?: string
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_chunks_source_uuid_fkey"
            columns: ["source_uuid"]
            isOneToOne: false
            referencedRelation: "legal_source_alerts"
            referencedColumns: ["source_uuid"]
          },
          {
            foreignKeyName: "legal_chunks_source_uuid_fkey"
            columns: ["source_uuid"]
            isOneToOne: false
            referencedRelation: "legal_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_chunks_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "legal_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_ingest_runs: {
        Row: {
          chunks: number
          created_at: string
          executado_por: string | null
          id: string
          mensagem: string | null
          official_url: string | null
          resultado: string
          source_id: string
          tamanho_texto: number
          version: number | null
        }
        Insert: {
          chunks?: number
          created_at?: string
          executado_por?: string | null
          id?: string
          mensagem?: string | null
          official_url?: string | null
          resultado?: string
          source_id: string
          tamanho_texto?: number
          version?: number | null
        }
        Update: {
          chunks?: number
          created_at?: string
          executado_por?: string | null
          id?: string
          mensagem?: string | null
          official_url?: string | null
          resultado?: string
          source_id?: string
          tamanho_texto?: number
          version?: number | null
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
      legal_qa_fontes: {
        Row: {
          artigo: string | null
          created_at: string
          id: string
          qa_id: string
          version_id: string
        }
        Insert: {
          artigo?: string | null
          created_at?: string
          id?: string
          qa_id: string
          version_id: string
        }
        Update: {
          artigo?: string | null
          created_at?: string
          id?: string
          qa_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_qa_fontes_qa_id_fkey"
            columns: ["qa_id"]
            isOneToOne: false
            referencedRelation: "legal_qa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_qa_fontes_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "legal_source_versions"
            referencedColumns: ["id"]
          },
        ]
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
      legal_source_versions: {
        Row: {
          change_reason: string | null
          content: string
          content_hash: string
          created_at: string
          effective_from: string | null
          effective_until: string | null
          id: string
          published: boolean
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_uuid: string
          status: Database["public"]["Enums"]["legal_source_status"]
          supersedes_version_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          content: string
          content_hash?: string
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          published?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_uuid: string
          status?: Database["public"]["Enums"]["legal_source_status"]
          supersedes_version_id?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          change_reason?: string | null
          content?: string
          content_hash?: string
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          published?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_uuid?: string
          status?: Database["public"]["Enums"]["legal_source_status"]
          supersedes_version_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_source_versions_source_uuid_fkey"
            columns: ["source_uuid"]
            isOneToOne: false
            referencedRelation: "legal_source_alerts"
            referencedColumns: ["source_uuid"]
          },
          {
            foreignKeyName: "legal_source_versions_source_uuid_fkey"
            columns: ["source_uuid"]
            isOneToOne: false
            referencedRelation: "legal_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_source_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "legal_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_sources: {
        Row: {
          authority_level: number
          created_at: string
          current_version_id: string | null
          id: string
          issuing_body: string
          jurisdiction: string
          last_checked_at: string | null
          number: string | null
          official_url: string | null
          pilar: string | null
          publication_date: string | null
          responsavel_juridico: string | null
          responsavel_medico: string | null
          responsavel_produto: string | null
          responsavel_tecnico: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["legal_source_type"]
          status: Database["public"]["Enums"]["legal_source_status"]
          temas: string[]
          title: string
          updated_at: string
        }
        Insert: {
          authority_level: number
          created_at?: string
          current_version_id?: string | null
          id?: string
          issuing_body: string
          jurisdiction?: string
          last_checked_at?: string | null
          number?: string | null
          official_url?: string | null
          pilar?: string | null
          publication_date?: string | null
          responsavel_juridico?: string | null
          responsavel_medico?: string | null
          responsavel_produto?: string | null
          responsavel_tecnico?: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["legal_source_type"]
          status?: Database["public"]["Enums"]["legal_source_status"]
          temas?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          authority_level?: number
          created_at?: string
          current_version_id?: string | null
          id?: string
          issuing_body?: string
          jurisdiction?: string
          last_checked_at?: string | null
          number?: string | null
          official_url?: string | null
          pilar?: string | null
          publication_date?: string | null
          responsavel_juridico?: string | null
          responsavel_medico?: string | null
          responsavel_produto?: string | null
          responsavel_tecnico?: string | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["legal_source_type"]
          status?: Database["public"]["Enums"]["legal_source_status"]
          temas?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_sources_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "legal_source_versions"
            referencedColumns: ["id"]
          },
        ]
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
      legal_source_alerts: {
        Row: {
          alerta: string | null
          source_id: string | null
          source_uuid: string | null
          status: Database["public"]["Enums"]["legal_source_status"] | null
          title: string | null
        }
        Relationships: []
      }
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
      match_legal_chunks: {
        Args: {
          autoridade_max?: number
          consulta: string
          limite?: number
          pilar_in?: string
        }
        Returns: {
          artigo: string
          authority_level: number
          chunk_id: string
          effective_from: string
          exige_advogado: boolean
          issuing_body: string
          nivel_risco: Database["public"]["Enums"]["legal_risk_level"]
          number: string
          official_url: string
          pilar: string
          score: number
          secao: string
          source_id: string
          texto: string
          title: string
          version: number
          version_id: string
        }[]
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
      registrar_auditoria_resposta: {
        Args: {
          citacoes_in: Json
          exige_advogado_in: boolean
          fonte_in: string
          nivel_risco_in: Database["public"]["Enums"]["legal_risk_level"]
          origem_in: string
          pergunta_in: string
          qa_id_in: string
          user_id_in: string
          version_ids_in: string[]
        }
        Returns: undefined
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
      legal_risk_level: "baixo" | "medio" | "alto"
      legal_source_status:
        | "vigente"
        | "alterada"
        | "revogada"
        | "suspensa"
        | "em_revisao"
      legal_source_type:
        | "constituicao"
        | "lei"
        | "decreto"
        | "resolucao"
        | "portaria"
        | "parecer"
        | "decisao"
        | "guia"
        | "doutrina"
        | "editorial"
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
      legal_risk_level: ["baixo", "medio", "alto"],
      legal_source_status: [
        "vigente",
        "alterada",
        "revogada",
        "suspensa",
        "em_revisao",
      ],
      legal_source_type: [
        "constituicao",
        "lei",
        "decreto",
        "resolucao",
        "portaria",
        "parecer",
        "decisao",
        "guia",
        "doutrina",
        "editorial",
      ],
    },
  },
} as const
