import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Loader2,
  Mail,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  WalletCards,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { settingsApi, type Setting } from "@/lib/settings.api";
import { featureFlagsApi, type FeatureFlag } from "@/lib/feature-flags.api";
import {
  notificationPreferencesApi,
  type NotificationPreference,
} from "@/lib/notification-preferences.api";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { EditCommissionTypeDialog } from "./commission/EditCommissionTypeDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useAuth } from "@/App";
import { savingsApi } from "@/lib/savings.api";

const MODULE_LABELS: Record<string, string> = {
  M1: "Sécurité",
  M2: "Documents",
  M3: "Crédits client",
  M6: "Créances et pénalités",
  M11: "Épargne voyage",
  MAIL: "Emails et notifications",
  auth: "Authentification",
  settings: "Paramètres",
  party: "Clients et référents",
  documents: "Documents",
  payments: "Paiements",
  penalties: "Pénalités",
  remises: "Remises",
  billetterie: "Billetterie",
  shop: "PrestiShop",
  commission: "Commissions",
  epargne: "Épargne voyage",
  dashboard: "Tableau de bord",
  papeterie: "Papeterie",
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  M1: "Règles appliquées à la connexion, aux OTP et au verrouillage des comptes.",
  M2: "Valeurs par défaut utilisées lors de la création des documents commerciaux.",
  M3: "Comportement des crédits client lorsqu'ils arrivent en fin de période de décision.",
  M6: "Montants et délais utilisés pour calculer les pénalités de créances.",
  M11: "Paramètres d'inscription et conversion vers l'épargne voyage.",
  MAIL: "Contrôle des envois email et des futurs rappels automatiques.",
};

const SETTING_COPY: Record<
  string,
  {
    label: string;
    helper: string;
    unit?: string;
    impact: "critical" | "warning" | "normal";
    options?: { value: string; label: string; detail: string }[];
  }
> = {
  penalty_amount_xaf: {
    label: "Montant de pénalité hebdomadaire",
    helper: "Ajouté à chaque échéance en retard pour chaque semaine complète dépassée.",
    unit: "XAF",
    impact: "critical",
  },
  penalty_grace_days: {
    label: "Délai avant pénalité",
    helper: "Nombre de jours accordés après une échéance manquée avant le calcul des pénalités.",
    unit: "jours",
    impact: "critical",
  },
  credit_decision_period_days: {
    label: "Période de décision crédit",
    helper: "Durée pendant laquelle le client peut choisir quoi faire d'un lot de crédit.",
    unit: "jours",
    impact: "warning",
  },
  credit_underfee_policy: {
    label: "Crédit inférieur aux frais d'inscription",
    helper: "Décide du traitement des petits crédits expirés avant conversion vers l'épargne.",
    impact: "critical",
    options: [
      {
        value: "HOLD_AND_NOTIFY",
        label: "Mettre en attente et notifier",
        detail: "Le crédit reste bloqué pour revue manuelle.",
      },
      {
        value: "CONVERT_ANYWAY",
        label: "Convertir malgré tout",
        detail: "Le crédit est converti même s'il ne couvre pas les frais.",
      },
    ],
  },
  epargne_inscription_fee: {
    label: "Frais d'inscription épargne",
    helper: "Montant prélevé lors de l'inscription à l'épargne voyage.",
    unit: "XAF",
    impact: "critical",
  },
  default_currency: {
    label: "Devise par défaut",
    helper: "Devise proposée dans les documents et calculs financiers.",
    impact: "warning",
  },
  default_due_date_offset_days: {
    label: "Échéance par défaut des factures",
    helper: "Nombre de jours ajoutés à la date d'émission en mode paiement complet.",
    unit: "jours",
    impact: "warning",
  },
  otp_expiration_minutes: {
    label: "Validité du code OTP",
    helper: "Durée pendant laquelle un code de vérification reste utilisable.",
    unit: "minutes",
    impact: "normal",
  },
  lockout_max_attempts: {
    label: "Tentatives de connexion autorisées",
    helper: "Nombre d'échecs de connexion avant verrouillage temporaire du compte.",
    unit: "tentatives",
    impact: "warning",
  },
  lockout_duration_minutes: {
    label: "Durée du verrouillage",
    helper: "Temps d'attente imposé après dépassement du nombre de tentatives autorisées.",
    unit: "minutes",
    impact: "warning",
  },
  mail_enabled: {
    label: "Envoi email activé",
    helper: "Interrupteur global. Désactive tous les emails sortants sans modifier la configuration SMTP.",
    impact: "critical",
  },
  mail_automatic_reminders_enabled: {
    label: "Rappels automatiques",
    helper: "Autorise les futurs envois automatiques pour échéances proches, paiements en retard et relances.",
    impact: "critical",
  },
  mail_document_auto_send_enabled: {
    label: "Envoi automatique des documents",
    helper: "Autorise l'envoi email automatique des proformas, factures et bons de livraison à la génération.",
    impact: "critical",
  },
  mail_sender_name: {
    label: "Nom d'expéditeur",
    helper: "Nom affiché dans les emails générés par l'application.",
    impact: "warning",
  },
};

