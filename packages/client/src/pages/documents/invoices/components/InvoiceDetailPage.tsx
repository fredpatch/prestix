import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send, Trash2, Plus, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoiceApi, type Invoice } from "@/lib/invoice.api";
import { deliveryNoteApi, type DeliveryNote } from "@/lib/delivery-note.api";
import { useAuth } from "@/App";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { Party, partyApi } from "@/lib/party.api";
import { Installment, paymentApi } from "@/lib/payment.api";
import { IssueInvoiceDialog } from "./IssueInvoiceDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { PaymentPlanCard } from "./PaymentPlanCard";
import { usePageHeader } from "@/components/layouts/lib/page-header";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Brouillon",
  issued: "Émise",
  expired: "Expirée",
  cancelled: "Annulée",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id!);
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [creatingBL, setCreatingBL] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageHeader({
    title: invoice?.number ?? (invoice ? `Brouillon #${invoice.id}` : "Facture"),
    backTo: "/invoices",
  });

  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [newDiscount, setNewDiscount] = useState(0);
  const [addingLine, setAddingLine] = useState(false);

  function load() {
    setLoading(true);
    invoiceApi.getById(invoiceId).then((res) => {
      setInvoice(res.data);
      setLoading(false);
      if (res.data.referrerPartyId) {
        partyApi.getById(res.data.referrerPartyId).then((r) => setReferrer(r.data));
      }

      if (res.data.status === "issued") {
        deliveryNoteApi
          .getByInvoice(invoiceId)
          .then((r) => setDeliveryNote(r.data))
          .catch(() => setDeliveryNote(null));
        paymentApi.listInstallments(invoiceId).then((r) => setInstallments(r.data));
      } else {
        setInstallments([]);
      }
    });
  }

  useEffect(load, [invoiceId]);

  async function handleAddLine() {
    setAddingLine(true);
    setError(null);
    try {
      await invoiceApi.addLine(invoiceId, {
        lineType: "ticket",
        description: newDesc,
        quantity: newQty,
        unitPrice: newPrice,
        discount: newDiscount,
      });
      setNewDesc("");
      setNewQty(1);
      setNewPrice(0);
      setNewDiscount(0);
      load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur.",
      );
    } finally {
      setAddingLine(false);
    }
  }

  async function handleRemoveLine(lineId: number) {
    await invoiceApi.removeLine(invoiceId, lineId);
    load();
  }

  async function handleCreateBL() {
    setCreatingBL(true);
    setError(null);
    try {
      const res = await deliveryNoteApi.create(invoiceId);
      setDeliveryNote(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création du BL.",
      );
    } finally {
      setCreatingBL(false);
    }
  }

  if (loading || !invoice) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const isDraft = invoice.status === "draft";
  const isIssued = invoice.status === "issued";
  const canCancel = isIssued && user && ["admin", "super_admin"].includes(user.role);
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);
  const isFullyPaid = invoice.paymentStatus === "paid";

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {invoice.partySnapshot?.fullName} · {STATUS_LABELS[invoice.status]}
            {invoice.dueDate &&
              ` · échéance ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}`}
            {invoice.proformaId && ` · issue du proforma`}
            {referrer && ` · référent : ${referrer.fullName}`}
          </p>
          {invoice.status === "cancelled" && invoice.cancelReason && (
            <p className="text-[11px] text-red-600 mt-1">Raison : {invoice.cancelReason}</p>
          )}
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <IssueInvoiceDialog
              invoiceId={invoice.id}
              totalAmount={parseFloat(invoice.totalAmount)}
              onIssued={load}
            />
          )}
          {isIssued && !isFullyPaid && (
            <RecordPaymentDialog invoiceId={invoice.id} onRecorded={load} />
          )}
          {isIssued && !deliveryNote && (
            <Button size="sm" variant="outline" onClick={handleCreateBL} disabled={creatingBL}>
              {creatingBL ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              Générer le BL
            </Button>
          )}
          {isIssued && (
            <Button size="sm" variant="outline">
              <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                <Download size={13} /> PDF
              </a>
            </Button>
          )}
          {canCancel && <CancelInvoiceDialog invoiceId={invoice.id} onCancelled={load} />}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600 mb-3">{error}</p>}
      {isIssued && <PaymentPlanCard installments={installments} onChanged={load} />}

      {deliveryNote && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-4 text-[12px] text-emerald-800">
          <span>
            Bon de livraison {deliveryNote.number} généré le{" "}
            {new Date(deliveryNote.issuedAt).toLocaleDateString("fr-FR")}
          </span>

          <a
            href={`/api/delivery-notes/invoice/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-800 underline hover:text-emerald-900 text-[11.5px] font-medium"
          >
            Voir le PDF
          </a>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Qté
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Prix unitaire
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Remise
              </th>
              <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                Total
              </th>
              {isDraft && <th className="px-4 py-2.5 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2.5 text-[12px] text-neutral-800">{l.description}</td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {l.quantity}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {parseFloat(l.unitPrice).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">
                  {parseFloat(l.discount) > 0
                    ? `-${parseFloat(l.discount).toLocaleString("fr-FR")}`
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-[12px] font-medium text-neutral-800 text-right">
                  {parseFloat(l.lineTotal).toLocaleString("fr-FR")}
                </td>
                {isDraft && (
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLine(l.id)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50">
              <td
                colSpan={isDraft ? 5 : 4}
                className="px-4 py-2.5 text-[12px] font-semibold text-neutral-800 text-right"
              >
                Total
              </td>
              <td className="px-4 py-2.5 text-[13px] font-bold text-brand-gold-dark text-right">
                {parseFloat(invoice.totalAmount).toLocaleString("fr-FR")} XAF
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isDraft && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-[11.5px] font-medium text-neutral-800 mb-2.5">Ajouter une ligne</p>
          <div className="flex gap-2">
            <Input
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Qté"
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
              className="w-20"
              min={1}
            />
            <Input
              type="number"
              placeholder="Prix unitaire"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
            {canDiscount && (
              <Input
                type="number"
                placeholder="Remise"
                value={newDiscount}
                onChange={(e) => setNewDiscount(parseFloat(e.target.value) || 0)}
                className="w-28"
              />
            )}
            <Button
              size="sm"
              onClick={handleAddLine}
              disabled={addingLine || !newDesc || newPrice <= 0}
            >
              {addingLine ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
