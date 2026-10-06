import { getWorkspace } from "@/lib/session";
import { roleLabels } from "@/lib/permissions";
import { ShieldCheck } from "lucide-react";
export default async function Settings() {
  const workspace = await getWorkspace();
  if (!workspace) return null;
  return (
    <>
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>Configurações</strong>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU ESPAÇO</span>
          <h1>
            Configurações<span className="hot">.</span>
          </h1>
          <p>Identidade e acesso ao workspace.</p>
        </div>
      </div>
      <section className="settings-panel">
        <ShieldCheck className="hot" size={28} />
        <h2>Seu perfil</h2>
        <dl>
          <div>
            <dt>Nome</dt>
            <dd>{workspace.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{workspace.email}</dd>
          </div>
          <div>
            <dt>Permissão</dt>
            <dd>{roleLabels[workspace.role]}</dd>
          </div>
          <div>
            <dt>Fuso horário</dt>
            <dd>{workspace.timezone}</dd>
          </div>
        </dl>
        <p>
          Alterações de equipe e permissões são realizadas pelo administrador
          durante esta etapa de implantação.
        </p>
      </section>
    </>
  );
}
