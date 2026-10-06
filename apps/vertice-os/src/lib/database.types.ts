import type { Role } from "./permissions";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
type ReadTable<T> = { Row: T; Insert: never; Update: never; Relationships: [] };
// Typed projection for phase-one queries. Regenerate the full schema with the documented Supabase CLI command as modules expand.
export type Database = {
  public: {
    Tables: {
      profiles: ReadTable<{
        id: string;
        full_name: string;
        avatar_url: string | null;
        created_at: string;
        updated_at: string;
      }>;
      workspace_members: ReadTable<{
        workspace_id: string;
        user_id: string;
        role: Role;
        active: boolean;
        created_at: string;
        updated_at: string;
        created_by: string | null;
      }>;
      workspaces: ReadTable<{
        id: string;
        name: string;
        timezone: string;
        created_at: string;
        updated_at: string;
        created_by: string | null;
      }>;
      notifications: ReadTable<{
        id: string;
        workspace_id: string;
        user_id: string;
        title: string;
        body: string;
        read_at: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      dashboard_summary: { Args: { target: string }; Returns: Json };
    };
    Enums: { app_role: Role };
    CompositeTypes: Record<string, never>;
  };
};
