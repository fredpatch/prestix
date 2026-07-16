import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { commissionApi, type CommissionEditRequest, type CommissionTransaction } from "@/lib/commission.api";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { usersApi, type User } from "@/lib/users.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageHeader } from "@/components/layouts/lib/page-header";

const FIELD_LABELS: Record<string, string> = {
  date: "Date",
  commissionAmount: "Montant",
  note: "Note",
  clientPartyId: "Client",
  referrerPartyId: "Référent",
  details: "Champs spécifiques",
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (key === "date") return new Date(value as string).toLocaleDateString("fr-FR");
  if (key === "commissionAmount") return `${Number(value).toLocaleString("fr-FR")} XAF`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function CommissionEditQueuePage() {
  const [requests, setRequests] = useState<CommissionEditRequest[]>([]);
  const [transactions, setTransactions] = useState<Record<number, CommissionTransaction>>({});
  const [users, setUsers] = useState<Record<number, User>>({});
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  usePageHeader({ title: "Demandes de modification" });

  function load() {
    setLoading(true);
    commissionApi.listEditRequests("pending").then(async (res) => {
      setRequests(res.data);

      // Pull in whatever context the review UI needs to show something
      // meaningful instead of raw IDs — the underlying transaction (for
      // "before" values), the requesting agent's name, and type labels.
      const [allCommissions, allUsers, allTypes] = await Promise.all([
        commissionApi.list({ includeInactive: true }),
        usersApi.list({}),
        commissionCatalogApi.list(),
      ]);
      setTransactions(Object.fromEntries(allCommissions.data.map((c) => [c.id, c])));
      setUsers(Object.fromEntries(allUsers.data.data.map((u: User) => [u.id, u])));
      setTypes(allTypes.data);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function handleApprove(requestId: number) {
    setBusyId(requestId);
    try {
      await commissionApi.approveEditRequest(requestId);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requestId: number) {
    setBusyId(requestId);
    try {
      await commissionApi.rejectEditRequest(requestId, rejectNote || undefined);
      setRejectingId(null);
      setRejectNote("");
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        {requests.length} demande{requests.length !== 1 ? "s" : ""} en attente
      </p>

      {requests.length === 0 ? (
        <p className="text-[12px] text-neutral-500">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const transaction = transactions[req.commissionTransactionId];
            const requester = users[req.requestedBy];
            const typeLabel = transaction ? types.find((t) => t.code === transaction.type)?.label : undefined;

            return (
              <div key={req.id} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-800">
                      {typeLabel ?? transaction?.type ?? "Commission"} — demandé par{" "}
                      {requester?.fullName ?? `Agent #${req.requestedBy}`}
                    </p>
                    <p className="text-[10.5px] text-neutral-500">
                      {new Date(req.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                <p className="text-[11.5px] text-neutral-700 bg-neutral-50 rounded px-3 py-2 mb-3">
                  <span className="font-medium">Raison : </span>
                  {req.reason}
                </p>

                <table className="w-full text-left mb-3">
                  <thead>
                    <tr>
                      <th className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 pb-1">
                        Champ
                      </th>
                      <th className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 pb-1">
                        Actuel
                      </th>
                      <th className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 pb-1">
                        Proposé
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(req.proposedChanges).map(([key, newValue]) => {
                      const currentValue = transaction
                        ? (transaction as unknown as Record<string, unknown>)[key]
                        : undefined;
                      return (
                        <tr key={key} className="border-t border-neutral-100">
                          <td className="text-[12px] text-neutral-600 py-1.5">{FIELD_LABELS[key] ?? key}</td>
                          <td className="text-[12px] text-neutral-500 py-1.5">{formatValue(key, currentValue)}</td>
                          <td className="text-[12px] font-medium text-emerald-700 py-1.5">
                            {formatValue(key, newValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {rejectingId === req.id ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Motif du refus (optionnel)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className="flex-1 h-8 text-[12px]"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={busyId === req.id}>
                      Confirmer le refus
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setRejectingId(null)}>
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(req.id)} disabled={busyId === req.id}>
                      <X size={13} /> Refuser
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(req.id)} disabled={busyId === req.id}>
                      {busyId === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Approuver
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
