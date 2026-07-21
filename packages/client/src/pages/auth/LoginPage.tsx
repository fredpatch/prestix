import { useId, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";

import { authApi } from "@/lib/auth.api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { loginSchema, setPasswordSchema } from "./schemas";
import type { LoginFormData, SetPasswordFormData, Etape } from "./schemas";
import { slideVariants, slideTx, fadeUp } from "./animations";
import {
  GridPattern,
  StepTab,
  ModeTab,
  FormField,
  EyeToggle,
  ServerError,
  PasswordStrength,
} from "./components/index";
import { useAuth } from "@/App";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [etape, setEtape] = useState<Etape>("login");
  const [direction, setDirection] = useState(1);
  const [premiereConnexion, setPremiereConnexion] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailId = useId();
  const otpId = useId();
  const passwordId = useId();
  const newPassId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (sessionStorage.getItem("session_expiree")) {
      sessionStorage.removeItem("session_expiree");
      setServerError("Votre session a expiré. Veuillez vous reconnecter.");
    }
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mode: "password", email: "", password: "", otp: "" },
  });

  const passwordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmation: "" },
    mode: "onChange",
  });

  const watchedPassword = passwordForm.watch("password");

  function toggleMode(firstLogin: boolean) {
    setPremiereConnexion(firstLogin);
    setServerError(null);
    loginForm.clearErrors();
    loginForm.reset({
      mode: firstLogin ? "otp" : "password",
      email: loginForm.getValues("email"),
      password: "",
      otp: "",
    });
  }

  async function onLoginSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      const res = await authApi.login(
        data.email,
        data.mode === "otp" ? data.otp : undefined,
        data.mode === "password" ? data.password : undefined,
      );
      if (res.data.firstLogin) {
        setDirection(1);
        setEtape("set-password");
      } else {
        setUser(res.data.user);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Identifiants invalides. Veuillez réessayer.",
      );
    }
  }

  async function onSetPasswordSubmit(data: SetPasswordFormData) {
    setServerError(null);
    try {
      const res = await authApi.setPassword(data.password, data.confirmation);
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la définition du mot de passe.",
      );
    }
  }

  function backToLogin() {
    setDirection(-1);
    setEtape("login");
    setServerError(null);
    passwordForm.reset();
  }

  return (
    <div className="min-h-dvh bg-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
      <GridPattern />

      <motion.div
        className="w-full max-w-[370px] relative z-10"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center mb-7">
          <motion.img
            src="/brand/logo.jpg"
            alt="Le Prestigieux"
            className="h-16 w-auto mx-auto mb-3 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          />
          <h1 className="text-xl font-bold text-brand-gold-dark tracking-tight">PrestiX</h1>
          <p className="text-neutral-500 text-[11px] mt-0.5 italic leading-relaxed">
            Une autre idée du voyage
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-brand-gold-dark via-brand-gold-light to-brand-blue" />

          <div className="flex border-b border-neutral-200">
            <StepTab
              active={etape === "login"}
              completed={etape === "set-password"}
              step={1}
              label="Connexion"
            />
            <div className="w-px bg-neutral-200" />
            <StepTab
              active={etape === "set-password"}
              completed={false}
              step={2}
              label="Mot de passe"
            />
          </div>

          <div className="p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {etape === "login" && (
                <motion.div
                  key="login"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTx}
                >
                  <LoginStep
                    t={t}
                    loginForm={loginForm}
                    premiereConnexion={premiereConnexion}
                    serverError={serverError}
                    showPassword={showPassword}
                    emailId={emailId}
                    otpId={otpId}
                    passwordId={passwordId}
                    onToggleMode={toggleMode}
                    onTogglePassword={() => setShowPassword((v) => !v)}
                    onSubmit={onLoginSubmit}
                  />
                </motion.div>
              )}

              {etape === "set-password" && (
                <motion.div
                  key="set-password"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTx}
                >
                  <SetPasswordStep
                    t={t}
                    passwordForm={passwordForm}
                    watchedPassword={watchedPassword}
                    serverError={serverError}
                    showNew={showNew}
                    showConfirm={showConfirm}
                    newPassId={newPassId}
                    confirmId={confirmId}
                    onToggleNew={() => setShowNew((v) => !v)}
                    onToggleConfirm={() => setShowConfirm((v) => !v)}
                    onSubmit={onSetPasswordSubmit}
                    onBack={backToLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-neutral-400 text-[10px] mt-4 tracking-wide uppercase">
          Le Prestigieux - Usage interne uniquement
        </p>
      </motion.div>
    </div>
  );
}

