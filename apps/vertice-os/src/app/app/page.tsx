import { getWorkspace, requireUser } from "@/lib/session";
import { dashboardSchema } from "@/lib/dashboard";
import { DashboardView } from "@/components/dashboard-view";
export default async function Dashboard() {
  const workspace = await getWorkspace();
  if (!workspace) return null;
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("dashboard_summary", {
    target: workspace.id,
  });
  if (error) throw new Error("Não foi possível carregar os indicadores.");
  const parsed = dashboardSchema.safeParse(data);
  if (!parsed.success)
    throw new Error(
      "Os indicadores estão indisponíveis. Verifique as migrations.",
    );
  return (
    <DashboardView
      data={parsed.data}
      name={workspace.name}
      role={workspace.role}
      now={new Date().toISOString()}
    />
  );
}