const IMPACT_STYLES = {
  critical: {
    label: "Impact élevé",
    className: "border-danger-border bg-danger-bg text-danger-text",
    cardClassName:
      "border-danger-border bg-[repeating-linear-gradient(135deg,#fef2f2_0,#fef2f2_10px,#fff_10px,#fff_22px)]",
    ruleClassName: "border-danger-border",
    icon: AlertTriangle,
  },
  warning: {
    label: "Impact moyen",
    className: "border-warning-border bg-warning-bg text-warning-text",
    cardClassName:
      "border-warning-border bg-[repeating-linear-gradient(135deg,#fffbeb_0,#fffbeb_10px,#fff_10px,#fff_22px)]",
    ruleClassName: "border-warning-border",
    icon: SlidersHorizontal,
  },
  normal: {
    label: "Impact faible",
    className: "border-success-border bg-success-bg text-success-text",
    cardClassName:
      "border-success-border bg-[repeating-linear-gradient(135deg,#ecfdf5_0,#ecfdf5_10px,#fff_10px,#fff_22px)]",
    ruleClassName: "border-success-border",
    icon: ShieldCheck,
  },
};

export default function SettingsPage() {
  usePageHeader({
    title: "Paramètres",
    helpTopic: "parametres",
    guide: {
      steps: [
        "Chaque onglet correspond à une catégorie de réglages distincte.",
        "Un changement s'applique aux futures opérations, jamais rétroactivement.",
      ],
    },
  });

  return (
    <div className="space-y-5">
      <div className="border border-border bg-card px-4 py-4">
        <p className="text-[11px] font-semibold uppercase text-brand-gold-dark">Administration</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Règles de fonctionnement</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Ajustez les paramètres financiers, la visibilité des modules et le catalogue des
          commissions. Les actions sensibles sont signalées avant modification.
        </p>
      </div>

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Règles financières</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue commissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <FinancialSettingsTab />
        </TabsContent>
        <TabsContent value="modules">
          <ModulesTab />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancialSettingsTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.list().then((res) => {
      setSettings(res.data);
      setDrafts(Object.fromEntries(res.data.map((s) => [s.key, s.value])));
      setLoading(false);
    });
  }, []);

  async function handleSave(key: string) {
    setSaving(key);
    try {
      await settingsApi.update(key, drafts[key]);
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: drafts[key] } : s)));
    } finally {
      setSaving(null);
    }
  }

  const grouped = useMemo(
    () =>
      settings.reduce<Record<string, Setting[]>>((acc, setting) => {
        (acc[setting.module] ??= []).push(setting);
        return acc;
      }, {}),
    [settings],
  );

  const dirtyCount = settings.filter((setting) => drafts[setting.key] !== setting.value).length;
  const criticalCount = settings.filter(
    (setting) => (SETTING_COPY[setting.key]?.impact ?? "normal") === "critical",
  ).length;
  const financialModules = Object.keys(grouped).length;

  if (loading) return <LoadingLine label="Chargement des paramètres..." />;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SettingsKpi icon={WalletCards} label="Paramètres actifs" value={String(settings.length)} />
        <SettingsKpi
          icon={AlertTriangle}
          label="Réglages sensibles"
          value={String(criticalCount)}
          tone="danger"
        />
        <SettingsKpi icon={BadgeCheck} label="Modules concernés" value={String(financialModules)} />
      </div>

      {dirtyCount > 0 && (
        <div className="border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text">
          {dirtyCount} modification{dirtyCount > 1 ? "s" : ""} en attente d'enregistrement.
        </div>
      )}

      {Object.entries(grouped).map(([module, items]) => (
        <section key={module} className="border border-border bg-card">
          <div className="grid gap-2 border-b border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {MODULE_LABELS[module] ?? module}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {MODULE_DESCRIPTIONS[module] ?? "Paramètres opérationnels du module."}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length} option{items.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((setting) => (
              <SettingControl
                key={setting.key}
                setting={setting}
                value={drafts[setting.key] ?? ""}
                dirty={drafts[setting.key] !== setting.value}
                saving={saving === setting.key}
                onChange={(value) => setDrafts((current) => ({ ...current, [setting.key]: value }))}
                onSave={() => handleSave(setting.key)}
              />
            ))}
          </div>
        </section>
      ))}

      <CreditConversionTool />
    </div>
  );
}

