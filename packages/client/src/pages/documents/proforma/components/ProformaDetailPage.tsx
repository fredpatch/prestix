import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRightCircle,
  CalendarClock,
  Check,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type DocumentLineView, type Proforma } from "@/lib/proforma.api";
import { Party, partyApi } from "@/lib/party.api";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { cn } from "@/lib/utils";
import { useProforma } from "@/hooks/queries/useProforma";
import { usePromoteProformaMutation } from "@/hooks/mutations/usePromoteProforma";
import { useAddProformaLineMutation } from "@/hooks/mutations/useAddProformaLine";
import { useUpdateProformaLineMutation } from "@/hooks/mutations/useUpdateProformaLine";
import { useRemoveProformaLineMutation } from "@/hooks/mutations/useRemoveProformaLine";
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

const STATUS_LABELS: Record<Proforma["status"], string> = {
  draft: "Valide",
  issued: "Emise",
  expired: "Expiree",
  cancelled: "Annulee",
};

const STATUS_TONES: Record<Proforma["status"], DocumentTone> = {
  draft: "blue",
  issued: "success",
  expired: "warning",
  cancelled: "danger",
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

export default function ProformaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const proformaId = id ? parseInt(id) : undefined;
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState<Party | null>(null);

  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<LineDraft>({ description: "", quantity: 1, unitPrice: 0, discount: 0 });

  const [adding, setAdding] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [newLine, setNewLine] = useState<LineDraft>({ description: "", quantity: 1, unitPrice: 0, discount: 0 });

  const { data: proforma, isLoading } = useProforma(proformaId);
  const promoteMutation = usePromoteProformaMutation();
  const addLineMutation = useAddProformaLineMutation(proformaId ?? -1);
  const updateLineMutation = useUpdateProformaLineMutation(proformaId ?? -1);
  const removeLineMutation = useRemoveProformaLineMutation(proformaId ?? -1);

  useEffect(() => {
    let cancelled = false;
    setReferrer(null);

    if (!proforma?.referrerPartyId) return;

    partyApi.getById(proforma.referrerPartyId).then((r) => {
      if (!cancelled) setReferrer(r.data);
    });

    return () => {
      cancelled = true;
    };
  }, [proforma?.referrerPartyId]);

  usePageHeader({ title: proforma?.number ?? "Proforma", backTo: "/proformas" });

  function handlePromote() {
    if (!proforma) return;
    promoteMutation.mutate(proforma.id, {
      onSuccess: (invoice) => navigate(`/invoices/${invoice.id}`),
    });
  }

  function handleAddLine() {
    if (!proforma) return;
    addLineMutation.mutate(
      { lineType: "shop", ...newLine },
      {
        onSuccess: () => {
          setAdding(false);
          setNewLine({ description: "", quantity: 1, unitPrice: 0, discount: 0 });
        },
      },
    );
  }

  function startEdit(l: DocumentLineView) {
    setEditingLineId(l.id);
    setEditDraft(toDraft(l));
  }

  function handleSaveEdit(lineId: number) {
    if (!proforma) return;
    updateLineMutation.mutate(
      { lineId, patch: editDraft },
      { onSuccess: () => setEditingLineId(null) },
    );
  }

  function handleRemoveLine(lineId: number) {
    if (!proforma) return;
    removeLineMutation.mutate(lineId);
  }

  if (isLoading || !proforma) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const total = documentTotal(proforma.lines);
  const canPromote = proforma.status === "draft";
  const canEdit = proforma.status === "draft";
  const savingLine = updateLineMutation.isPending || addLineMutation.isPending;
  const expiresAt = proforma.expiresAt ? new Date(proforma.expiresAt).getTime() : undefined;
  const isExpiredSoon = Boolean(expiresAt && expiresAt - Date.now() <= 3 * 86_400_000 && expiresAt > Date.now());

  return (
    <div className="space-y-5">
      <div className="grid gap-4 border-b border-neutral-200 pb-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge label={STATUS_LABELS[proforma.status]} tone={STATUS_TONES[proforma.status]} />
            {isExpiredSoon && <DocumentStatusBadge label="Expiration proche" tone="warning" />}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-neutral-500">
            {proforma.partySnapshot?.fullName ?? "Client non renseigne"} / creee le{" "}
            {fmtDateTime(proforma.createdAt)}
            {proforma.expiresAt ? ` / expire le ${fmtDate(proforma.expiresAt)}` : ""}
            {referrer ? ` / referent : ${referrer.fullName}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DocumentPreviewToggle visible={showPreview} onToggle={() => setShowPreview((value) => !value)} />
          <a
            href={`/api/proformas/${proforma.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download size={13} /> PDF
          </a>
          {canPromote && (
            <Button size="sm" onClick={handlePromote} disabled={promoteMutation.isPending}>
              {promoteMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ArrowRightCircle size={13} />
              )}
              Promouvoir en facture
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DocumentKpiCard
          label="Total proforma"
          value={money(total)}
          detail="Montant avant facture"
          icon={ReceiptText}
          tone="gold"
        />
        <DocumentKpiCard
          label="Lignes"
          value={String(proforma.lines.length)}
          detail={lineSummary(proforma.lines)}
          icon={FileText}
          tone="neutral"
        />
        <DocumentKpiCard
          label="Validite"
          value={proforma.expiresAt ? fmtDate(proforma.expiresAt) : "-"}
          detail={proforma.status === "draft" ? "Encore modifiable" : STATUS_LABELS[proforma.status]}
          icon={CalendarClock}
          tone={isExpiredSoon ? "warning" : STATUS_TONES[proforma.status]}
        />
        <DocumentKpiCard
          label="Conversion"
          value={canPromote ? "Disponible" : "Bloquee"}
          detail={canPromote ? "Peut devenir facture" : "Etat actuel non promouvable"}
          icon={ArrowRightCircle}
          tone={canPromote ? "success" : "neutral"}
        />
      </div>

      {proforma.status === "expired" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
          Cette proforma est expiree. Creez une nouvelle proforma si le client confirme la demande.
        </p>
      )}
      {proforma.status === "cancelled" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] text-red-700">
          Cette proforma est annulee. Les actions de modification et de promotion sont bloquees.
        </p>
      )}

      <div className={cn("grid gap-5", showPreview && "xl:grid-cols-[minmax(0,1fr)_420px]")}>
        <div className="space-y-4">
          <DocumentPartySummary
            title="Client"
            name={proforma.partySnapshot?.fullName}
            phone={proforma.partySnapshot?.phone}
            email={proforma.partySnapshot?.email}
            referrer={referrer?.fullName}
          />

          <section className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-neutral-950">Lignes de proforma</h2>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  Services, billets et articles inclus dans cette proforma.
                </p>
              </div>
              {canEdit && !adding && (
                <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                  <Plus size={13} /> Ajouter
                </Button>
              )}
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
                    {canEdit && <th className="px-4 py-2.5 w-20" />}
                  </tr>
                </thead>
                <tbody>
                  {proforma.lines.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                        Aucune ligne.
                      </td>
                    </tr>
                  ) : (
                    proforma.lines.map((l) => (
                      <LineRow
                        key={l.id}
                        line={l}
                        canEdit={canEdit}
                        saving={savingLine}
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
                      colSpan={canEdit ? 5 : 4}
                      className="px-4 py-2.5 text-right text-[12px] font-semibold text-neutral-800"
                    >
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-bold text-brand-gold-dark">
                      {money(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {proforma.lines.length === 0 ? (
                <DocumentEmptyState title="Aucune ligne" description="Ajoutez un service pour completer la proforma." />
              ) : (
                proforma.lines.map((line) => (
                  <DocumentLineCard
                    key={line.id}
                    line={line}
                    actions={
                      canEdit ? (
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

          {canEdit && (
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              {adding ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-900">Nouvelle ligne</p>
                    <p className="mt-0.5 text-[10.5px] text-neutral-500">
                      Ajout generique pour service ou article simple.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_90px_140px_120px_auto_auto]">
                    <Input
                      placeholder="Description"
                      value={newLine.description}
                      onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Qte"
                      value={newLine.quantity}
                      onChange={(e) => setNewLine({ ...newLine, quantity: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Prix unitaire"
                      value={newLine.unitPrice || ""}
                      onChange={(e) => setNewLine({ ...newLine, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      placeholder="Remise"
                      value={newLine.discount || ""}
                      onChange={(e) => setNewLine({ ...newLine, discount: parseFloat(e.target.value) || 0 })}
                    />
                    <Button size="sm" onClick={handleAddLine} disabled={savingLine || !newLine.description || newLine.unitPrice <= 0}>
                      {savingLine ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setAdding(false)} disabled={savingLine}>
                      Annuler
                    </Button>
                  </div>
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] text-amber-800">
                    Pour un billet ou un article de stock avec passager designe, utilisez une nouvelle proforma.
                    Le formulaire complet n'est pas encore disponible en edition.
                  </p>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                  <Plus size={13} /> Ajouter une ligne
                </Button>
              )}
            </section>
          )}
        </div>

        {showPreview && (
          <DocumentPaperPreview
            title="Proforma"
            number={proforma.number}
            status={<DocumentStatusBadge label={STATUS_LABELS[proforma.status]} tone={STATUS_TONES[proforma.status]} />}
            partyName={proforma.partySnapshot?.fullName}
            partyContact={proforma.partySnapshot?.phone ?? proforma.partySnapshot?.email}
            issuedLabel={fmtDate(proforma.createdAt)}
            dueLabel={fmtDate(proforma.expiresAt)}
            lines={proforma.lines}
            total={money(total)}
            footer="Document commercial avant emission de facture."
          />
        )}
      </div>
    </div>
  );
}

function LineRow({
  line,
  canEdit,
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
