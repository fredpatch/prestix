import { useAuth } from "@/App";
import type { Installment } from "@/lib/payment.api";
import { RescheduleInstallmentDialog } from "./RescheduleInstallmentDialog";

interface PaymentPlanCardProps {
  installments: Installment[];
  onChanged: () => void;
}

const STATUS_STYLES: Record<Installment["status"], string> = {
  unpaid: "bg-surface-subtle text-body",
  partial: "bg-warning-bg text-warning-text",
  paid: "bg-success-bg text-success-text",
};

const STATUS_LABELS: Record<Installment["status"], string> = {
  unpaid: "Non payée",
  partial: "Partielle",
  paid: "Payée",
};

export function PaymentPlanCard({ installments, onChanged }: PaymentPlanCardProps) {
  const { user } = useAuth();
  const canReschedule = user && ["admin", "super_admin"].includes(user.role);

  if (installments.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-[11.5px] font-semibold text-body">Échéancier</p>
      </div>
      <table className="w-full text-left">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Échéance
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Date prévue
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
              Attendu
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
              Payé
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
              Pénalité due
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statut
            </th>
            {canReschedule && <th className="px-4 py-2 w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {installments.map((inst) => (
            <tr key={inst.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2 text-[12px] text-body">
                #{inst.sequence}
                {inst.sequence === 1 && (
                  <span className="text-[10px] text-muted-foreground ml-1">(avance)</span>
                )}
              </td>
              <td className="px-4 py-2 text-[12px] text-muted-foreground">
                {new Date(inst.expectedDate).toLocaleDateString("fr-FR")}
                {inst.rescheduledFrom && (
                  <span className="text-[10px] text-warning-text ml-1">
                    (reprogrammée, était le{" "}
                    {new Date(inst.rescheduledFrom).toLocaleDateString("fr-FR")})
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-[12px] text-muted-foreground text-right">
                {parseFloat(inst.expectedAmount).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-2 text-[12px] text-body text-right">
                {parseFloat(inst.paidAmount).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-2 text-[12px] text-right">
                {parseFloat(inst.penaltyDue) > 0 ? (
                  <span className="text-danger-text font-medium">
                    {parseFloat(inst.penaltyDue).toLocaleString("fr-FR")} XAF
                  </span>
                ) : parseFloat(inst.penaltyAccrued) > 0 ? (
                  <span className="text-subtle">réglée</span>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_STYLES[inst.status]}`}
                >
                  {STATUS_LABELS[inst.status]}
                </span>
              </td>
              {canReschedule && (
                <td className="px-4 py-2 text-right">
                  {inst.status !== "paid" && (
                    <RescheduleInstallmentDialog installment={inst} onRescheduled={onChanged} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
