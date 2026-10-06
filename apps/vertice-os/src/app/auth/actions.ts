"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appOrigin, supabaseConfig } from "@/lib/env";
import {
  emailSchema,
  loginSchema,
  passwordSchema,
  type AuthState,
} from "@/lib/auth-validation";

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const result = loginSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return { message: result.error.issues[0].message };
  if (!supabaseConfig())
    return {
      message: "O acesso estará disponível após a configuração do ambiente.",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error)
      return {
        message:
          "Não foi possível entrar. Confira suas credenciais ou tente novamente mais tarde.",
      };
  } catch {
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
  redirect("/app");
}
export async function recover(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { message: email.error.issues[0].message };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${appOrigin()}/auth/callback`,
    });
    if (error)
      return {
        message:
          "Não foi possível solicitar a recuperação. Tente novamente mais tarde.",
      };
    return {
      message:
        "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação.",
      success: true,
    };
  } catch {
    return {
      message:
        "Recuperação indisponível. Entre em contato com o administrador.",
    };
  }
}
export async function resetPassword(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const result = passwordSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return { message: result.error.issues[0].message };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user)
      return { message: "O link expirou. Solicite a recuperação novamente." };
    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
    });
    if (error)
      return {
        message:
          "Não foi possível atualizar a senha. Utilize uma senha diferente ou solicite outro link.",
      };
    await supabase.auth.signOut();
  } catch {
    return { message: "Serviço indisponível. Tente novamente." };
  }
  redirect("/login?updated=1");
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error)
    throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
  redirect("/login");
}
