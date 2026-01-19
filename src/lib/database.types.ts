export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      archived_judges_20260119: {
        Row: {
          id: string;
          name: string;
          pin: string;
          program_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          pin: string;
          program_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          pin?: string;
          program_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "judges_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "archived_programs_20260119";
            referencedColumns: ["id"];
          },
        ];
      };
      archived_programs_20260119: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          results_locked: boolean;
          rules: Json;
          state: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          results_locked?: boolean;
          rules?: Json;
          state?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          results_locked?: boolean;
          rules?: Json;
          state?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          chest_number: string | null;
          created_at: string | null;
          id: string;
          name: string;
          team_id: string | null;
          year: string | null;
          department: string | null;
        };
        Insert: {
          chest_number?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          team_id?: string | null;
          year?: string | null;
          department?: string | null;
        };
        Update: {
          chest_number?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          team_id?: string | null;
          year?: string | null;
          department?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string | null;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string | null;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      program_judges: {
        Row: {
          id: string;
          judge_id: string;
          program_id: string;
        };
        Insert: {
          id?: string;
          judge_id: string;
          program_id: string;
        };
        Update: {
          id?: string;
          judge_id?: string;
          program_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "program_judges_judge_id_fkey";
            columns: ["judge_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_judges_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      program_participant_members: {
        Row: {
          id: string;
          program_participant_id: string;
          candidate_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          program_participant_id: string;
          candidate_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          program_participant_id?: string;
          candidate_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_participant_members_program_participant_id_fkey";
            columns: ["program_participant_id"];
            isOneToOne: false;
            referencedRelation: "program_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_participant_members_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      program_participants: {
        Row: {
          candidate_id: string | null;
          created_at: string | null;
          id: string;
          participant_no: string | null;
          program_id: string;
          rank: number | null;
          status: string | null;
          team_id: string | null;
          total_score: number | null;
        };
        Insert: {
          candidate_id?: string | null;
          created_at?: string | null;
          id?: string;
          participant_no?: string | null;
          program_id: string;
          rank?: number | null;
          status?: string | null;
          team_id?: string | null;
          total_score?: number | null;
        };
        Update: {
          candidate_id?: string | null;
          created_at?: string | null;
          id?: string;
          participant_no?: string | null;
          program_id?: string;
          rank?: number | null;
          status?: string | null;
          team_id?: string | null;
          total_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_participants_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_participants_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_participants_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      program_rules: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          max_score: number;
          name: string;
          order_index: number | null;
          program_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          max_score: number;
          name: string;
          order_index?: number | null;
          program_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          max_score?: number;
          name?: string;
          order_index?: number | null;
          program_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "program_rules_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          best_of_judge_count: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          max_score_per_judge: number | null;
          name: string;
          participant_type: Database["public"]["Enums"]["participant_type"];
          status: Database["public"]["Enums"]["program_status"];
        };
        Insert: {
          best_of_judge_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          max_score_per_judge?: number | null;
          name: string;
          participant_type?: Database["public"]["Enums"]["participant_type"];
          status?: Database["public"]["Enums"]["program_status"];
        };
        Update: {
          best_of_judge_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          max_score_per_judge?: number | null;
          name?: string;
          participant_type?: Database["public"]["Enums"]["participant_type"];
          status?: Database["public"]["Enums"]["program_status"];
        };
        Relationships: [];
      };
      scores: {
        Row: {
          created_at: string | null;
          id: string;
          judge_id: string;
          participant_id: string;
          program_id: string;
          rule_id: string;
          score_value: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          judge_id: string;
          participant_id: string;
          program_id: string;
          rule_id: string;
          score_value: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          judge_id?: string;
          participant_id?: string;
          program_id?: string;
          rule_id?: string;
          score_value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "scores_judge_id_fkey";
            columns: ["judge_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scores_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "program_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scores_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scores_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "program_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          name: string;
          total_points: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          total_points?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          total_points?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      participant_type: "individual" | "team";
      program_status: "upcoming" | "live" | "completed";
      user_role: "admin" | "judge";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types removed to fix build error.
// If needed, regenerate types using supabase gen types typescript
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
