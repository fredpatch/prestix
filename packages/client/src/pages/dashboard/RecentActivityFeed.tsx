import type { ActivityRow } from "@/lib/reporting.api";
import { humanizeAction } from "./action-labels";

interface RecentActivityFeedProps {
  activity: ActivityRow[];
}

// Recent activity - reads the existing audit log, no new tracking.
// Kept short (5 items) so it stays a quick glance, not a full log.
export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-200">
        <p className="text-[11.5px] font-semibold text-neutral-800">Dernières actions</p>
      </div>
      <div className="divide-y divide-neutral-100">
        {activity.map((a) => (
          <div key={a.id} className="px-4 py-2 flex items-center justify-between">
            <div>
              <span className="text-[12px] text-neutral-800">{humanizeAction(a.action)}</span>
              {a.actorName && <span className="text-[11px] text-neutral-500"> · {a.actorName}</span>}
            </div>
            <span className="text-[10.5px] text-neutral-400">
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
