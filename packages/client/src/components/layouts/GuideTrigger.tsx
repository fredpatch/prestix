import { Link } from "react-router-dom";
import { HelpCircle, ExternalLink } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { usePageHeaderValue } from "./lib/page-header";

// Only renders when the current page registered a guide via
// usePageHeader({ guide }). Deliberately separate from the header "?" button
// (HelpPanel, full Aide topic): this is short, page-specific, action-oriented
// — "what do I do here" — not exhaustive reference material. "En savoir
// plus" links into the matching Aide topic for the deeper version, when the
// page has one.
export function GuideTrigger() {
  const pageHeader = usePageHeaderValue();
  const guide = pageHeader?.guide;

  if (!guide || guide.steps.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 rounded-full bg-brand-gold-dark px-3.5 py-2.5 text-[12px] font-medium text-white shadow-lg transition-transform hover:scale-105"
          title="Besoin d'aide ?"
        >
          <HelpCircle size={15} />
          <span className="hidden sm:inline">Besoin d'aide ?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[300px] p-4">
        <p className="mb-2 text-[12.5px] font-semibold text-neutral-900">Sur cette page</p>
        <ol className="mb-2 space-y-1.5 pl-4 text-[12px] text-neutral-700 list-decimal">
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {guide.tip && <p className="mb-2 text-[11.5px] text-neutral-500 italic">{guide.tip}</p>}
        {pageHeader?.helpTopic && (
          <Link
            to={`/aide?topic=${pageHeader.helpTopic}`}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-brand-gold-dark hover:underline"
          >
            <ExternalLink size={11} /> En savoir plus
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
