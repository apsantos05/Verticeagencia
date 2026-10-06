import { z } from "zod";
export const emailSchema = z
  .string()
  .trim()
  .email("Informe um e-mail válido.")
  .max(254);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha.").max(128),
});
export const passwordSchema = z
  .object({
    password: z.string().min(12, "Use pelo menos 12 caracteres.").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas precisam ser iguais.",
    path: ["confirm"],
  });
export type AuthState = { message: string; success?: boolean };
