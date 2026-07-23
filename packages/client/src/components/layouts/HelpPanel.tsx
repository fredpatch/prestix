import { Link } from "react-router-dom";
import { ExternalLink, Compass } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/App";
import { AIDE_TOPICS, groupTopicsByModule, type AideTopic, type AideRole } from "@/content/aide";
import { AideMarkdownView } from "@/components/aide/AideMarkdownView";

function visibleTopics(topics: AideTopic[], role?: AideRole): AideTopic[] {
  return topics.filter((t) => !t.roles || (role && t.roles.includes(role)));
}

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicSlug?: string;
  onTopicChange: (slug: string) => void;
}

// Contextual help: opens pre-scrolled to the topic the current page declared
// via usePageHeader({ helpTopic }). The dropdown lets the person browse to a
// different topic without leaving the page; "Voir la page complète" hands
// off to the full /aide page (with sidebar) for when the panel's width is
// too tight — e.g. long tables.
//
// IMPORTANT: topicSlug being undefined means "this page has no dedicated
// Aide topic yet" (e.g. Notifications, Journal d'audit, Historique emails,
// Demandes de modification). That must NOT silently fall back to the first
// topic (Parties) — it's misleading, looks like a real answer. Show a
// neutral browse-prompt instead until the person picks one explicitly.
export function HelpPanel({ open, onOpenChange, topicSlug, onTopicChange }: HelpPanelProps) {
  const { user } = useAuth();
  const topics = visibleTopics(AIDE_TOPICS, user?.role);
  const groups = groupTopicsByModule(topics);
  const active = topicSlug ? topics.find((t) => t.slug === topicSlug) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Aide</SheetTitle>
          <SheetDescription>
            {active
              ? "Rubrique liée à la page en cours — changez-la si besoin."
              : "Cette page n'a pas encore de rubrique dédiée — choisissez-en une."}
          </SheetDescription>
        </SheetHeader>

        <Select value={active?.slug ?? ""} onValueChange={onTopicChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir une rubrique" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <div key={group.moduleGroup}>
                <p className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
                  {group.moduleGroup}
                </p>
                {group.topics.map((topic) => (
                  <SelectItem key={topic.slug} value={topic.slug}>
                    {topic.title}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 overflow-y-auto pr-1">
          {active ? (
            <AideMarkdownView content={active.content} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400">
              <Compass size={28} className="mb-2" />
              <p className="text-[13px]">Pas de rubrique dédiée à cette page pour le moment.</p>
              <p className="text-[11.5px] mt-1">Choisissez une rubrique ci-dessus pour parcourir l'aide.</p>
            </div>
          )}
        </div>

        {active && (
          <Link
            to={`/aide?topic=${active.slug}`}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-brand-gold-dark hover:underline shrink-0"
          >
            <ExternalLink size={12} /> Voir la page complète
          </Link>
        )}
      </SheetContent>
    </Sheet>
  );
}
