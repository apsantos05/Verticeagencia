import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/session";
export default async function Reset() {
  await requireUser();
  return (
    <>
      <span className="eyebrow">NOVO COMEÇO</span>
      <h2>
        Defina sua
        <br />
        nova senha.
      </h2>
      <p className="auth-description">
        Use uma senha exclusiva com pelo menos 12 caracteres.
      </p>
      <AuthForm mode="reset" />
    </>
  );
}
