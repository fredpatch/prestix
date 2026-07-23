import { useMemo, useState } from "react";
import { marked } from "marked";
import { BookOpen, CircleDashed } from "lucide-react";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useAuth } from "@/App";
import { cn } from "@/lib/utils";
import { AIDE_TOPICS, groupTopicsByModule, type AideTopic, type AideRole } from "@/content/aide";

// Static-markdown manual (mechanism-only pass — see content/aide/index.ts for
// the "why static, not DB-backed" note). Topics without content yet render an
// empty state rather than being hidden, so the page's full intended scope is
// visible even before every module is written up.

function visibleTopics(topics: AideTopic[], role?: AideRole): AideTopic[] {
  return topics.filter((t) => !t.roles || (role && t.roles.includes(role)));
}

export default function AidePage() {
  usePageHeader({ title: "Aide" });
  const { user } = useAuth();
  const topics = useMemo(() => visibleTopics(AIDE_TOPICS, user?.role), [user?.role]);
  const groups = useMemo(() => groupTopicsByModule(topics), [topics]);
  const [activeSlug, setActiveSlug] = useState(topics[0]?.slug);

  const active = topics.find((t) => t.slug === activeSlug) ?? topics[0];
  const html = useMemo(
    () => (active?.content ? (marked.parse(active.content) as string) : ""),
    [active],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
      <aside className="bg-white border border-neutral-200 rounded-lg p-3 lg:sticky lg:top-4">
        {groups.map((group) => (
          <div key={group.moduleGroup} className="mb-3 last:mb-0">
            <p className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
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
                      : "text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  {topic.content ? (
                    <BookOpen size={13} className="shrink-0" />
                  ) : (
                    <CircleDashed size={13} className="shrink-0 text-neutral-300" />
                  )}
                  <span className="truncate">{topic.title}</span>
                </button>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      <section className="bg-white border border-neutral-200 rounded-lg px-6 py-6 min-h-[400px]">
        {active?.content ? (
          <div
            className={cn(
              "text-[13px] leading-relaxed text-neutral-800",
              "[&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:first:mt-0",
              "[&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_h3]:mt-4 [&_h3]:mb-1.5",
              "[&_p]:mb-3",
              "[&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1",
              "[&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1",
              "[&_strong]:font-semibold [&_strong]:text-neutral-900",
              "[&_code]:bg-neutral-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11.5px] [&_code]:font-mono",
              "[&_table]:w-full [&_table]:mb-3 [&_table]:border [&_table]:border-neutral-200 [&_table]:text-[12px]",
              "[&_th]:border [&_th]:border-neutral-200 [&_th]:bg-neutral-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold",
              "[&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top",
            )}
            // Content is static, developer-authored markdown bundled at build
            // time (packages/client/src/content/aide/*.md) — not user input.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400">
            <CircleDashed size={28} className="mb-2" />
            <p className="text-[13px]">Cette rubrique n'est pas encore rédigée.</p>
            <p className="text-[11.5px] mt-1">Elle sera complétée dans une prochaine passe.</p>
          </div>
        )}
      </section>
    </div>
  );
}
