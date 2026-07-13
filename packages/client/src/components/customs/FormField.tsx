import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {required && (
          <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-red-50 text-red-500 border border-red-100 leading-none select-none">
            {t("common.required")}
          </span>
        )}
      </div>
      {children}
      <AnimatePresence>
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.14 }}
            className="text-[11px] text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle size={10} className="shrink-0" />
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="text-[10px] text-neutral-500">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
