import { AuthForm } from "@/components/auth-form";
import { supabaseConfig } from "@/lib/env";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const configured = !!supabaseConfig();
  const params = await searchParams;
  return (
    <>
      <span className="eyebrow">VÉRTICE WORKSPACE</span>
      <h2>
        Seu próximo nível
        <br />
        começa aqui.
      </h2>
      <p className="auth-description">
        Entre para acompanhar o que está acontecendo na agência.
      </p>
      {!configured && (
        <p className="notice" role="status">
          Ambiente aguardando configuração. O administrador precisa conectar o
          Supabase para liberar o acesso.
        </p>
      )}
      {params.updated === "1" && (
        <p className="notice success" role="status">
          Senha atualizada. Entre com sua nova senha.
        </p>
      )}
      <AuthForm mode="login" configured={configured} />
      <div className="invite-note">
        <span className="orange-dot" /> Ainda não tem acesso? Fale com o
        administrador.
      </div>
    </>
  );
}
