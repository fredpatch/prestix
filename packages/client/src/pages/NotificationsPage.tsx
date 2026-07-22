import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Eye,
  FileText,
  Inbox,
  Loader2,
  MailOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useAuth } from "@/App";
import { cn } from "@/lib/utils";
import {
  notificationApi,
  type MailConfigStatus,
  type NotificationCategory,
  type NotificationItem,
  type NotificationSeverity,
  type NotificationStatusFilter,
} from "@/lib/notification.api";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useMailOutbox } from "@/hooks/queries/useMailOutbox";
import {
  useDismissNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/mutations/useNotificationMutations";
import { queryKeys } from "@/lib/query-keys";

const PAGE_SIZE = 12;

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  system: "Système",
  documents: "Documents",
  finance: "Finance",
  stock: "Stock",
  commission: "Commissions",
  savings: "Épargne",
};

const SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  info: "Information",
  success: "Succès",
  warning: "Attention",
  danger: "Critique",
};

const SEVERITY_CLASSES: Record<NotificationSeverity, string> = {
  info: "border-blue-100 bg-blue-50 text-blue-700",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  danger: "border-red-100 bg-red-50 text-red-700",
};

const CATEGORY_ICONS: Record<NotificationCategory, ElementType> = {
  system: Bell,
  documents: FileText,
  finance: ShieldAlert,
  stock: Archive,
  commission: Sparkles,
  savings: WalletCards,
};

interface InboxBucket {
  value: NotificationStatusFilter;
  label: string;
  icon: ElementType;
}

const INBOX_BUCKETS: InboxBucket[] = [
  { value: "unread", label: "Non lues", icon: Circle },
  { value: "all", label: "Toutes", icon: Inbox },
  { value: "read", label: "Lues", icon: MailOpen },
  { value: "archived", label: "Archivées", icon: Archive },
];

function formatDateTime(value: string): string {
  return format(parseISO(value), "dd MMM yyyy HH:mm", { locale: fr });
}

