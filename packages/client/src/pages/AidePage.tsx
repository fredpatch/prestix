import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, CircleDashed } from "lucide-react";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useAuth } from "@/App";
import { cn } from "@/lib/utils";
import { AIDE_TOPICS, groupTopicsByModule, type AideTopic, type AideRole } from "@/content/aide";
import { AideMarkdownView } from "@/components/aide/AideMarkdownView";

// Static-markdown manual (mechanism-only pass — see content/aide/index.ts for
// the "why static, not DB-backed" note). Topics without content yet render an
// empty state rather than being hidden, so the page's full intended scope is
// visible even before every module is written up.
//
// Supports deep-linking via ?topic=<slug> so the contextual help trigger
// (HelpPanel's "Voir la page complète") and the header "?" button can land
// on a specific topic directly, not just the default first one.

function visibleTopics(topics: AideTopic[], role?: AideRole): AideTopic[] {
  return topics.filter((t) => !t.roles || (role && t.roles.includes(role)));
}

export default function AidePage() {
  usePageHeader({ title: "Aide" });
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const topics = useMemo(() => visibleTopics(AIDE_TOPICS, user?.role), [user?.role]);
  const groups = useMemo(() => groupTopicsByModule(topics), [topics]);

  const requestedSlug = searchParams.get("topic");
  const [activeSlug, setActiveSlugState] = useState(
    (requestedSlug && topics.some((t) => t.slug === requestedSlug) ? requestedSlug : topics[0]?.slug),
  );

  // If the query param changes (e.g. clicked "Voir la page complète" for a
  // different topic while already on /aide), follow it.
  useEffect(() => {
    if (requestedSlug && topics.some((t) => t.slug === requestedSlug)) {
      setActiveSlugState(requestedSlug);
    }
  }, [requestedSlug, topics]);

  function setActiveSlug(slug: string) {
    setActiveSlugState(slug);
    setSearchParams({ topic: slug }, { replace: true });
  }

  const active = topics.find((t) => t.slug === activeSlug) ?? topics[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
      <aside className="bg-card border border-border rounded-lg p-3 lg:sticky lg:top-4">
        {groups.map((group) => (
          <div key={group.moduleGroup} className="mb-3 last:mb-0">
            <p className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
              {group.moduleGroup}
            </p>
            <nav className="space-y-0.5">
              {group.topics.map((topic) => (
                <button
                  key={topic.slug}
                  onClick={() => setActiveSlug(topic.slug)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors",
                    topic.slug === active?.slug
                      ? "bg-brand-gold-dark/10 text-brand-gold-dark font-medium"
                      : "text-body hover:bg-surface-muted",
                  )}
                >
                  {topic.content ? (
                    <BookOpen size={13} className="shrink-0" />
                  ) : (
                    <CircleDashed size={13} className="shrink-0 text-subtle" />
                  )}
                  <span className="truncate">{topic.title}</span>
                </button>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      <section className="bg-card border border-border rounded-lg px-6 py-6 min-h-[400px]">
        <AideMarkdownView content={active?.content ?? null} />
      </section>
    </div>
  );
}
