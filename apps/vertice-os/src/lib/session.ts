import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseConfig } from "./env";
export const requireUser = cache(async () => {
  if (!supabaseConfig()) redirect("/login");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});
export const getWorkspace = cache(async () => {
  const { supabase, user } = await requireUser();
  const [membership, profile] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  if (membership.error || profile.error)
    throw new Error("Não foi possível consultar seu acesso.");
  if (!membership.data) return null;
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, timezone")
    .eq("id", membership.data.workspace_id)
    .single();
  if (error) throw new Error("Não foi possível carregar o workspace.");
  return {
    ...workspace,
    workspaceName: workspace.name,
    role: membership.data.role,
    userId: user.id,
    name: profile.data?.full_name || "Equipe Vértice",
    email: user.email || "",
  };
});
