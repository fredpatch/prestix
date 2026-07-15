import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRightCircle, Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { proformaApi, type DocumentLineView, type Proforma } from "@/lib/proforma.api";
import { invoiceApi } from "@/lib/invoice.api";
import { Party, partyApi } from "@/lib/party.api";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<Proforma["status"], string> = {
  draft: "Valide",
  issued: "Valide",
  expired: "Expiré",
  cancelled: "Annulé",
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
  const navigate = useNavigate();
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [referrer, setReferrer] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<LineDraft>({ description: "", quantity: 1, unitPrice: 0, discount: 0 });
  const [savingLine, setSavingLine] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newLine, setNewLine] = useState<LineDraft>({ description: "", quantity: 1, unitPrice: 0, discount: 0 });

  usePageHeader({ title: proforma?.number ?? "Proforma", backTo: "/proformas" });

  function load() {
    proformaApi.getById(parseInt(id!)).then((res) => {
      setProforma(res.data);
      setLoading(false);

      if (res.data.referrerPartyId) {
        partyApi.getById(res.data.referrerPartyId).then((r) => setReferrer(r.data));
      }
    });
  }

  useEffect(load, [id]);

  async function handlePromote() {
    if (!proforma) return;
    setPromoting(true);
    setError(null);
    try {
      const res = await invoiceApi.promoteFromProforma(proforma.id);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la promotion.",
      );
      setPromoting(false);
    }
  }

  async function handleAddLine() {
    if (!proforma) return;
    setSavingLine(true);
    setError(null);
    try {
      await proformaApi.addLine(proforma.id, { lineType: "shop", ...newLine });
      setAdding(false);
      setNewLine({ description: "", quantity: 1, unitPrice: 0, discount: 0 });
      load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de l'ajout de la ligne.",
      );
    } finally {
      setSavingLine(false);
    }
  }

  function startEdit(l: DocumentLineView) {
    setEditingLineId(l.id);
    setEditDraft(toDraft(l));
    setError(null);
  }

  async function handleSaveEdit(lineId: number) {
    if (!proforma) return;
    setSavingLine(true);
    setError(null);
    try {
      await proformaApi.updateLine(proforma.id, lineId, editDraft);
      setEditingLineId(null);
      load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la modification.",
      );
    } finally {
      setSavingLine(false);
    }
  }

  async function handleRemoveLine(lineId: number) {
    if (!proforma) return;
    setError(null);
    try {
      await proformaApi.removeLine(proforma.id, lineId);
      load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la suppression.",
      );
    }
  }

  if (loading || !proforma) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const total = proforma.lines.reduce((sum, l) => sum + parseFloat(l.lineTotal), 0);
  const canPromote = proforma.status === "draft"; // expired/cancelled blocked server-side too
  // Editability is enforced server-side (expired/cancelled/already-promoted all
  // rejected there) — this is just the UI's best guess to hide controls when
  // they'd obviously fail; a stale "still draft" client view attempting an edit
  // against an already-promoted proforma still gets a clean server error.
  const canEdit = proforma.status === "draft";

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-neutral-500 text-sm mt-0.5">
            {proforma.partySnapshot?.fullName} · {STATUS_LABELS[proforma.status]}
            {proforma.expiresAt &&
              ` · expire le ${new Date(proforma.expiresAt).toLocaleString("fr-FR")}`}
            {referrer && ` · référent : ${referrer.fullName}`}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/proformas/${proforma.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download size={13} /> PDF
          </a>
          {canPromote && (
            <Button size="sm" onClick={handlePromote} disabled={promoting}>
              {promoting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ArrowRightCircle size={13} />
              )}
              Promouvoir en facture
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600 mb-3">{error}</p>}

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
              {canEdit && <th className="px-4 py-2.5 w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {proforma.lines.map((l) => {
              const isEditing = editingLineId === l.id;
              if (isEditing) {
                return (
                  <tr key={l.id} className="border-b border-neutral-100 last:border-0 bg-amber-50/40">
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
                        className="h-8 text-[12px] text-right"
                        min={1}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={editDraft.unitPrice}
                        onChange={(e) => setEditDraft({ ...editDraft, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-[12px] text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={editDraft.discount}
                        onChange={(e) => setEditDraft({ ...editDraft, discount: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-[12px] text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-[12px] font-medium text-neutral-800 text-right">
                      {((editDraft.unitPrice || 0) * (editDraft.quantity || 1) - (editDraft.discount || 0)).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(l.id)} disabled={savingLine}>
                        {savingLine ? <Loader2 size={13} className="animate-spin" /> : "✓"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingLineId(null)} disabled={savingLine}>
                        ✕
                      </Button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={l.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2.5 text-[12px] text-neutral-800">{l.description}</td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 text-right">{l.quantity}</td>
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
                  {canEdit && (
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(l)} title="Modifier">
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLine(l.id)}
                        className="text-red-500 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50">
              <td
                colSpan={canEdit ? 5 : 4}
                className="px-4 py-2.5 text-[12px] font-semibold text-neutral-800 text-right"
              >
                Total
              </td>
              <td className="px-4 py-2.5 text-[13px] font-bold text-brand-gold-dark text-right">
                {total.toLocaleString("fr-FR")} XAF
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {canEdit && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          {adding ? (
            <div className="space-y-2">
              <p className="text-[11.5px] font-medium text-neutral-800 mb-1.5">Nouvelle ligne</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Description"
                  value={newLine.description}
                  onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qté"
                  value={newLine.quantity}
                  onChange={(e) => setNewLine({ ...newLine, quantity: parseInt(e.target.value) || 1 })}
                  className="w-20"
                  min={1}
                />
                <Input
                  type="number"
                  placeholder="Prix unitaire"
                  value={newLine.unitPrice || ""}
                  onChange={(e) => setNewLine({ ...newLine, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-32"
                />
                <Input
                  type="number"
                  placeholder="Remise"
                  value={newLine.discount || ""}
                  onChange={(e) => setNewLine({ ...newLine, discount: parseFloat(e.target.value) || 0 })}
                  className="w-28"
                />
                <Button size="sm" onClick={handleAddLine} disabled={savingLine || !newLine.description || newLine.unitPrice <= 0}>
                  {savingLine ? <Loader2 size={13} className="animate-spin" /> : "✓"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAdding(false)} disabled={savingLine}>
                  Annuler
                </Button>
              </div>
              <p className="text-[10.5px] text-neutral-500">
                Pour un billet ou un article de stock avec passager désigné, utilisez plutôt une nouvelle proforma
                (le formulaire complet n'est pas encore disponible en édition).
              </p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus size={13} /> Ajouter une ligne
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