interface LoginStepProps {
  t: (key: string) => string;
  loginForm: ReturnType<typeof useForm<LoginFormData>>;
  premiereConnexion: boolean;
  serverError: string | null;
  showPassword: boolean;
  emailId: string;
  otpId: string;
  passwordId: string;
  onToggleMode: (firstLogin: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: (data: LoginFormData) => Promise<void>;
}

function LoginStep({
  t,
  loginForm,
  premiereConnexion,
  serverError,
  showPassword,
  emailId,
  otpId,
  passwordId,
  onToggleMode,
  onTogglePassword,
  onSubmit,
}: LoginStepProps) {
  const errors = loginForm.formState.errors;

  return (
    <>
      <p className="text-[13px] font-semibold text-brand-gold-dark mb-5">{t("auth.title")}</p>

      <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id={emailId} label={t("auth.email")} error={errors.email?.message}>
          <Input
            id={emailId}
            {...loginForm.register("email")}
            type="email"
            placeholder="agent@leprestigieux.ga"
            autoFocus
            autoComplete="username"
            spellCheck={false}
            aria-invalid={!!errors.email}
            className={cn(errorCls(!!errors.email), "text-center")}
          />
        </FormField>

        <div
          className="grid grid-cols-2 rounded-lg border border-neutral-200 overflow-hidden"
          role="group"
          aria-label="Mode de connexion"
        >
          <ModeTab
            active={!premiereConnexion}
            onClick={() => onToggleMode(false)}
            label="Mot de passe"
          />
          <ModeTab
            active={premiereConnexion}
            onClick={() => onToggleMode(true)}
            label="Première connexion (OTP)"
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {premiereConnexion ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FormField
                id={otpId}
                label={t("auth.otp")}
                hint="Code à 6 chiffres reçu par e-mail"
                error={
                  "otp" in errors
                    ? (errors as { otp?: { message?: string } }).otp?.message
                    : undefined
                }
              >
                <Input
                  id={otpId}
                  {...loginForm.register("otp")}
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  aria-invalid={"otp" in errors && !!(errors as { otp?: unknown }).otp}
                  className={cn(
                    errorCls("otp" in errors && !!(errors as { otp?: unknown }).otp),
                    "tracking-[0.4em] text-center text-base font-bold",
                  )}
                  onChange={(e) =>
                    loginForm.setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 6), {
                      shouldValidate: true,
                    })
                  }
                />
              </FormField>
            </motion.div>
          ) : (
            <motion.div
              key="mdp"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FormField
                id={passwordId}
                label={t("auth.password")}
                error={
                  "password" in errors
                    ? (errors as { password?: { message?: string } }).password?.message
                    : undefined
                }
              >
                <div className="relative">
                  <Input
                    id={passwordId}
                    {...loginForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="******"
                    autoComplete="current-password"
                    aria-invalid={
                      "password" in errors && !!(errors as { password?: unknown }).password
                    }
                    className={cn(
                      errorCls(
                        "password" in errors && !!(errors as { password?: unknown }).password,
                      ),
                      "pr-10 text-center",
                    )}
                  />
                  <EyeToggle show={showPassword} onToggle={onTogglePassword} />
                </div>
              </FormField>
            </motion.div>
          )}
        </AnimatePresence>

        <ServerError message={serverError} />

        {serverError === "Code OTP expiré." && (
          <p className="text-[11px] text-red-700 -mt-2">
            Contactez votre administrateur pour recevoir un nouveau code par email.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
          {loginForm.formState.isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            t("auth.connexion")
          )}
        </Button>
      </form>
    </>
  );
}

interface SetPasswordStepProps {
  t: (key: string) => string;
  passwordForm: ReturnType<typeof useForm<SetPasswordFormData>>;
  watchedPassword: string;
  serverError: string | null;
  showNew: boolean;
  showConfirm: boolean;
  newPassId: string;
  confirmId: string;
  onToggleNew: () => void;
  onToggleConfirm: () => void;
  onSubmit: (data: SetPasswordFormData) => Promise<void>;
  onBack: () => void;
}

function SetPasswordStep({
  t,
  passwordForm,
  watchedPassword,
  serverError,
  showNew,
  showConfirm,
  newPassId,
  confirmId,
  onToggleNew,
  onToggleConfirm,
  onSubmit,
  onBack,
}: SetPasswordStepProps) {
  const errors = passwordForm.formState;

  return (
    <>
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3 mb-5">
        <ShieldCheck size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-blue-800 text-[11px] leading-relaxed">{t("auth.premiereConnexion")}</p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id={newPassId}
          label={t("auth.newPassword")}
          error={errors.errors.password?.message}
        >
          <div className="relative">
            <Input
              id={newPassId}
              {...passwordForm.register("password")}
              type={showNew ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              autoFocus
              aria-invalid={!!errors.errors.password}
              className={cn(errorCls(!!errors.errors.password), "pr-10")}
            />
            <EyeToggle show={showNew} onToggle={onToggleNew} />
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
          error={errors.errors.confirmation?.message}
        >
          <div className="relative">
            <Input
              id={confirmId}
              {...passwordForm.register("confirmation")}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.errors.confirmation}
              className={cn(errorCls(!!errors.errors.confirmation), "pr-10")}
            />
            <EyeToggle show={showConfirm} onToggle={onToggleConfirm} />
          </div>
        </FormField>

        <ServerError message={serverError} />

        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onBack}
            disabled={errors.isSubmitting}
          >
            Retour
          </Button>
          <Button type="submit" className="flex-1" disabled={errors.isSubmitting}>
            {errors.isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              "Définir mon mot de passe"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

function errorCls(hasError: boolean) {
  return hasError ? "border-red-400 focus:ring-red-300" : "";
}