function severityBadge(severity: NotificationSeverity) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10.5px] font-semibold",
        SEVERITY_CLASSES[severity],
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export default function NotificationsPage() {
  usePageHeader({ title: "Notifications" });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<NotificationStatusFilter>("unread");
  const [category, setCategory] = useState<NotificationCategory | "__all__">("__all__");
  const [severity, setSeverity] = useState<NotificationSeverity | "__all__">("__all__");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  useEffect(() => setPage(1), [status, category, severity, search]);

  const filters = {
    status,
    category: category === "__all__" ? undefined : category,
    severity: severity === "__all__" ? undefined : severity,
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useNotifications(filters);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const dismissMutation = useDismissNotificationMutation();

  const notifications = data?.data ?? [];
  const total = data?.total ?? 0;
  const unread = data?.unread ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const critical = notifications.filter((item) => item.severity === "danger").length;
    const warnings = notifications.filter((item) => item.severity === "warning").length;
    return { currentPage: notifications.length, unread, critical, warnings };
  }, [notifications, unread]);

  function openNotification(item: NotificationItem) {
    setSelected(item);
    if (!item.readAt) markReadMutation.mutate(item.id);
  }

  function followAction(item: NotificationItem) {
    if (!item.readAt) markReadMutation.mutate(item.id);
    if (item.actionUrl) navigate(item.actionUrl);
  }

  return (
    <div className="space-y-5">
      {user && ["admin", "super_admin"].includes(user.role) && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
          <MailTestPanel />
          <MailOutboxPanel />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NotificationKpi
          label="Non lues"
          value={stats.unread}
          detail="Messages à traiter"
          icon={Bell}
          tone={stats.unread > 0 ? "gold" : "neutral"}
        />
        <NotificationKpi
          label="Critiques"
          value={stats.critical}
          detail="Sur la page courante"
          icon={AlertTriangle}
          tone={stats.critical > 0 ? "danger" : "neutral"}
        />
        <NotificationKpi
          label="Alertes"
          value={stats.warnings}
          detail="Sur la page courante"
          icon={Clock3}
          tone={stats.warnings > 0 ? "warning" : "neutral"}
        />
        <NotificationKpi
          label="Affichées"
          value={stats.currentPage}
          detail={`${total} notification${total !== 1 ? "s" : ""} trouvée${total !== 1 ? "s" : ""}`}
          icon={Inbox}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-neutral-200 bg-white p-2">
          <div className="border-b border-neutral-100 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Boîte de réception
            </p>
          </div>
          <div className="mt-2 space-y-1">
            {INBOX_BUCKETS.map((bucket) => {
              const Icon = bucket.icon;
              const active = status === bucket.value;
              return (
                <button
                  key={bucket.value}
                  type="button"
                  onClick={() => setStatus(bucket.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] transition-colors",
                    active
                      ? "bg-brand-gold-dark text-white"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={14} />
                    <span className="truncate">{bucket.label}</span>
                  </span>
                  {bucket.value === "unread" && unread > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active ? "bg-white/20 text-white" : "bg-brand-gold-light text-brand-gold-dark",
                      )}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-neutral-200 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(220px,360px)_180px_170px]">
              <div className="relative">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une notification..."
                  className="pl-8"
                />
              </div>

              <Select
                value={category}
                onValueChange={(value) => setCategory(value as NotificationCategory | "__all__")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les catégories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={severity}
                onValueChange={(value) => setSeverity(value as NotificationSeverity | "__all__")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les priorités</SelectItem>
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {isFetching && (
                <span className="hidden items-center gap-1.5 text-[11px] text-neutral-400 sm:flex">
                  <Loader2 size={12} className="animate-spin" />
                  Actualisation
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={unread === 0 || markAllReadMutation.isPending}
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                Tout lire
              </Button>
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {isLoading ? (
              <div className="flex h-44 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={18} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Inbox className="mx-auto text-neutral-300" size={24} />
                <p className="mt-3 text-[13px] font-medium text-neutral-800">
                  Aucune notification
                </p>
                <p className="mt-1 text-[12px] text-neutral-500">
                  Les alertes système apparaîtront ici dès qu'un événement sera détecté.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={openNotification}
                  onDismiss={(id) => dismissMutation.mutate(id)}
                  dismissing={dismissMutation.variables === item.id && dismissMutation.isPending}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-neutral-500">
              {total} notification{total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={13} />
                Précédent
              </Button>
              <span className="text-[11px] text-neutral-500">
                Page {page} / {pageCount}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                Suivant
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </section>
      </div>

      <NotificationDetailDialog
        notification={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onFollow={followAction}
        onDismiss={(id) => dismissMutation.mutate(id, { onSuccess: () => setSelected(null) })}
      />
    </div>
  );
}

function MailTestPanel() {
  const queryClient = useQueryClient();
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<MailConfigStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "warning" | "danger">("warning");

  async function checkStatus() {
    setChecking(true);
    setMessage(null);
    try {
      const response = await notificationApi.mailStatus();
      setStatus(response.data);
      setMessageTone(response.data.transportOk ? "success" : "warning");
      setMessage(response.data.transportOk ? "Connexion SMTP valide." : "Configuration incomplète.");
    } catch (error: unknown) {
      const data = (error as { response?: { data?: MailConfigStatus } })?.response?.data;
      if (data) setStatus(data);
      setMessageTone("danger");
      setMessage(data?.message ?? "Impossible de vérifier la configuration SMTP.");
    } finally {
      setChecking(false);
    }
  }

  async function sendTest() {
    setSending(true);
    setMessage(null);
    try {
      const response = await notificationApi.sendTestMail(to);
      if (response.data.success) {
        setMessageTone(response.data.rejected.length > 0 ? "warning" : "success");
        setMessage(`Email envoyé à ${response.data.accepted.join(", ")}.`);
      } else {
        setMessageTone("danger");
        setMessage(response.data.errorMessage ?? "Email refusé par le serveur SMTP.");
      }
    } catch (error: unknown) {
      setMessageTone("danger");
      setMessage(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'envoi du test.",
      );
    } finally {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      setSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_auto_auto] xl:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gold-dark">
            SMTP
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-950">Test d'envoi email</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Vérifie la configuration Gmail/SMTP avant de brancher les envois automatiques.
          </p>
          {status && (
            <p className="mt-2 text-[11px] text-neutral-500">
              {status.host ?? "SMTP non configuré"}:{status.port} - {status.from ?? "expéditeur manquant"}
            </p>
          )}
        </div>

        <Input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="Adresse de test"
          type="email"
        />

        <Button type="button" variant="secondary" onClick={checkStatus} disabled={checking}>
          {checking ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />}
          Vérifier
        </Button>

        <Button type="button" onClick={sendTest} disabled={sending || !to.trim()}>
          {sending ? <Loader2 size={13} className="animate-spin" /> : <MailOpen size={13} />}
          Envoyer
        </Button>
      </div>

      {message && (
        <div
          className={cn(
            "mt-3 border px-3 py-2 text-[12px]",
            messageTone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            messageTone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
            messageTone === "danger" && "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {message}
        </div>
      )}
    </section>
  );
}

function MailOutboxPanel() {
  const { data = [], isLoading, isFetching, refetch } = useMailOutbox();

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gold-dark">
            Emails
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-950">Historique d'envoi</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/mail-outbox"
            className="text-[11px] font-medium text-blue-600 hover:underline"
          >
            Voir tout
          </Link>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Actualiser
          </Button>
        </div>
      </div>

      <div className="divide-y divide-neutral-100">
        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-5 text-[12px] text-neutral-500">
            <Loader2 size={13} className="animate-spin" />
            Chargement des emails...
          </div>
        ) : data.length === 0 ? (
          <p className="px-4 py-5 text-[12px] text-neutral-500">Aucun email enregistre.</p>
        ) : (
          data.slice(0, 5).map((item) => <MailOutboxRow key={item.id} item={item} />)
        )}
      </div>
    </section>
  );
}

function MailOutboxRow({
  item,
}: {
  item: {
    recipient: string;
    subject: string;
    templateKey: string;
    status: "pending" | "sent" | "failed";
    createdAt: string;
    errorMessage?: string;
  };
}) {
  const tone =
    item.status === "sent"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : item.status === "failed"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-amber-100 bg-amber-50 text-amber-700";
  const label = item.status === "sent" ? "Envoye" : item.status === "failed" ? "Echec" : "En attente";

  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-[12px] font-semibold text-neutral-900">{item.subject}</p>
          <span className={cn("rounded border px-2 py-0.5 text-[10.5px] font-semibold", tone)}>
            {label}
          </span>
        </div>
        <p className="mt-1 truncate text-[11px] text-neutral-500">
          {item.recipient} - {item.templateKey}
        </p>
        {item.errorMessage && (
          <p className="mt-1 truncate text-[11px] text-red-600">{item.errorMessage}</p>
        )}
      </div>
      <p className="text-[10.5px] text-neutral-400">{formatDateTime(item.createdAt)}</p>
    </div>
  );
}

function NotificationKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: ElementType;
  tone: "gold" | "danger" | "warning" | "neutral";
}) {
  const toneClasses = {
    gold: "border-brand-gold-dark/25 bg-brand-gold-light/35 text-brand-gold-dark",
    danger: "border-red-100 bg-red-50 text-red-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    neutral: "border-neutral-200 bg-white text-neutral-500",
  }[tone];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-950">{value}</p>
          <p className="mt-1 text-[11px] text-neutral-500">{detail}</p>
        </div>
        <div className={cn("rounded-full border p-2", toneClasses)}>
          <Icon size={15} />
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  onOpen,
  onDismiss,
  dismissing,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onDismiss: (id: number) => void;
  dismissing: boolean;
}) {
  const CategoryIcon = CATEGORY_ICONS[item.category];
  const unread = !item.readAt;

  return (
    <div
      className={cn(
        "grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 md:grid-cols-[minmax(0,1fr)_auto]",
        unread && "bg-brand-gold-light/15",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="grid min-w-0 gap-3 text-left sm:grid-cols-[24px_120px_minmax(0,1fr)] sm:items-center"
      >
        <span className="flex items-center gap-2 sm:justify-center">
          {unread && <span className="h-2 w-2 rounded-full bg-brand-gold-dark" />}
          <CategoryIcon size={15} className="text-neutral-400" />
        </span>

        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-neutral-500">
            {CATEGORY_LABELS[item.category]}
          </span>
          <span className="block text-[10.5px] text-neutral-400">
            {formatDateTime(item.createdAt)}
          </span>
        </span>

        <span className="min-w-0">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={cn(
                "truncate text-[13px] text-neutral-900",
                unread ? "font-bold" : "font-semibold",
              )}
            >
              {item.title}
            </span>
            {severityBadge(item.severity)}
          </span>
          <span className="mt-1 block truncate text-[12px] text-neutral-500">{item.body}</span>
        </span>
      </button>

      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon" title="Voir" onClick={() => onOpen(item)}>
          <Eye size={13} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Archiver"
          onClick={() => onDismiss(item.id)}
          disabled={dismissing}
        >
          {dismissing ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
        </Button>
      </div>
    </div>
  );
}

function NotificationDetailDialog({
  notification,
  onOpenChange,
  onFollow,
  onDismiss,
}: {
  notification: NotificationItem | null;
  onOpenChange: (open: boolean) => void;
  onFollow: (notification: NotificationItem) => void;
  onDismiss: (id: number) => void;
}) {
  return (
    <Dialog open={Boolean(notification)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-white sm:max-w-2xl">
        {notification && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-neutral-950">
                    {notification.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-neutral-500">
                    {CATEGORY_LABELS[notification.category]} -{" "}
                    {formatDateTime(notification.createdAt)}
                  </DialogDescription>
                </div>
                {severityBadge(notification.severity)}
              </div>
            </DialogHeader>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[12.5px] leading-relaxed text-neutral-800">
                {notification.body}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailStat label="Statut" value={notification.readAt ? "Lue" : "Non lue"} />
              <DetailStat
                label="Source"
                value={
                  notification.sourceType
                    ? `${notification.sourceType}${notification.sourceId ? ` #${notification.sourceId}` : ""}`
                    : "Système"
                }
              />
              <DetailStat
                label="Lecture"
                value={notification.readAt ? formatDateTime(notification.readAt) : "Non lue"}
              />
            </div>

            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-left">
                  <tbody>
                    {Object.entries(notification.metadata).map(([key, value]) => (
                      <tr key={key} className="border-b border-neutral-100 last:border-0">
                        <td className="w-36 bg-neutral-50 px-4 py-2 text-[11px] font-medium text-neutral-500">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-[12px] text-neutral-800">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onDismiss(notification.id)}>
                <Archive size={13} />
                Archiver
              </Button>
              {notification.actionUrl && (
                <Button type="button" onClick={() => onFollow(notification)}>
                  Ouvrir la source
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[12px] font-medium text-neutral-800">{value}</p>
    </div>
  );
}
