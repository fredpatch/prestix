import React from "react";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTabProps {
  active: boolean;
  completed: boolean;
  step: number;
  label: string;
}

export function StepTab({ active, completed, step, label }: StepTabProps) {
  return (
    <div
      className={cn(
        "flex-1 flex items-center gap-2 px-5 py-3 text-[11px] font-medium transition-colors select-none",
        active && "bg-neutral-50 text-brand-gold-dark",
        completed && "text-emerald-600",
        !active && !completed && "text-neutral-500",
      )}
    >
      <span
        className={cn(
          "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors",
          active && "bg-brand-gold-dark text-white",
          completed && "bg-emerald-600 text-white",
          !active && !completed && "bg-neutral-200 text-neutral-500",
        )}
      >
        {completed ? <CheckCircle2 size={11} /> : step}
      </span>
      {label}
    </div>
  );
}
