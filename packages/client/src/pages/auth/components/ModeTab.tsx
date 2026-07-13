import React from "react";
import { cn } from "@/lib/utils";

interface ModeTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export function ModeTab({ active, onClick, label }: ModeTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue",
        active
          ? "bg-brand-gold-dark text-white"
          : "bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
      )}
    >
      {label}
    </button>
  );
}
