import { useId, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseBusiness,
  Loader2,
  Mail,
  MapPinned,
  Plane,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { authApi } from "@/lib/auth.api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { loginSchema, setPasswordSchema } from "./schemas";
import type { LoginFormData, SetPasswordFormData, Etape } from "./schemas";
import { slideVariants, slideTx, fadeUp } from "./animations";
import {
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
    <div className="min-h-dvh bg-neutral-50 p-3 sm:p-5">
      <motion.div
        className="mx-auto grid min-h-[calc(100dvh-24px)] w-full max-w-[1280px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm lg:min-h-[calc(100dvh-40px)] lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)]"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <section className="flex min-h-[620px] items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[390px]">
            <div className="flex items-center mb-6">
              <motion.img
                src="/brand/logo.jpg"
                alt="Le Prestigieux"
                className="mb-3 h-20 w-auto object-contain"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              />

              <div className="ml-4 -mt-1">
                <h1 className="text-[24px] font-bold tracking-tight text-neutral-950">PrestiX</h1>
                <p className="-mt-1 text-[12px] italic leading-relaxed text-neutral-500">
                  Une autre idée du voyage
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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

              <div className="overflow-hidden p-6">
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

            <p className="mt-4 text-[10px] uppercase tracking-wide text-neutral-400">
              Le Prestigieux - Usage interne uniquement
            </p>
          </div>
        </section>

        <TravelShowcase />
      </motion.div>
    </div>
  );
}

function TravelShowcase() {
  return (
    <section className="hidden bg-neutral-100 p-6 lg:block">
      <div className="relative flex h-full min-h-[620px] overflow-hidden rounded-[28px] bg-neutral-950 px-10 py-10 text-white">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-0 top-24 h-px w-full rotate-[-18deg] bg-white" />
          <div className="absolute right-[-90px] top-20 h-[8px] w-[360px] rotate-[-43deg] bg-brand-gold-light" />
          <div className="absolute right-[-80px] top-32 h-[4px] w-[320px] rotate-[-43deg] bg-white" />
          <div className="absolute bottom-28 left-[-80px] h-px w-[520px] rotate-[-24deg] bg-brand-blue" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between">
          <div>
            <div className="mb-14 flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5">
              <Plane size={20} className="text-brand-gold-light" />
            </div>

            <TravelMapIllustration />

            <div className="mt-8 max-w-[430px]">
              <p className="text-[11px] font-semibold text-white/70">Le Prestigieux</p>
              <h2 className="mt-4 text-[30px] font-bold leading-tight tracking-tight">
                Bienvenue dans votre espace agence
              </h2>
              <p className="mt-3 text-[12px] leading-6 text-white/68">
                Connectez-vous pour gérer les dossiers clients, les factures, les paiements et les
                opérations de voyage.
              </p>
            </div>
          </div>

          <div className="relative mt-10 max-w-[470px] rounded-[22px] border border-white/10 bg-white/[0.16] p-7 backdrop-blur">
            <div className="absolute right-[-58px] top-[-1px] h-16 w-24 rounded-bl-[24px] border-b border-l border-white/10 bg-neutral-950" />
            <h3 className="max-w-[320px] text-[20px] font-bold leading-tight">
              Gardez la vente, la caisse et le suivi client au même endroit
            </h3>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <TravelMetric icon={BriefcaseBusiness} label="Dossiers" />
              <TravelMetric icon={Mail} label="Clients" />
              <TravelMetric icon={MapPinned} label="Voyages" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TravelMapIllustration() {
  return (
    <svg
      viewBox="0 0 520 230"
      role="img"
      aria-label="Illustration abstraite de trajet aérien"
      className="h-auto w-full max-w-[520px]"
    >
      <defs>
        <linearGradient id="routeGold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f5e65e" />
          <stop offset="100%" stopColor="#a77800" />
        </linearGradient>
      </defs>
      <path
        d="M44 164 C118 78 191 205 270 116 C345 32 390 95 474 42"
        fill="none"
        stroke="url(#routeGold)"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <path
        d="M72 185 C145 144 195 168 248 128 C309 82 381 80 448 61"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeDasharray="8 11"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <g fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
        <path d="M80 54 L146 28 L193 78 L151 145 L91 132 Z" />
        <path d="M254 42 L324 26 L381 77 L353 143 L271 129 Z" />
        <path d="M162 145 L236 124 L305 164 L252 204 L176 197 Z" />
      </g>
      <g fill="#f5e65e">
        <circle cx="44" cy="164" r="5" />
        <circle cx="270" cy="116" r="5" />
        <circle cx="474" cy="42" r="5" />
      </g>
      <g transform="translate(302 78) rotate(-18)">
        <path
          d="M0 16 L78 0 C85 -1 89 7 84 12 L65 30 L72 55 L60 58 L47 41 L20 58 L10 54 L33 27 L0 24 Z"
          fill="white"
        />
      </g>
    </svg>
  );
}

function TravelMetric({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-950/35 px-3 py-3">
      <Icon size={15} className="text-brand-gold-light" />
      <p className="mt-2 text-[11px] font-semibold text-white/80">{label}</p>
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
      <div className="mb-5">
        <p className="text-[24px] font-bold tracking-tight text-neutral-950">{t("auth.title")}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
          Utilisez votre email professionnel et votre mot de passe.
        </p>
      </div>

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
            className={cn(errorCls(!!errors.email), "bg-neutral-50")}
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
                      "bg-neutral-50 pr-10",
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
      <div className="mb-5">
        <p className="text-[24px] font-bold tracking-tight text-neutral-950">
          Définir le mot de passe
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
          Finalisez la première connexion de votre compte.
        </p>
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-gold-dark" />
        <p className="text-[11px] leading-relaxed text-neutral-700">
          {t("auth.premiereConnexion")}
        </p>
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
              className={cn(errorCls(!!errors.errors.password), "bg-neutral-50 pr-10")}
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
              className={cn(errorCls(!!errors.errors.confirmation), "bg-neutral-50 pr-10")}
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
