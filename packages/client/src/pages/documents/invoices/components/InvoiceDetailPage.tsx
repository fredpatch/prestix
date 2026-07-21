import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  Banknote,
  CalendarClock,
  Check,
  Download,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Invoice } from "@/lib/invoice.api";
import type { DocumentLineView } from "@/lib/proforma.api";
import { type DeliveryNote, deliveryNoteApi } from "@/lib/delivery-note.api";
import { useAuth } from "@/App";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { Party, partyApi } from "@/lib/party.api";
import { Installment, paymentApi } from "@/lib/payment.api";
import { IssueInvoiceDialog } from "./IssueInvoiceDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { PaymentPlanCard } from "./PaymentPlanCard";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { queryKeys } from "@/lib/query-keys";
import { useInvoice } from "@/hooks/queries/useInvoice";
import { useAddInvoiceLineMutation } from "@/hooks/mutations/useAddInvoiceLine";
import { useRemoveInvoiceLineMutation } from "@/hooks/mutations/useRemoveInvoiceLine";
import { useUpdateInvoiceLineMutation } from "@/hooks/mutations/useUpdateInvoiceLine";
import { useCreateDeliveryNoteMutation } from "@/hooks/mutations/useCreateDeliveryNote";
import { useSendDocumentEmailMutation } from "@/hooks/mutations/useSendDocumentEmail";
import { cn } from "@/lib/utils";
import {
  DocumentKpiCard,
  DocumentEmptyState,
  DocumentLineCard,
  DocumentPaperPreview,
  DocumentPartySummary,
  DocumentPreviewToggle,
  DocumentStatusBadge,
  documentTotal,
  fmtDate,
  fmtDateTime,
  lineSummary,
  money,
  type DocumentTone,
} from "@/pages/documents/components/DocumentWorkspace";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Brouillon",
  issued: "Emise",
  expired: "Expiree",
  cancelled: "Annulee",
};

const STATUS_TONES: Record<Invoice["status"], DocumentTone> = {
  draft: "warning",
  issued: "success",
  expired: "warning",
  cancelled: "danger",
};

const PAYMENT_LABELS: Record<Invoice["paymentStatus"], string> = {
  unpaid: "Impayee",
  partial: "Partielle",
  paid: "Payee",
};

const PAYMENT_TONES: Record<Invoice["paymentStatus"], DocumentTone> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
};

