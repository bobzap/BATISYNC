export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          number: string
          site_manager: string | null
          ctx_manager: string | null
          cm_ce: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          number: string
          site_manager?: string | null
          ctx_manager?: string | null
          cm_ce?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          number?: string
          site_manager?: string | null
          ctx_manager?: string | null
          cm_ce?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      personnel: {
        Row: {
          id: string
          nom: string
          role: string
          matricule: string | null
          equipe: string | null
          heures_presence: number
          created_at: string
          updated_at: string
          project_id: string | null
        }
        Insert: {
          id?: string
          nom: string
          role: string
          matricule?: string | null
          equipe?: string | null
          heures_presence?: number
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
        Update: {
          id?: string
          nom?: string
          role?: string
          matricule?: string | null
          equipe?: string | null
          heures_presence?: number
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
      }
      machines: {
        Row: {
          id: string
          project_id: string
          nom: string
          type: string
          numero_materiel: string
          entreprise: string
          quantite: number
          remarques: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          nom: string
          type: string
          numero_materiel: string
          entreprise: string
          quantite?: number
          remarques?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          nom?: string
          type?: string
          numero_materiel?: string
          entreprise?: string
          quantite?: number
          remarques?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}