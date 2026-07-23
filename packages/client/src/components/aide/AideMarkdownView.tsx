import { useMemo } from "react";
import { marked } from "marked";
import { CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared by AidePage.tsx (full page) and HelpPanel.tsx (slide-out) so the
// markdown styling and empty-state only exist in one place.
export function AideMarkdownView({ content, className }: { content: string | null; className?: string }) {
  const html = useMemo(() => (content ? (marked.parse(content) as string) : ""), [content]);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400">
        <CircleDashed size={28} className="mb-2" />
        <p className="text-[13px]">Cette rubrique n'est pas encore rédigée.</p>
        <p className="text-[11.5px] mt-1">Elle sera complétée dans une prochaine passe.</p>
      </div>
    );
  }

  return (
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
        className,
      )}
      // Content is static, developer-authored markdown bundled at build
      // time (packages/client/src/content/aide/*.md) — not user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
