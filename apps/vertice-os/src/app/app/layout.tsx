import { AppShell } from "@/components/app-shell";
import { getWorkspace, requireUser } from "@/lib/session";
import { logout } from "@/app/auth/actions";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await getWorkspace();
  if (!workspace)
    return (
      <main className="access-pending">
        <Brand />
        <h1>Seu acesso está quase pronto.</h1>
        <p>
          Você está autenticado, mas ainda não tem um workspace ativo. Peça ao
          administrador para vincular sua conta à equipe.
        </p>
        <form action={logout}>
          <button className="button button-primary">Sair da conta</button>
        </form>
      </main>
    );
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <AppShell
      workspaceName={workspace.workspaceName}
      name={workspace.name}
      role={workspace.role}
      notifications={data || []}
      notificationsError={!!error}
    >
      {children}
    </AppShell>
  );
}
