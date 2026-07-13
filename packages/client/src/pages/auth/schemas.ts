import { z } from "zod";

export const loginSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("otp"),
    email: z.string().min(1, "L'email est requis").email("Adresse email invalide"),
    otp: z
      .string()
      .length(6, "Le code OTP doit contenir exactement 6 chiffres")
      .regex(/^\d+$/, "Uniquement des chiffres"),
    password: z.string().optional(),
  }),
  z.object({
    mode: z.literal("password"),
    email: z.string().min(1, "L'email est requis").email("Adresse email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
    otp: z.string().optional(),
  }),
]);

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
    confirmation: z.string().min(1, "La confirmation est requise"),
  })
  .refine((d) => d.password === d.confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmation"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
export type Etape = "login" | "set-password";
