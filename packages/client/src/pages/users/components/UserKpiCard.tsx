import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserKpiCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "gold" | "danger" | "success";
}

const toneClasses = {
  neutral: "bg-neutral-50 text-neutral-600 border-neutral-200",
  gold: "bg-brand-gold-light/30 text-brand-gold-dark border-brand-gold/30",
  danger: "bg-red-50 text-red-700 border-red-100",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function UserKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: UserKpiCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            {label}
          </p>
          <p className="mt-1 text-[20px] font-bold text-neutral-900 tabular-nums">{value}</p>
          <p className="mt-1 text-[10.5px] text-neutral-500 truncate">{detail}</p>
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
