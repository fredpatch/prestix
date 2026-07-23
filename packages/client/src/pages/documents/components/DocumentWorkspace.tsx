import type React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentLineView } from "@/lib/proforma.api";

export type DocumentTone = "neutral" | "gold" | "success" | "warning" | "danger" | "blue";

const toneClasses: Record<DocumentTone, string> = {
  neutral: "border-border bg-surface-muted text-body",
  gold: "border-brand-gold-light/70 bg-brand-gold-light/20 text-brand-gold-dark",
  success: "border-success-border bg-success-bg text-success-text",
  warning: "border-warning-border bg-warning-bg text-warning-text",
  danger: "border-danger-border bg-danger-bg text-danger-text",
  blue: "border-info-border bg-info-bg text-info-text",
};

export function money(value: string | number): string {
  const amount = typeof value === "number" ? value : parseFloat(value || "0");
  return `${amount.toLocaleString("fr-FR")} XAF`;
}

export function fmtDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

export function fmtDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

export function documentTotal(lines: DocumentLineView[]): number {
  return lines.reduce((sum, line) => sum + parseFloat(line.lineTotal), 0);
}

export function lineTypeLabel(type: string): string {
  if (type === "ticket") return "Billet";
  if (type === "shop") return "PrestiShop";
  return type;
}

export function linePassenger(line: DocumentLineView): string | undefined {
  return line.ticketDetails?.passengerName ?? line.shopDetails?.passengerName;
}

export function lineRoute(line: DocumentLineView): string | undefined {
  const segment = line.ticketDetails?.segments?.[0];
  if (!segment) return undefined;
  return `${segment.from} -> ${segment.to}`;
}

export function lineSummary(lines: DocumentLineView[]): string {
  const ticketCount = lines.filter((line) => line.lineType === "ticket").length;
  const shopCount = lines.filter((line) => line.lineType === "shop").length;
  return [
    `${lines.length} ligne${lines.length > 1 ? "s" : ""}`,
    ticketCount > 0 ? `${ticketCount} billet${ticketCount > 1 ? "s" : ""}` : "",
    shopCount > 0 ? `${shopCount} shop` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}

export function DocumentStatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: DocumentTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded border px-2 py-0.5 text-[10.5px] font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function DocumentKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: DocumentTone;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 break-words text-[clamp(16px,5vw,20px)] font-bold leading-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full border",
            toneClasses[tone],
          )}
        >
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}

export function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 truncate text-[12px] font-medium text-body">{value}</p>
    </div>
  );
}

export function DocumentPartySummary({
  title,
  name,
  phone,
  email,
  referrer,
}: {
  title: string;
  name?: string;
  phone?: string;
  email?: string;
  referrer?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-[15px] font-bold text-foreground">{name ?? "Client non renseigne"}</p>
      <div className="mt-3 grid gap-2 text-[11.5px] text-body sm:grid-cols-2">
        <MiniField label="Telephone" value={phone ?? "-"} />
        <MiniField label="Email" value={email ?? "-"} />
        {referrer && <MiniField label="Referent" value={referrer} />}
      </div>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-0.5 truncate text-[12px] text-body">{value}</p>
    </div>
  );
}

export function DocumentLineCard({
  line,
  actions,
}: {
  line: DocumentLineView;
  actions?: React.ReactNode;
}) {
  const passenger = linePassenger(line);
  const route = lineRoute(line);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-foreground">{line.description}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            {lineTypeLabel(line.lineType)}
            {passenger ? ` / ${passenger}` : ""}
            {route ? ` / ${route}` : ""}
          </p>
        </div>
        {actions}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <MiniFact label="Qte" value={String(line.quantity)} />
        <MiniFact label="Unite" value={money(line.unitPrice)} />
        <MiniFact label="Total" value={money(line.lineTotal)} />
      </div>
    </div>
  );
}

export function DocumentEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
      <p className="text-[12px] font-semibold text-body">{title}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

export function DocumentPreviewToggle({
  visible,
  onToggle,
  className,
}: {
  visible: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn("gap-1.5", className)}
    >
      {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      {visible ? "Masquer l'apercu" : "Afficher l'apercu"}
    </Button>
  );
}

export function DocumentPaperPreview({
  title,
  number,
  status,
  partyName,
  partyContact,
  issuedLabel,
  dueLabel,
  lines,
  total,
  footer,
}: {
  title: string;
  number: string;
  status?: React.ReactNode;
  partyName?: string;
  partyContact?: string;
  issuedLabel: string;
  dueLabel: string;
  lines: DocumentLineView[];
  total: string;
  footer?: React.ReactNode;
}) {
  return (
    <aside className="rounded-lg border border-border bg-surface-muted p-3 lg:sticky lg:top-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[20px] font-bold leading-none text-foreground">{title}</p>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">{number}</p>
          </div>
          {status}
        </div>

        <div className="grid gap-4 border-b border-border py-4 sm:grid-cols-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
              Client
            </p>
            <p className="mt-1 text-[12.5px] font-semibold text-foreground">
              {partyName ?? "Client non renseigne"}
            </p>
            {partyContact && <p className="mt-0.5 text-[11px] text-muted-foreground">{partyContact}</p>}
          </div>
          <div className="grid gap-2 text-left sm:text-right">
            <MiniField label="Date" value={issuedLabel} />
            <MiniField label="Echeance" value={dueLabel} />
          </div>
        </div>

        <div className="py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_54px_84px] gap-3 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wide text-subtle">
            <span>Service</span>
            <span className="text-right">Qte</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">Aucune ligne.</p>
            ) : (
              lines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-[minmax(0,1fr)_54px_84px] gap-3 py-3 text-[11.5px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{line.description}</p>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                      {lineTypeLabel(line.lineType)}
                    </p>
                  </div>
                  <p className="text-right tabular-nums text-body">{line.quantity}</p>
                  <p className="text-right font-semibold tabular-nums text-foreground">
                    {money(line.lineTotal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-[15px] font-bold tabular-nums text-brand-gold-dark">{total}</p>
          </div>
          {footer && <div className="mt-4 text-[11px] text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </aside>
  );
}
