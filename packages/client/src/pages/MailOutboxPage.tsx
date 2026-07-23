import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Info, RefreshCw, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import type { MailOutboxItem } from "@/lib/notification.api";
import { useMailOutboxList, useMailOutboxTemplateKeys } from "@/hooks/queries/useMailOutboxList";
import { useRetryMailOutboxItem } from "@/hooks/mutations/useRetryMailOutboxItem";
import { usePageHeader } from "@/components/layouts/lib/page-header";

// Pure display + retry layer over the mail_outbox table every document-email
// send writes to via sendTrackedMail(). Admin+ only (matches the existing
// /notifications/mail/outbox route gating) — own top-level nav item rather
// than folding into Notifications, since this page adds filters/pagination/
// retry that don't fit the lightweight dashboard widget already there.

const PAGE_SIZE = 15;

// sourceType -> route builder for the "Source" column link. Delivery notes
// are deliberately excluded: sendDeliveryNoteEmail's sourceId is the
// delivery note's own id, not the parent invoice's, and there's no
// standalone delivery-note detail route to link to (they live inside
// InvoiceDetailPage) — showing plain text there is correct, a guessed link
// would be wrong more often than not.
const SOURCE_ROUTE: Record<string, (id: string) => string> = {
  invoices: (id) => `/invoices/${id}`,
  proformas: (id) => `/proformas/${id}`,
};

const STATUS_LABELS: Record<string, string> = { sent: "Envoyé", failed: "Échec", pending: "En attente" };

function formatDateTime(value: string): string {
  return format(parseISO(value), "dd MMM yyyy HH:mm", { locale: fr });
}

