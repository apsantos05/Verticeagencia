import { AuthForm } from "@/components/auth-form";
import { supabaseConfig } from "@/lib/env";
export default async function Recover({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
      <h2>
        Vamos te colocar
        <br />
        de volta no fluxo.
      </h2>
      <p className="auth-description">
        Informe seu e-mail para receber um link de recuperação de senha.
      </p>
      {params.expired && (
        <p role="alert" className="notice">
          Link inválido ou expirado. Solicite um novo abaixo.
        </p>
      )}
      {!supabaseConfig() && (
        <p className="notice">
          A recuperação estará disponível após a configuração do ambiente.
        </p>
      )}
      <AuthForm mode="recover" configured={!!supabaseConfig()} />
    </>
  );
}
