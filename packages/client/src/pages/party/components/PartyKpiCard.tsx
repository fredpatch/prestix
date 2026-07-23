import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartyKpiCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "gold" | "danger" | "success";
}

const toneClasses = {
  neutral: "bg-surface-muted text-body border-border",
  gold: "bg-brand-gold-light/30 text-brand-gold-dark border-brand-gold/30",
  danger: "bg-danger-bg text-danger-text border-danger-border",
  success: "bg-success-bg text-success-text border-success-border",
};

export function PartyKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: PartyKpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-[20px] font-bold text-foreground tabular-nums">{value}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground truncate">{detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
            toneClasses[tone],
          )}
        >
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}