function humanizeTemplateKey(key: string): string {
  return key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function statusTone(status: string): string {
  if (status === "sent") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-red-100 bg-red-50 text-red-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

export default function MailOutboxPage() {
  usePageHeader({
    title: "Historique des emails",
    helpTopic: "mail-outbox",
    guide: {
      steps: [
        "Filtrez par statut, modèle, document source, destinataire ou date.",
        "« Réessayer » n'apparaît que sur les envois en échec.",
      ],
      tip: "Un réessai régénère le contenu depuis l'état actuel du document, pas depuis le contenu du premier envoi.",
    },
  });

  const [status, setStatus] = useState<"pending" | "sent" | "failed" | undefined>(undefined);
  const [templateKey, setTemplateKey] = useState<string | undefined>(undefined);
  const [recipient, setRecipient] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState<MailOutboxItem | null>(null);

  const filters = {
    status,
    templateKey,
    recipient: recipient || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  // isFetching drives the inline spinner — same reasoning as AuditLogPage:
  // placeholderData keeps the previous page's rows on screen during a
  // refetch, so isLoading alone stays false after the first load.
  const { data, isLoading, isFetching } = useMailOutboxList({ ...filters, page, pageSize: PAGE_SIZE });
  const { data: templateKeys = [] } = useMailOutboxTemplateKeys();
  const retryMutation = useRetryMailOutboxItem();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  function resetFilters() {
    setStatus(undefined);
    setTemplateKey(undefined);
    setRecipient("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  function sourceLink(item: MailOutboxItem): { label: string; href?: string } {
    if (!item.sourceType || !item.sourceId) return { label: "—" };
    const label = `${item.sourceType} #${item.sourceId}`;
    const buildRoute = SOURCE_ROUTE[item.sourceType];
    return buildRoute ? { label, href: buildRoute(item.sourceId) } : { label };
  }

  const columns: ColumnDef<MailOutboxItem, any>[] = [
    {
      accessorKey: "createdAt",
      header: "Date / heure",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-600">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "recipient",
      header: "Destinataire",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">{row.original.recipient}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: "Sujet",
      cell: ({ row }) => (
        <span className="max-w-[280px] truncate text-[12px] text-neutral-800" title={row.original.subject}>
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "templateKey",
      header: "Modèle",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">{humanizeTemplateKey(row.original.templateKey)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => (
        <span className={cn("rounded border px-2 py-0.5 text-[10.5px] font-semibold", statusTone(row.original.status))}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </span>
      ),
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) => {
        const { label, href } = sourceLink(row.original);
        if (!href) return <span className="text-[12px] text-neutral-400">{label}</span>;
        return (
          <Link to={href} className="inline-flex items-center gap-1 text-[12px] text-blue-600 hover:underline">
            {label}
            <ExternalLink size={11} />
          </Link>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setDetailItem(row.original)}
            className="text-neutral-400 hover:text-neutral-600"
            title="Détails"
          >
            <Info size={14} />
          </button>
          {row.original.status === "failed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              disabled={retryMutation.isPending && retryMutation.variables === row.original.id}
              onClick={() => retryMutation.mutate(row.original.id)}
              title="Renvoyer cet email"
            >
              {retryMutation.isPending && retryMutation.variables === row.original.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Renvoyer
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        Historique complet des emails envoyés par l'application (factures, proformas, bons de
        livraison, rappels).
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select
          value={status ?? "__all__"}
          onValueChange={(v) => {
            setStatus(v === "__all__" ? undefined : (v as "pending" | "sent" | "failed"));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={templateKey ?? "__all__"}
          onValueChange={(v) => {
            setTemplateKey(v === "__all__" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Tous les modèles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les modèles</SelectItem>
            {templateKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {humanizeTemplateKey(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={recipient}
          onChange={(e) => {
            setRecipient(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher un destinataire..."
          className="w-56"
        />

        <DatePicker
          value={from}
          onChange={(v) => {
            setFrom(v);
            setPage(1);
          }}
          placeholder="Depuis"
          className="w-40"
        />
        <DatePicker
          value={to}
          onChange={(v) => {
            setTo(v);
            setPage(1);
          }}
          placeholder="Jusqu'à"
          className="w-40"
        />

        <Button variant="secondary" size="sm" onClick={resetFilters}>
          Réinitialiser
        </Button>

        {isFetching && (
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Loader2 size={12} className="animate-spin" />
            Recherche...
          </span>
        )}
      </div>

      <DataTable columns={columns} data={rows} loading={isLoading} emptyMessage="Aucun email trouvé." />

      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-neutral-500">
          {total} email{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
          </Button>
          <span className="text-[11px] text-neutral-500">
            Page {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>

      <MailOutboxDetailDialog item={detailItem} onOpenChange={(open) => !open && setDetailItem(null)} />
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-[12.5px] text-neutral-800">{value}</p>
    </div>
  );
}

function MailOutboxDetailDialog({
  item,
  onOpenChange,
}: {
  item: MailOutboxItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-white sm:max-w-lg">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-neutral-950">{item.subject}</DialogTitle>
              <DialogDescription className="mt-1 text-[12px] text-neutral-500">
                {formatDateTime(item.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailStat label="Destinataire" value={item.recipient} />
              <DetailStat label="Statut" value={STATUS_LABELS[item.status] ?? item.status} />
              <DetailStat label="Modèle" value={humanizeTemplateKey(item.templateKey)} />
              <DetailStat label="Tentatives" value={String(item.retryCount)} />
              {item.sentAt && <DetailStat label="Envoyé le" value={formatDateTime(item.sentAt)} />}
              {item.messageId && <DetailStat label="Message ID" value={item.messageId} />}
            </div>

            {item.errorMessage && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-400">Erreur</p>
                <p className="mt-1 text-[12.5px] text-red-700">{item.errorMessage}</p>
              </div>
            )}

            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-left">
                  <tbody>
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <tr key={key} className="border-b border-neutral-100 last:border-0">
                        <td className="w-36 bg-neutral-50 px-4 py-2 text-[11px] font-medium text-neutral-500">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-[12px] text-neutral-800 break-all">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
