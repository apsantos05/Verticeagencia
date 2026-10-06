"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login, recover, resetPassword } from "@/app/auth/actions";
import { Button } from "./ui/button";
export function AuthForm({
  mode,
  configured = true,
}: {
  mode: "login" | "recover" | "reset";
  configured?: boolean;
}) {
  const [state, action, pending] = useActionState(
    mode === "login" ? login : mode === "recover" ? recover : resetPassword,
    { message: "" },
  );
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="auth-form">
      {mode !== "reset" && (
        <label>
          E-mail profissional
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@verticeagencia.com.br"
            required
            maxLength={254}
            disabled={!configured}
          />
        </label>
      )}
      {mode !== "recover" && (
        <label>
          {mode === "reset" ? "Nova senha" : "Senha"}
          <span className="password-wrap">
            <input
              name="password"
              type={visible ? "text" : "password"}
              autoComplete={
                mode === "reset" ? "new-password" : "current-password"
              }
              placeholder={
                mode === "reset"
                  ? "Pelo menos 12 caracteres"
                  : "Sua senha de acesso"
              }
              minLength={mode === "reset" ? 12 : 1}
              maxLength={128}
              required
              disabled={!configured}
            />
            <button
              type="button"
              aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
      )}
      {mode === "reset" && (
        <label>
          Confirme a nova senha
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
          />
        </label>
      )}
      {mode === "login" && (
        <Link href="/recuperar-senha" className="forgot">
          Esqueci minha senha
        </Link>
      )}
      {state.message && (
        <p
          className={state.success ? "notice success" : "notice"}
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
      <Button disabled={pending || !configured} type="submit">
        {pending ? (
          <>
            <LoaderCircle size={18} className="spin" /> Aguarde…
          </>
        ) : (
          <>
            {mode === "login"
              ? "Entrar no workspace"
              : mode === "recover"
                ? "Enviar instruções"
                : "Atualizar senha"}
            <ArrowRight size={18} />
          </>
        )}
      </Button>
      {mode !== "login" && (
        <Link className="back-link" href="/login">
          Voltar para o login
        </Link>
      )}
    </form>
  );
}
