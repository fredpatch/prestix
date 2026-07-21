import type { ActivityRow } from "@/lib/reporting.api";
import { humanizeAction } from "./action-labels";

interface RecentActivityFeedProps {
  activity: ActivityRow[];
}

// Recent activity - reads the existing audit log, no new tracking.
// Kept short (5 items) so it stays a quick glance, not a full log.
export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[13px] font-semibold text-neutral-900">Dernières opérations</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Activité commerciale et opérationnelle récente.
        </p>
      </div>
      <div className="divide-y divide-neutral-100">
        {activity.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <span className="text-[12px] text-neutral-800">{humanizeAction(a.action)}</span>
              {a.actorName && (
                <p className="mt-0.5 truncate text-[10.5px] text-neutral-500">{a.actorName}</p>
              )}
            </div>
            <span className="shrink-0 text-right text-[10.5px] text-neutral-400">
              {new Date(a.createdAt).toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
        {activity.length === 0 && (
          <p className="px-4 py-6 text-center text-[11.5px] text-neutral-500">
            Aucune activité récente.
          </p>
        )}
      </div>
    </div>
  );
}
