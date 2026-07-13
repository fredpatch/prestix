import { Eye, EyeOff } from "lucide-react";
import React from "react";

interface EyeToggleProps {
  show: boolean;
  onToggle: () => void;
}

export function EyeToggle({ show, onToggle }: EyeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-r"
      aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}
