import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { type CommissionTransaction } from "@/lib/commission.api";
import { type User } from "@/lib/users.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useCommissionEditRequests } from "@/hooks/queries/useCommissionEditRequests";
import { useCommissionAll } from "@/hooks/queries/useCommissionAll";
import { useUsers } from "@/hooks/queries/useUsers";
import { useCommissionTypes } from "@/hooks/queries/useCommissionTypes";
import { useApproveCommissionEditRequestMutation } from "@/hooks/mutations/useApproveCommissionEditRequest";
import { useRejectCommissionEditRequestMutation } from "@/hooks/mutations/useRejectCommissionEditRequest";

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
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  usePageHeader({ title: "Demandes de modification" });

  const { data: requests = [], isLoading: loadingRequests } = useCommissionEditRequests();
  const { data: transactionList = [] } = useCommissionAll();
  const transactions: Record<number, CommissionTransaction> = Object.fromEntries(
    transactionList.map((c) => [c.id, c]),
  );

  const { data: userList } = useUsers({});
  const users: Record<number, User> = Object.fromEntries(
    (userList?.data ?? []).map((u: User) => [u.id, u]),
  );

  const { data: types = [] } = useCommissionTypes();

  const approveMutation = useApproveCommissionEditRequestMutation();
  const rejectMutation = useRejectCommissionEditRequestMutation();

  const isLoading = loadingRequests;
  const busyId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables?.requestId
      : null;

  function handleApprove(requestId: number) {
    approveMutation.mutate(requestId);
  }

  function handleReject(requestId: number) {
    rejectMutation.mutate(
      { requestId, note: rejectNote || undefined },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectNote("");
        },
      },
    );
  }

  if (isLoading) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

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