function SettingControl({
  setting,
  value,
  dirty,
  saving,
  onChange,
  onSave,
}: {
  setting: Setting;
  value: string;
  dirty: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const copy = SETTING_COPY[setting.key] ?? {
    label: humanizeKey(setting.key),
    helper: setting.description ?? "Paramètre système.",
    impact: "normal" as const,
  };
  const impact = IMPACT_STYLES[copy.impact];
  const ImpactIcon = impact.icon;

  return (
    <div className={`flex min-h-full flex-col border bg-card p-3 ${impact.cardClassName}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{copy.label}</p>
          <span
            className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] ${impact.className}`}
          >
            <ImpactIcon size={12} />
            {impact.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.helper}</p>
        <p className="mt-1 text-[11px] text-subtle">Clé technique: {setting.key}</p>
      </div>

      <div className={`my-3 border-t border-dashed ${impact.ruleClassName}`} />

      <div className="mt-auto space-y-3">
        {setting.type === "boolean" ? (
          <div className="flex items-center justify-between border border-border bg-card px-3 py-2">
            <span className="text-xs text-body">
              {value === "true" ? "Activé" : "Désactivé"}
            </span>
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => onChange(String(checked))}
            />
          </div>
        ) : copy.options ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-10 bg-card">
              <SelectValue placeholder="Choisir une règle" />
            </SelectTrigger>
            <SelectContent>
              {copy.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type={setting.type === "integer" ? "number" : "text"}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-10 bg-card"
            />
            {copy.unit && <span className="w-20 text-xs text-muted-foreground">{copy.unit}</span>}
          </div>
        )}
        {copy.options && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {copy.options.find((option) => option.value === value)?.detail}
          </p>
        )}

        <Button
          size="sm"
          variant={dirty ? "default" : "secondary"}
          disabled={!dirty || saving}
          onClick={onSave}
          className="w-full"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function CreditConversionTool() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!user || user.role !== "super_admin") return null;

  async function handleTrigger() {
    setRunning(true);
    setResult(null);
    try {
      const res = await savingsApi.triggerConversion();
      setResult(
        `${res.data.converted} converti(s), ${res.data.heldForReview} en attente de révision.`,
      );
    } catch (err: unknown) {
      setResult(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors du déclenchement.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="border border-danger-border bg-danger-bg">
      <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger-text" />
            <h3 className="text-sm font-semibold text-danger-text">
              Conversion manuelle des crédits expirés
            </h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-danger-text">
            Lance immédiatement la conversion des crédits dont la fenêtre de décision est expirée.
            Cette action peut créer de vrais mouvements financiers.
          </p>
          {result && <p className="mt-2 text-xs text-danger-text">{result}</p>}
        </div>
        <Button size="sm" variant="destructive" onClick={handleTrigger} disabled={running}>
          {running ? <Loader2 size={13} className="animate-spin" /> : "Déclencher"}
        </Button>
      </div>
    </section>
  );
}

function ModulesTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureFlagsApi.list().then((res) => {
      setFlags(res.data);
      setLoading(false);
    });
  }, []);

  async function handleToggle(moduleCode: string, enabled: boolean) {
    setFlags((prev) =>
      prev.map((flag) => (flag.moduleCode === moduleCode ? { ...flag, enabled } : flag)),
    );
    await featureFlagsApi.toggle(moduleCode, enabled);
  }

  if (loading) return <LoadingLine label="Chargement des modules..." />;

  const enabledCount = flags.filter((flag) => flag.enabled).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SettingsKpi icon={ToggleLeft} label="Modules configurés" value={String(flags.length)} />
        <SettingsKpi icon={BadgeCheck} label="Modules visibles" value={String(enabledCount)} />
        <SettingsKpi
          icon={AlertTriangle}
          label="Modules masqués"
          value={String(flags.length - enabledCount)}
          tone="warning"
        />
      </div>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Visibilité des modules</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Désactiver un module le retire de la navigation. Les données existantes ne sont pas
            supprimées.
          </p>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {flags.map((flag) => (
            <div
              key={flag.moduleCode}
              className={`flex min-h-full flex-col justify-between border p-3 ${
                flag.enabled
                  ? "border-success-border bg-success-bg/40"
                  : "border-border bg-surface-muted"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {MODULE_LABELS[flag.moduleCode] ?? humanizeKey(flag.moduleCode)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flag.enabled
                    ? "Visible dans la navigation des utilisateurs autorisés."
                    : "Masqué dans la navigation, réactivation possible."}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {flag.enabled ? "Visible" : "Masqué"}
                </span>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(value) => handleToggle(flag.moduleCode, value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Pass 6 — one row per known event code (installment-due-soon,
// proforma-expired, etc., seeded from the same set every notification
// producer already uses as its dedupeKey prefix). Two independent
// switches per row: in-app controls whether createNotification even
// inserts a row; email is a net-new capability — sending a generic
// email alongside the in-app notification for events that today only
// ever create an in-app row.
function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    notificationPreferencesApi.list().then((res) => {
      setPrefs(res.data);
      setLoading(false);
    });
  }, []);

  async function handleToggle(
    eventCode: string,
    field: "inAppEnabled" | "emailEnabled",
    value: boolean,
  ) {
    setPrefs((prev) =>
      prev.map((p) => (p.eventCode === eventCode ? { ...p, [field]: value } : p)),
    );
    setPendingKey(`${eventCode}:${field}`);
    try {
      await notificationPreferencesApi.update(eventCode, { [field]: value });
    } catch {
      // Revert on failure — the row already shows the optimistic value,
      // so roll it back rather than leaving the UI showing a state the
      // server rejected.
      setPrefs((prev) =>
        prev.map((p) => (p.eventCode === eventCode ? { ...p, [field]: !value } : p)),
      );
    } finally {
      setPendingKey(null);
    }
  }

  if (loading) return <LoadingLine label="Chargement des préférences..." />;

  const emailCount = prefs.filter((p) => p.emailEnabled).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SettingsKpi icon={BellRing} label="Événements suivis" value={String(prefs.length)} />
        <SettingsKpi icon={BadgeCheck} label="Notifications in-app actives" value={String(prefs.filter((p) => p.inAppEnabled).length)} />
        <SettingsKpi icon={Mail} label="Emails activés" value={String(emailCount)} tone={emailCount > 0 ? undefined : "warning"} />
      </div>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Préférences par événement</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Contrôle, pour chaque événement système, s'il crée une notification dans
            l'application et/ou envoie un email. Ne concerne pas les emails de documents
            (factures, proformas, bons de livraison), gérés séparément dans l'onglet Règles
            financières.
          </p>
        </div>
        <div className="divide-y divide-neutral-100">
          {prefs.map((pref) => (
            <div key={pref.eventCode} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                {pref.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{pref.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">In-app</span>
                  <Switch
                    checked={pref.inAppEnabled}
                    disabled={pendingKey === `${pref.eventCode}:inAppEnabled`}
                    onCheckedChange={(value) => handleToggle(pref.eventCode, "inAppEnabled", value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Email</span>
                  <Switch
                    checked={pref.emailEnabled}
                    disabled={pendingKey === `${pref.eventCode}:emailEnabled`}
                    onCheckedChange={(value) => handleToggle(pref.eventCode, "emailEnabled", value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CatalogTab() {
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function reload() {
    commissionCatalogApi.list().then((res) => {
      setTypes(res.data);
      setLoading(false);
    });
  }

  useEffect(reload, []);

  async function handleToggle(code: string, active: boolean) {
    setTypes((prev) => prev.map((type) => (type.code === code ? { ...type, active } : type)));
    await commissionCatalogApi.toggleActive(code, active);
  }

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      await commissionCatalogApi.create({ code: newCode, label: newLabel });
      setDialogOpen(false);
      setNewCode("");
      setNewLabel("");
      reload();
    } catch (err: unknown) {
      setCreateError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingLine label="Chargement du catalogue..." />;

  const activeCount = types.filter((type) => type.active).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SettingsKpi icon={WalletCards} label="Types de commission" value={String(types.length)} />
        <SettingsKpi icon={BadgeCheck} label="Types actifs" value={String(activeCount)} />
        <SettingsKpi
          icon={AlertTriangle}
          label="Types désactivés"
          value={String(types.length - activeCount)}
          tone="warning"
        />
      </div>

      <section className="border border-border bg-card">
        <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Catalogue des commissions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ces types structurent la saisie, les filtres et les graphiques de commissions.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm">
                <Plus size={14} /> Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau type de commission</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-medium text-body">
                    Code technique
                  </label>
                  <Input
                    value={newCode}
                    onChange={(event) => setNewCode(event.target.value)}
                    placeholder="partenariat_hotel"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Utilisé par l'API et les rapports. Préférez minuscules, chiffres et tirets bas.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-medium text-body">
                    Nom affiché
                  </label>
                  <Input
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    placeholder="Partenariat hôtel"
                  />
                </div>
                {createError && <p className="text-[11px] text-danger-text">{createError}</p>}
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={creating || !newCode || !newLabel}>
                  {creating ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {types.map((type) => (
            <div
              key={type.code}
              className={`flex min-h-full flex-col justify-between border p-3 ${
                type.active
                  ? "border-success-border bg-success-bg/40"
                  : "border-border bg-surface-muted"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <span
                    className={`border px-2 py-0.5 text-[11px] ${type.active ? "border-success-border bg-success-bg text-success-text" : "border-border bg-surface-muted text-muted-foreground"}`}
                  >
                    {type.active ? "Actif" : "Désactivé"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Code technique: {type.code}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3">
                <EditCommissionTypeDialog type={type} onUpdated={reload} />
                <Switch
                  checked={type.active}
                  onCheckedChange={(value) => handleToggle(type.code, value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsKpi({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger-border text-danger-text"
      : tone === "warning"
        ? "border-warning-border text-warning-text"
        : "border-border text-brand-gold-dark";

  return (
    <div className={`border bg-card px-4 py-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon size={16} />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

function humanizeKey(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
