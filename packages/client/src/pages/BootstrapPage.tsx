import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Settings2, CheckCircle2, AlertTriangle } from "lucide-react";

import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fadeUp } from "./auth/animations";
import {
  GridPattern,
  FormField,
  EyeToggle,
  ServerError,
  PasswordStrength,
} from "./auth/components";

const bootstrapSchema = z
  .object({
    fullName: z.string().min(1, "Le nom complet est requis"),
    email: z.string().min(1, "L'email est requis").email("Adresse email invalide"),
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

type BootstrapFormData = z.infer<typeof bootstrapSchema>;

export default function BootstrapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const form = useForm<BootstrapFormData>({
    resolver: zodResolver(bootstrapSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmation: "" },
    mode: "onBlur",
  });

  const { errors, isSubmitting } = form.formState;
  const watchedPassword = form.watch("password");

  async function onSubmit(data: BootstrapFormData) {
    setServerError(null);
    try {
      await api.post("/bootstrap/init", data);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'initialisation. Veuillez réessayer.",
      );
    }
  }

  const errCls = (has: boolean) => (has ? "border-red-400 focus:ring-red-300" : "");

  if (success) {
    const { fullName, email } = form.getValues();
    return (
      <div className="min-h-dvh bg-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
        <GridPattern />
        <motion.div
          className="w-full max-w-[420px] relative z-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-brand-gold-dark via-brand-gold-light to-brand-blue" />
            <div className="p-8 text-center space-y-5">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 22, delay: 0.1 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 mx-auto"
              >
                <CheckCircle2 size={26} className="text-emerald-600" />
              </motion.div>

              <div>
                <h2 className="text-[15px] font-bold text-brand-gold-dark">
                  {t("bootstrap.successTitle")}
                </h2>
                <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                  {t("bootstrap.successDescription")}
                </p>
              </div>

              <div className="bg-neutral-50 rounded-lg px-4 py-3 text-left space-y-1.5">
                <p className="text-[11px] text-neutral-800">
                  <span className="font-semibold text-brand-gold-dark">
                    {t("bootstrap.successTitulaire")} :
                  </span>{" "}
                  {fullName}
                </p>
                <p className="text-[11px] text-neutral-800">
                  <span className="font-semibold text-brand-gold-dark">
                    {t("bootstrap.email")} :
                  </span>{" "}
                  {email}
                </p>
              </div>

              <Button className="w-full" onClick={() => navigate("/login")}>
                {t("bootstrap.successCta")}
              </Button>
            </div>
          </div>
          <p className="text-center text-neutral-400 text-[10px] mt-4 tracking-wide uppercase">
            Le Prestigieux — Usage interne uniquement
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
      <GridPattern />

      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center mb-7">
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-gold-dark shadow-lg mb-4 relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 to-transparent" />
            <Settings2 className="text-white relative z-10" size={22} strokeWidth={1.75} />
          </motion.div>
          <h1 className="text-xl font-bold text-brand-gold-dark tracking-tight">PrestiX</h1>
          <p className="text-neutral-500 text-[11px] mt-0.5 italic leading-relaxed">
            Une autre idée du voyage
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-brand-gold-dark via-brand-gold-light to-brand-blue" />

          <div className="px-6 pt-5">
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3">
              <AlertTriangle size={13} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-800 font-semibold text-[11px]">
                  {t("bootstrap.bannerTitle")}
                </p>
                <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                  {t("bootstrap.bannerDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                id={fullNameId}
                label={t("bootstrap.fullName")}
                error={errors.fullName?.message}
                required
              >
                <Input
                  id={fullNameId}
                  {...form.register("fullName")}
                  autoFocus
                  autoComplete="name"
                  aria-invalid={!!errors.fullName}
                  className={errCls(!!errors.fullName)}
                />
              </FormField>

              <FormField
                id={emailId}
                label={t("bootstrap.email")}
                error={errors.email?.message}
                required
              >
                <Input
                  id={emailId}
                  {...form.register("email")}
                  type="email"
                  inputMode="email"
                  placeholder="owner@leprestigieux.ga"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={errCls(!!errors.email)}
                />
              </FormField>

              <FormField
                id={passwordId}
                label={t("auth.password")}
                error={errors.password?.message}
                required
              >
                <div className="relative">
                  <Input
                    id={passwordId}
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    className={cn(errCls(!!errors.password), "pr-10")}
                  />
                  <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </FormField>

              <AnimatePresence>
                {watchedPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PasswordStrength password={watchedPassword} />
                  </motion.div>
                )}
              </AnimatePresence>

              <FormField
                id={confirmId}
                label={t("auth.confirmPassword")}
                error={errors.confirmation?.message}
                required
              >
                <div className="relative">
                  <Input
                    id={confirmId}
                    {...form.register("confirmation")}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmation}
                    className={cn(errCls(!!errors.confirmation), "pr-10")}
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                </div>
              </FormField>

              <ServerError message={serverError} />

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("bootstrap.submitting")}
                  </>
                ) : (
                  t("bootstrap.submit")
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-neutral-400 text-[10px] mt-4 tracking-wide uppercase">
          Le Prestigieux — Usage interne uniquement
        </p>
      </motion.div>
    </div>
  );
}