interface LineDraft {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

function toDraft(l: DocumentLineView): LineDraft {
  return {
    description: l.description,
    quantity: l.quantity,
    unitPrice: parseFloat(l.unitPrice),
    discount: parseFloat(l.discount),
  };
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id!);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);

  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [newDiscount, setNewDiscount] = useState(0);

  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editDraft, setEditDraft] = useState<LineDraft>({ description: "", quantity: 1, unitPrice: 0, discount: 0 });

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const addLineMutation = useAddInvoiceLineMutation(invoiceId);
  const removeLineMutation = useRemoveInvoiceLineMutation(invoiceId);
  const updateLineMutation = useUpdateInvoiceLineMutation(invoiceId);
  const createBLMutation = useCreateDeliveryNoteMutation();
  const sendEmailMutation = useSendDocumentEmailMutation();

  usePageHeader({
    title: invoice?.number ?? (invoice ? `Brouillon #${invoice.id}` : "Facture"),
    backTo: "/invoices",
  });

  useEffect(() => {
    let cancelled = false;
    setReferrer(null);

    if (!invoice?.referrerPartyId) return;

    partyApi.getById(invoice.referrerPartyId).then((r) => {
      if (!cancelled) setReferrer(r.data);
    });

    return () => {
      cancelled = true;
    };
  }, [invoice?.referrerPartyId]);

  useEffect(() => {
    let cancelled = false;
    setDeliveryNote(null);
    setInstallments([]);

    if (!invoice || invoice.status !== "issued") return;

    deliveryNoteApi
      .getByInvoice(invoiceId)
      .then((r) => {
        if (!cancelled) setDeliveryNote(r.data);
      })
      .catch(() => {
        if (!cancelled) setDeliveryNote(null);
      });

    paymentApi.listInstallments(invoiceId).then((r) => {
      if (!cancelled) setInstallments(r.data);
    });

    return () => {
      cancelled = true;
    };
  }, [invoice, invoiceId]);

  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
  }

  function handleAddLine() {
    addLineMutation.mutate(
      { lineType: "shop", description: newDesc, quantity: newQty, unitPrice: newPrice, discount: newDiscount },
      {
        onSuccess: () => {
          setNewDesc("");
          setNewQty(1);
          setNewPrice(0);
          setNewDiscount(0);
        },
      },
    );
  }

  function handleRemoveLine(lineId: number) {
    removeLineMutation.mutate(lineId);
  }

  function startEdit(l: DocumentLineView) {
    setEditingLineId(l.id);
    setEditDraft(toDraft(l));
  }

  function handleSaveEdit(lineId: number) {
    updateLineMutation.mutate(
      { lineId, patch: editDraft },
      { onSuccess: () => setEditingLineId(null) },
    );
  }

  function handleCreateBL() {
    createBLMutation.mutate(invoiceId, {
      onSuccess: (data) => setDeliveryNote(data),
    });
  }

  function handleSendInvoiceEmail() {
    if (!invoice) return;
    sendEmailMutation.mutate({ kind: "invoice", id: invoice.id });
  }

  function handleSendDeliveryNoteEmail() {
    if (!invoice) return;
    sendEmailMutation.mutate({ kind: "delivery-note", invoiceId: invoice.id });
  }

  if (isLoading || !invoice) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const isDraft = invoice.status === "draft";
  const isEditableDraft = isDraft && !invoice.proformaId;
  const isIssued = invoice.status === "issued";
  const canCancel = isIssued && user && ["admin", "super_admin"].includes(user.role);
  const canDiscount = user && ["manager", "admin", "super_admin"].includes(user.role);
  const isFullyPaid = invoice.paymentStatus === "paid";
  const hasRecipientEmail = Boolean(invoice.partySnapshot?.email);
  const totalAmount = parseFloat(invoice.totalAmount);
  const paidAmount = installments.reduce((sum, item) => sum + parseFloat(item.paidAmount), 0);
  const openAmount = Math.max(0, totalAmount - paidAmount);
  const dueTime = invoice.dueDate ? new Date(invoice.dueDate).getTime() : undefined;
  const isOverdue = Boolean(isIssued && !isFullyPaid && dueTime && dueTime < Date.now());

  return (
    <div className="space-y-5">
      <div className="grid gap-4 border-b border-neutral-200 pb-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge label={STATUS_LABELS[invoice.status]} tone={STATUS_TONES[invoice.status]} />
            <DocumentStatusBadge label={PAYMENT_LABELS[invoice.paymentStatus]} tone={PAYMENT_TONES[invoice.paymentStatus]} />
            {isOverdue && <DocumentStatusBadge label="En retard" tone="danger" />}
            {invoice.proformaId && <DocumentStatusBadge label="Issue d'un proforma" tone="blue" />}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-neutral-500">
            {invoice.partySnapshot?.fullName ?? "Client non renseigne"} / creee le {fmtDateTime(invoice.createdAt)}
            {invoice.dueDate ? ` / echeance ${fmtDate(invoice.dueDate)}` : ""}
            {referrer ? ` / referent : ${referrer.fullName}` : ""}
          </p>
          {invoice.status === "cancelled" && invoice.cancelReason && (
            <p className="mt-1 text-[11px] text-red-600">Raison : {invoice.cancelReason}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <DocumentPreviewToggle visible={showPreview} onToggle={() => setShowPreview((value) => !value)} />
          {isDraft && (
            <IssueInvoiceDialog
              invoiceId={invoice.id}
              totalAmount={parseFloat(invoice.totalAmount)}
              onIssued={handleReload}
            />
          )}
          {isIssued && !isFullyPaid && (
            <RecordPaymentDialog invoiceId={invoice.id} onRecorded={handleReload} />
          )}
          {isIssued && !deliveryNote && (
            <Button size="sm" variant="outline" onClick={handleCreateBL} disabled={createBLMutation.isPending}>
              {createBLMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              Generer le BL
            </Button>
          )}
          {isIssued && (
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download size={13} /> PDF
            </a>
          )}
          {isIssued && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendInvoiceEmail}
              disabled={!hasRecipientEmail || sendEmailMutation.isPending}
              title={hasRecipientEmail ? "Envoyer la facture par email" : "Email client manquant"}
            >
              {sendEmailMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              Email facture
            </Button>
          )}
          {canCancel && <CancelInvoiceDialog invoiceId={invoice.id} onCancelled={handleReload} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DocumentKpiCard
          label="Total facture"
          value={money(invoice.totalAmount)}
          detail={lineSummary(invoice.lines)}
          icon={ReceiptText}
          tone="gold"
        />
        <DocumentKpiCard
          label="Solde ouvert"
          value={money(openAmount)}
          detail={installments.length > 0 ? `${installments.length} echeance${installments.length > 1 ? "s" : ""}` : PAYMENT_LABELS[invoice.paymentStatus]}
          icon={Banknote}
          tone={openAmount > 0 ? "warning" : "success"}
        />
        <DocumentKpiCard
          label="Echeance"
          value={fmtDate(invoice.dueDate)}
          detail={isOverdue ? "Paiement en retard" : "Date de paiement"}
          icon={CalendarClock}
          tone={isOverdue ? "danger" : "neutral"}
        />
        <DocumentKpiCard
          label="Livraison"
          value={deliveryNote ? deliveryNote.number ?? `BL #${deliveryNote.id}` : isIssued ? "A generer" : "Non emise"}
          detail={deliveryNote ? `Genere le ${fmtDate(deliveryNote.issuedAt)}` : "Bon de livraison"}
          icon={Truck}
          tone={deliveryNote ? "success" : "neutral"}
        />
      </div>

      {isDraft && !isEditableDraft && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
          Cette facture provient d'un proforma valide par le client. Ses lignes sont verrouillees.
          Pour un changement, creez un nouveau proforma.
        </p>
      )}

      {deliveryNote && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Bon de livraison {deliveryNote.number} genere le {fmtDate(deliveryNote.issuedAt)}
          </span>

          <a
            href={`/api/delivery-notes/invoice/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-800 underline hover:text-emerald-900"
          >
            Voir le PDF
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendDeliveryNoteEmail}
            disabled={!hasRecipientEmail || sendEmailMutation.isPending}
            title={hasRecipientEmail ? "Envoyer le BL par email" : "Email client manquant"}
          >
            {sendEmailMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            Envoyer le BL
          </Button>
        </div>
      )}

      <div className={cn("grid gap-5", showPreview && "xl:grid-cols-[minmax(0,1fr)_420px]")}>
        <div className="space-y-4">
          <DocumentPartySummary
            title="Client facture"
            name={invoice.partySnapshot?.fullName}
            phone={invoice.partySnapshot?.phone}
            email={invoice.partySnapshot?.email}
            referrer={referrer?.fullName}
          />

          {isIssued && <PaymentPlanCard installments={installments} onChanged={handleReload} />}

          <section className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-neutral-950">Lignes de facture</h2>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  Services factures, quantites, remises et totaux.
                </p>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                      Qte
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
                    {isEditableDraft && <th className="px-4 py-2.5 w-20" />}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.length === 0 ? (
                    <tr>
                      <td colSpan={isEditableDraft ? 6 : 5} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                        Aucune ligne.
                      </td>
                    </tr>
                  ) : (
                    invoice.lines.map((l) => (
                      <LineRow
                        key={l.id}
                        line={l}
                        canEdit={isEditableDraft}
                        canDiscount={Boolean(canDiscount)}
                        saving={updateLineMutation.isPending}
                        isEditing={editingLineId === l.id}
                        editDraft={editDraft}
                        setEditDraft={setEditDraft}
                        onEdit={() => startEdit(l)}
                        onSave={() => handleSaveEdit(l.id)}
                        onCancel={() => setEditingLineId(null)}
                        onRemove={() => handleRemoveLine(l.id)}
                      />
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50">
                    <td
                      colSpan={isEditableDraft ? 5 : 4}
                      className="px-4 py-2.5 text-right text-[12px] font-semibold text-neutral-800"
                    >
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-bold text-brand-gold-dark">
                      {money(invoice.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {invoice.lines.length === 0 ? (
                <DocumentEmptyState title="Aucune ligne" description="Ajoutez un service avant emission de la facture." />
              ) : (
                invoice.lines.map((line) => (
                  <DocumentLineCard
                    key={line.id}
                    line={line}
                    actions={
                      isEditableDraft ? (
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(line)} title="Modifier">
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLine(line.id)}
                            className="text-red-500 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      ) : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>

          {isEditableDraft && (
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-[12px] font-semibold text-neutral-900">Ajouter une ligne</p>
              <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_90px_140px_120px_auto]">
                <Input
                  placeholder="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Qte"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  min={1}
                />
                <Input
                  type="number"
                  placeholder="Prix unitaire"
                  value={newPrice || ""}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                />
                {canDiscount && (
                  <Input
                    type="number"
                    placeholder="Remise"
                    value={newDiscount || ""}
                    onChange={(e) => setNewDiscount(parseFloat(e.target.value) || 0)}
                  />
                )}
                <Button
                  size="sm"
                  onClick={handleAddLine}
                  disabled={addLineMutation.isPending || !newDesc || newPrice <= 0}
                >
                  {addLineMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </Button>
              </div>
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] text-amber-800">
                Pour un billet ou un article de stock avec passager designe, la capture complete se fait a la
                creation de la facture.
              </p>
            </section>
          )}
        </div>

        {showPreview && (
          <DocumentPaperPreview
            title="Facture"
            number={invoice.number ?? `Brouillon #${invoice.id}`}
            status={<DocumentStatusBadge label={STATUS_LABELS[invoice.status]} tone={STATUS_TONES[invoice.status]} />}
            partyName={invoice.partySnapshot?.fullName}
            partyContact={invoice.partySnapshot?.phone ?? invoice.partySnapshot?.email}
            issuedLabel={fmtDate(invoice.issuedAt ?? invoice.createdAt)}
            dueLabel={fmtDate(invoice.dueDate)}
            lines={invoice.lines}
            total={money(invoice.totalAmount)}
            footer={
              <div className="space-y-1">
                <p>Statut paiement : {PAYMENT_LABELS[invoice.paymentStatus]}</p>
                {deliveryNote && <p>Bon de livraison : {deliveryNote.number ?? `BL #${deliveryNote.id}`}</p>}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

function LineRow({
  line,
  canEdit,
  canDiscount,
  saving,
  isEditing,
  editDraft,
  setEditDraft,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  line: DocumentLineView;
  canEdit: boolean;
  canDiscount: boolean;
  saving: boolean;
  isEditing: boolean;
  editDraft: LineDraft;
  setEditDraft: (draft: LineDraft) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  if (isEditing) {
    return (
      <tr className="border-b border-neutral-100 bg-amber-50/40 last:border-0">
        <td className="px-4 py-2">
          <Input
            value={editDraft.description}
            onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
            className="h-8 text-[12px]"
          />
        </td>
        <td className="px-4 py-2">
          <Input
            type="number"
            value={editDraft.quantity}
            onChange={(e) => setEditDraft({ ...editDraft, quantity: parseInt(e.target.value) || 1 })}
            className="h-8 text-right text-[12px]"
            min={1}
          />
        </td>
        <td className="px-4 py-2">
          <Input
            type="number"
            value={editDraft.unitPrice}
            onChange={(e) => setEditDraft({ ...editDraft, unitPrice: parseFloat(e.target.value) || 0 })}
            className="h-8 text-right text-[12px]"
          />
        </td>
        <td className="px-4 py-2">
          <Input
            type="number"
            value={editDraft.discount}
            onChange={(e) => setEditDraft({ ...editDraft, discount: parseFloat(e.target.value) || 0 })}
            className="h-8 text-right text-[12px]"
            disabled={!canDiscount}
          />
        </td>
        <td className="px-4 py-2 text-right text-[12px] font-medium text-neutral-800">
          {money((editDraft.unitPrice || 0) * (editDraft.quantity || 1) - (editDraft.discount || 0))}
        </td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <Button variant="ghost" size="icon" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={saving}>
            <X size={13} />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-4 py-2.5 text-[12px] text-neutral-800">{line.description}</td>
      <td className="px-4 py-2.5 text-right text-[12px] text-neutral-500">{line.quantity}</td>
      <td className="px-4 py-2.5 text-right text-[12px] text-neutral-500">{money(line.unitPrice)}</td>
      <td className="px-4 py-2.5 text-right text-[12px] text-neutral-500">
        {parseFloat(line.discount) > 0 ? `-${money(line.discount)}` : "-"}
      </td>
      <td className="px-4 py-2.5 text-right text-[12px] font-medium text-neutral-800">
        {money(line.lineTotal)}
      </td>
      {canEdit && (
        <td className="px-4 py-2.5 text-right whitespace-nowrap">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Modifier">
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500 hover:bg-red-50"
            title="Supprimer"
          >
            <Trash2 size={13} />
          </Button>
        </td>
      )}
    </tr>
  );
}
